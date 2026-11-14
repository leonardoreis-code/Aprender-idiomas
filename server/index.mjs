#!/usr/bin/env node
/**
 * Backend mínimo do Fluente (Node puro, sem dependências).
 * A chave da ElevenLabs fica SÓ aqui (variável ELEVENLABS_API_KEY); o navegador nunca a vê.
 *
 *   GET  /api/health                → quais recursos de IA estão ativos
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

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
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
  const url = new URL(req.url, 'http://localhost');
  const ip = req.socket.remoteAddress || '?';
  try {
    if (url.pathname.startsWith('/api/')) {
      if (rateLimited(ip)) return json(res, 429, { error: 'muitas requisições, aguarde um minuto' });
      if (url.pathname === '/api/health') return json(res, 200, { tts: !!KEY, stt: !!KEY, teacher: true, agentId: AGENT_ID });
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
  server.listen(PORT, () => console.log(`Fluente em http://localhost:${PORT}  (IA: ${KEY ? 'ativa' : 'sem chave — usa voz do sistema'})`));
}
