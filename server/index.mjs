#!/usr/bin/env node
/**
 * Backend do Fluente para rodar no SEU computador.
 * As chaves ficam só aqui (arquivo .env ou variáveis de ambiente); o navegador nunca as vê.
 *   ELEVENLABS_API_KEY  → vozes naturais e transcrição (opcional)
 *   ANTHROPIC_API_KEY   → Claude: avalia frases, colegas que improvisam, correção extra (opcional)
 *
 *   GET  /api/health                → quais recursos de IA estão ativos
 *   POST /api/llm                    → texto do Claude para um prompt do app ({prompt, tier})
 *   GET  /api/tts?text=&voice=&lang= → mp3 (ElevenLabs), com cache em disco
 *   POST /api/stt                    → transcrição (ElevenLabs Scribe) de um áudio gravado
 *   GET  /api/teacher                → URL assinada para conversar com o professor (agente)
 *   *                                → arquivos de dist/ (SPA)
 *
 * Uso: npm run build && ELEVENLABS_API_KEY=... npm start   (porta 8787)
 */
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

// .env na raiz do projeto (KEY=valor por linha). Variáveis já definidas no sistema têm prioridade.
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined && v) process.env[m[1]] = v;
  }
}
const dist = join(root, 'dist');
const cacheDir = join(root, '.cache', 'tts');
mkdirSync(cacheDir, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY || '';
const PORT = Number(process.env.PORT || 8787);
export const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'agent_2001m7cr5kzdf2srmtvn4p87nxzr';
const API = 'https://api.elevenlabs.io';

const VOICES = {
  bella: 'hpp4J3VqNfWAUOO0d1Us',
  daniel: 'onwK4e9ZLuTAKqWW03F9',
  matilda: 'XrExE9yKIg1WjnnlVkGX',
};
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

// limite simples por IP para não queimar créditos por abuso
const hits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) if (!arr.some((t) => now - t < 60_000)) hits.delete(ip);
}, 60_000).unref();

/** Teto diário GLOBAL de gasto na ElevenLabs (caracteres de TTS + chamadas de STT), além do limite por IP. */
const DAILY_TTS_CHARS = Number(process.env.TTS_DAILY_CHARS || 60_000);
const DAILY_STT_CALLS = Number(process.env.STT_DAILY_CALLS || 400);
const DAILY_LLM_CALLS = Number(process.env.LLM_DAILY_CALLS || 400);
const spend = { day: '', chars: 0, stt: 0, llm: 0 };
function overBudget(kind, amount) {
  const day = new Date().toISOString().slice(0, 10);
  if (spend.day !== day) Object.assign(spend, { day, chars: 0, stt: 0, llm: 0 });
  if (kind === 'tts') {
    if (spend.chars + amount > DAILY_TTS_CHARS) return true;
    spend.chars += amount;
    return false;
  }
  const limit = kind === 'stt' ? DAILY_STT_CALLS : DAILY_LLM_CALLS;
  if (spend[kind] + 1 > limit) return true;
  spend[kind] += 1;
  return false;
}

/* ---------------- Claude (SDK oficial da Anthropic) ---------------- */
const LLM_ON = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const LLM_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
let anthropic = null;

/** O app manda o mesmo prompt que mandaria ao Claude do artefato; aqui ele vai pela API com a sua chave. */
async function llm(req, res) {
  if (!LLM_ON) return json(res, 503, { error: 'ANTHROPIC_API_KEY não configurada' });
  if (foreignOrigin(req)) return json(res, 403, { error: 'origem não permitida' });
  let body;
  try {
    body = JSON.parse((await readBody(req, 300_000)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'json inválido' });
  }
  const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 80_000) : '';
  if (!prompt.trim()) return json(res, 400, { error: 'prompt vazio' });
  if (overBudget('llm')) return json(res, 429, { error: 'limite diário de IA atingido' });
  anthropic ??= new Anthropic();
  try {
    const r = await anthropic.beta.messages.create({
      model: LLM_MODEL,
      max_tokens: 16000,
      // turnos de conversa ("quick") precisam de resposta rápida; avaliação pode pensar mais
      output_config: { effort: body.tier === 'quick' ? 'low' : 'medium' },
      // se o modelo recusar por política, a própria API tenta de novo num modelo de reserva
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [{ role: 'user', content: prompt }],
    });
    if (r.stop_reason === 'refusal') return json(res, 422, { error: 'pedido recusado pelo modelo' });
    const text = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return json(res, 200, { text });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json(res, 401, { error: 'chave da Anthropic inválida' });
    if (e instanceof Anthropic.RateLimitError) return json(res, 429, { error: 'limite da API da Anthropic, tente em instantes' });
    if (e instanceof Anthropic.APIError) return json(res, 502, { error: `erro da API da Anthropic (${e.status ?? '?'})` });
    return json(res, 502, { error: 'falha ao falar com a API da Anthropic' });
  }
}

/** Só a própria página pode gastar créditos: pedido com Origin de outro site é recusado. */
function foreignOrigin(req) {
  const o = req.headers.origin;
  if (!o) return false;
  try {
    return new URL(o).host !== req.headers.host;
  } catch {
    return true;
  }
}

function rateLimited(ip, max = 120) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req, limit = 10 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new Error('payload too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

async function tts(req, res, url) {
  const text = (url.searchParams.get('text') || '').slice(0, 600);
  const voiceName = url.searchParams.get('voice') || 'bella';
  const lang = url.searchParams.get('lang') || 'en';
  if (!text.trim()) return json(res, 400, { error: 'text vazio' });
  const voice = VOICES[voiceName] || VOICES.bella;
  // narração em PT (vídeo-aula) usa o modelo multilíngue; frases curtas em EN usam o flash (mais barato)
  const model = lang === 'pt' ? 'eleven_multilingual_v2' : 'eleven_flash_v2_5';
  const file = join(cacheDir, createHash('sha1').update(`${text}|${voice}|${model}`).digest('hex') + '.mp3');
  if (existsSync(file)) {
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-cache': 'hit' });
    return res.end(readFileSync(file));
  }
  if (!KEY) return json(res, 503, { error: 'ELEVENLABS_API_KEY não configurada' });
  if (foreignOrigin(req)) return json(res, 403, { error: 'origem não permitida' });
  if (overBudget('tts', text.length)) return json(res, 429, { error: 'limite diário de voz atingido' });
  const r = await fetch(`${API}/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model, ...(model === 'eleven_flash_v2_5' ? { language_code: 'en' } : {}), voice_settings: { stability: 0.55, similarity_boost: 0.8, speed: lang === 'pt' ? 1 : 0.95 } }),
  });
  if (!r.ok) return json(res, 502, { error: `ElevenLabs ${r.status}`, detail: (await r.text()).slice(0, 300) });
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(file, buf);
  res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-cache': 'miss' });
  res.end(buf);
}

async function stt(req, res) {
  if (!KEY) return json(res, 503, { error: 'ELEVENLABS_API_KEY não configurada' });
  if (foreignOrigin(req)) return json(res, 403, { error: 'origem não permitida' });
  if (overBudget('stt')) return json(res, 429, { error: 'limite diário de transcrição atingido' });
  const audio = await readBody(req);
  const type = req.headers['content-type'] || 'audio/webm';
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'en');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  form.append('file', new Blob([audio], { type }), 'speech.' + (type.includes('mp4') ? 'mp4' : 'webm'));
  const r = await fetch(`${API}/v1/speech-to-text`, { method: 'POST', headers: { 'xi-api-key': KEY }, body: form });
  if (!r.ok) return json(res, 502, { error: `ElevenLabs ${r.status}`, detail: (await r.text()).slice(0, 300) });
  const data = await r.json();
  json(res, 200, {
    text: data.text,
    language: data.language_code,
    languageProbability: data.language_probability,
    words: (data.words || []).filter((w) => w.type === 'word').map((w) => ({ text: w.text, start: w.start, end: w.end, logprob: w.logprob })),
  });
}

async function teacher(req, res) {
  if (!KEY) return json(res, 200, { agentId: AGENT_ID, mode: 'public' });
  const r = await fetch(`${API}/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`, { headers: { 'xi-api-key': KEY } });
  if (!r.ok) return json(res, 200, { agentId: AGENT_ID, mode: 'public' });
  const { signed_url } = await r.json();
  json(res, 200, { signedUrl: signed_url, mode: 'signed' });
}

function serveStatic(req, res, url) {
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  if (!existsSync(file)) return json(res, 404, { error: 'rode npm run build antes' });
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}

export const server = createServer(async (req, res) => {
  const ip = req.socket.remoteAddress || '?';
  try {
    // "GET //" ou URL malformada não pode derrubar o processo
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      if (rateLimited(ip)) return json(res, 429, { error: 'muitas requisições, aguarde um minuto' });
      if (url.pathname === '/api/health') return json(res, 200, { tts: !!KEY, stt: !!KEY, llm: LLM_ON, teacher: true, agentId: AGENT_ID });
      if (url.pathname === '/api/llm' && req.method === 'POST') return await llm(req, res);
      if (url.pathname === '/api/tts' && req.method === 'GET') return await tts(req, res, url);
      if (url.pathname === '/api/stt' && req.method === 'POST') return await stt(req, res);
      if (url.pathname === '/api/teacher') return await teacher(req, res);
      return json(res, 404, { error: 'rota desconhecida' });
    }
    serveStatic(req, res, url);
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // só este computador acessa (as rotas de IA gastam os seus créditos); HOST=0.0.0.0 abre para a rede
  const HOST = process.env.HOST || '127.0.0.1';
  server.listen(PORT, HOST, () => {
    console.log(`\nFluente rodando em http://localhost:${PORT}`);
    console.log(`  Vozes ElevenLabs: ${KEY ? 'ativas' : 'desligadas (usa a voz do sistema)'}`);
    console.log(`  Claude (IA):      ${LLM_ON ? `ativo (${LLM_MODEL})` : 'desligado (só correção por regras)'}`);
    console.log('  Para parar: Ctrl+C\n');
  });
}
