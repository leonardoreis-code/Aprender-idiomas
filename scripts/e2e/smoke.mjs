// Gauntlet E2E v2: onboarding + nivelamento → dashboard → aula → prática PT→EN → vídeo → história → sotaque → perfil.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.URL ?? 'http://localhost:8787/';
const OUT = process.env.OUT ?? '.';
const W = Number(process.env.W ?? 420);
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: 880 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.stack?.split('\n').slice(0, 5).join(' | ') ?? e.message));
page.on('console', (m) => m.type() === 'error' && !/fonts|favicon|api\/tts|503|Failed to load resource/.test(m.text()) && errors.push(m.text()));
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: false });
const click = (role, name) => page.getByRole(role, { name }).first().click();

await page.goto(URL);
await shot('01-onboarding');
await page.fill('#ob-name', 'Leo');
await click('button', 'Continuar');
await page.getByRole('radio', { name: /Entendo lendo/ }).click();
await click('button', 'Continuar');
await page.getByRole('checkbox', { name: /Entrevista/ }).click();
await click('button', /nivelamento/);
for (const a of ["I'm from Brazil", 'She works at a bank', 'you like coffee', 'Yesterday I went to the office', 'x']) {
  await page.getByLabel('Sua tradução').fill(a);
  await click('button', 'Próxima');
}
await page.waitForTimeout(400);
await shot('02-dashboard');
await page.screenshot({ path: `${OUT}/02b-dashboard-full.png`, fullPage: true });

await page.goto(URL + '#/curso'); await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/03-curso.png`, fullPage: true });
await page.goto(URL + '#/aula/fala-01'); await page.waitForTimeout(300);
await shot('04-aula');
await page.screenshot({ path: `${OUT}/04b-aula-full.png`, fullPage: true });

// prática: resolve cada degrau digitando a resposta certa lida do conteúdo
await page.goto(URL + '#/pratica/fala-01'); await page.waitForTimeout(300);
let shots = 0;
for (let step = 0; step < 80; step++) {
  if (await page.getByText('Sessão concluída').count()) break;
  if (shots < 3) { await shot(`05-pratica-${shots}`); shots++; }
  const cont = page.getByRole('button', { name: 'Continuar' });
  if (await cont.count()) { if (shots < 4) { await shot('06-feedback'); shots = 4; } await cont.click(); continue; }
  const bank = page.locator('.bank .chip:not(.used)');
  if (await bank.count()) { await bank.first().click(); const v = page.getByRole('button', { name: 'Verificar' }); await v.click(); continue; }
  const chunkIn = page.locator('#chunk-in');
  if (await chunkIn.count()) { await chunkIn.fill('it'); await chunkIn.press('Enter'); continue; }
  const typeIn = page.locator('#type-in');
  if (await typeIn.count()) { await typeIn.fill("it's raining"); await typeIn.press('Enter'); continue; }
  const digit = page.getByRole('button', { name: /digitar/ });
  if (await digit.count()) { await digit.click(); continue; }
  const anyIn = page.getByLabel('Digite em inglês');
  if (await anyIn.count()) { await anyIn.fill("It's raining"); await anyIn.press('Enter'); continue; }
  await page.waitForTimeout(200);
}
await page.waitForTimeout(500);
await shot('07-pratica-resumo');
const summaryOk = await page.getByText('Sessão concluída').count();

await page.goto(URL + '#/video/video-fala-01'); await page.waitForTimeout(400);
await shot('08-video');
await page.getByRole('button', { name: 'Próximo slide' }).click(); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Próximo slide' }).click(); await page.waitForTimeout(500);
await shot('08b-video-slide3');

await page.goto(URL + '#/historia/story-tech-1'); await page.waitForTimeout(400);
for (let k = 0; k < 4; k++) { const c = page.getByRole('button', { name: 'Continuar' }); if (await c.count()) await c.click(); else break; await page.waitForTimeout(150); }
await shot('09-historia');

await page.goto(URL + '#/professora'); await page.waitForTimeout(400);
await shot('10-professora');
await page.goto(URL + '#/sotaque'); await page.waitForTimeout(400);
await shot('11-sotaque');
await page.goto(URL + '#/perfil'); await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/12-perfil-full.png`, fullPage: true });

const st = await page.evaluate(() => JSON.parse(localStorage.getItem('fluente:v1')));
console.log(JSON.stringify({ summaryOk: !!summaryOk, level: st.profile.level, produced: Object.keys(st.production).length, xp: st.motivation.xpTotal, gems: st.gems, errorsLogged: st.errorLog.length, errors }, null, 1));
await browser.close();
process.exit(summaryOk && !errors.length ? 0 : 1);
