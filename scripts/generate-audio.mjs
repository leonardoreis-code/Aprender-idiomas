#!/usr/bin/env node
/**
 * Gera o áudio do curso com a API da ElevenLabs.
 *
 *   ELEVENLABS_API_KEY=xxx npm run audio            # gera o que falta
 *   npm run audio -- --dry-run                      # só estima caracteres/créditos
 *   npm run audio -- --lessons                      # também narra as áudio-aulas (PT-BR)
 *
 * - Idempotente: arquivo nomeado por hash(texto+voz+modelo); se existe, pula.
 * - Itens e frases: 2 vozes (americana + britânica) → variabilidade de falantes (HVPT).
 * - Pares mínimos: 3 vozes.
 * - A chave NUNCA vai para o navegador: o app só lê mp3 estáticos + manifest.json.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/audio');
const ttsDir = join(outDir, 'tts');
const lessonsDir = join(outDir, 'lessons');
const manifestPath = join(outDir, 'manifest.json');

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');
const LESSONS = args.has('--lessons');
const KEY = process.env.ELEVENLABS_API_KEY;

// Vozes premade da ElevenLabs (verificadas via API em nov/2026).
const VOICES = {
  bella: 'hpp4J3VqNfWAUOO0d1Us', // americana, clara, educacional
  daniel: 'onwK4e9ZLuTAKqWW03F9', // britânico, firme
  matilda: 'XrExE9yKIg1WjnnlVkGX', // americana, alto
};
const WORD_MODEL = 'eleven_flash_v2_5'; // barato (~0,5 crédito/caractere), ótimo para frases curtas
const LESSON_MODEL = 'eleven_multilingual_v2'; // mistura PT-BR + EN com naturalidade

const audioKey = (t) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);

async function loadCourse() {
  // Compila o curso TypeScript para ESM em memória via Vite (sem duplicar dados).
  const res = await build({
    root,
    logLevel: 'silent',
    configFile: false,
    build: { write: false, ssr: join(root, 'src/content/en/course.ts'), rollupOptions: { output: { format: 'es' } } },
  });
  const code = (Array.isArray(res) ? res[0] : res).output[0].code;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  return mod.englishCourse;
}

async function tts(text, voiceId, modelId, file) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: modelId,
      language_code: modelId === WORD_MODEL ? 'en' : undefined,
      voice_settings: { stability: 0.6, similarity_boost: 0.8, speed: modelId === WORD_MODEL ? 0.92 : 1 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

const course = await loadCourse();
const jobs = []; // { text, voices[], model, dir, key }

for (const unit of course.units) {
  for (const lesson of unit.lessons) {
    for (const item of lesson.items) jobs.push({ text: item.en, voices: ['bella', 'daniel'], model: WORD_MODEL });
    for (const s of lesson.sentences) jobs.push({ text: s.en, voices: ['bella', 'daniel'], model: WORD_MODEL });
    for (const p of lesson.sound?.pairs ?? []) {
      for (const w of [p.a, p.b]) jobs.push({ text: w, voices: ['bella', 'daniel', 'matilda'], model: WORD_MODEL });
    }
  }
}

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const seen = new Set();
let chars = 0;
let todo = 0;
mkdirSync(ttsDir, { recursive: true });
mkdirSync(lessonsDir, { recursive: true });

for (const job of jobs) {
  const k = audioKey(job.text);
  for (const v of job.voices) {
    const id = `${k}|${v}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const name = `${hash(job.text + VOICES[v] + job.model)}.mp3`;
    const file = join(ttsDir, name);
    const rel = `audio/tts/${name}`;
    manifest[k] = [...new Set([...(manifest[k] ?? []), rel])];
    if (existsSync(file)) continue;
    chars += job.text.length;
    todo++;
    if (!DRY) {
      if (!KEY) throw new Error('Defina ELEVENLABS_API_KEY (ou use --dry-run).');
      process.stdout.write(`→ ${v.padEnd(8)} ${job.text}\n`);
      await tts(job.text, VOICES[v], job.model, file);
    }
  }
}

if (LESSONS) {
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      if (!lesson.introScript) continue;
      const file = join(lessonsDir, `${lesson.id}-intro.mp3`);
      if (existsSync(file)) continue;
      chars += lesson.introScript.length;
      todo++;
      if (!DRY) {
        process.stdout.write(`→ aula     ${lesson.id}\n`);
        await tts(lesson.introScript, VOICES.bella, LESSON_MODEL, file);
      }
    }
  }
}

if (!DRY) writeFileSync(manifestPath, JSON.stringify(manifest, null, 0));
console.log(`\n${DRY ? '[dry-run] ' : ''}${todo} arquivos, ${chars} caracteres (~${Math.ceil(chars * (LESSONS ? 0.8 : 0.5))} créditos).`);
