#!/usr/bin/env node
/**
 * Gera a página do Artefato (claude.ai) a partir de dist/:
 *   npm run build && node scripts/build-artifact.mjs
 * Saída: dist-artifact/fluente.html + lista de arquivos a publicar (files.json).
 * O artefato envolve a página num esqueleto próprio, então aqui só vai o conteúdo do <body>.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'dist-artifact');
mkdirSync(out, { recursive: true });

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const js = html.match(/src="\.\/(assets\/index-[^"]+\.js)"/)[1];
const css = html.match(/href="\.\/(assets\/index-[^"]+\.css)"/)[1];

const page = `<title>Fluente</title>
<meta name="description" content="Aprenda a pensar e falar em inglês: escada de produção PT→EN, professora Maya, sotaque e curso completo.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${css}">
<div id="root"></div>
<noscript>Ative o JavaScript para usar o Fluente.</noscript>
<script type="module" src="${js}"></script>
`;
writeFileSync(join(out, 'fluente.html'), page);

const files = {};
for (const f of readdirSync(join(dist, 'assets'))) files[`assets/${f}`] = `dist/assets/${f}`;
files['audio/manifest.json'] = 'dist/audio/manifest.json';
if (existsSync(join(dist, 'audio/lessons'))) for (const f of readdirSync(join(dist, 'audio/lessons'))) files[`audio/lessons/${f}`] = `dist/audio/lessons/${f}`;
writeFileSync(join(out, 'files.json'), JSON.stringify(files, null, 2));
console.log(JSON.stringify(files, null, 2));
