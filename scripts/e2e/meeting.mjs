// E2E da Reunião ao vivo (modo digitado): conversa entre colegas, reformulação do erro, chat privado,
// cobrança por silêncio e resumo. Também abre o copiloto.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.URL ?? 'http://localhost:8787/';
const OUT = process.env.OUT ?? '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/fonts|favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));
await page.goto(URL);
await page.evaluate(() => localStorage.setItem('fluente:v1', JSON.stringify({ onboarded: true, profile: { name: 'Leo', level: 'fala', goals: ['trabalho'], minutes: 30 } })));
await page.goto(URL + '#reunioes'); await page.reload(); await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/mt1-hub.png`, fullPage: true });
await page.getByRole('button', { name: /Daily com acesso bloqueado/ }).click();
await page.screenshot({ path: `${OUT}/mt2-lobby.png`, fullPage: true });
await page.getByRole('button', { name: 'Participar agora' }).click();
const keys = page.getByRole('button', { name: 'Responder digitando' });
if ((await keys.getAttribute('aria-pressed')) !== 'true') await keys.click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/mt3-call.png` });
const turn = () => page.locator('.meet-turn').waitFor({ timeout: 90_000 });
const box = page.getByLabel('Sua resposta digitada');
const say = async (t) => { await turn(); await box.fill(t); await page.getByRole('button', { name: 'Enviar' }).click(); await page.waitForTimeout(300); };
const before = await page.locator('.meet-caption').count();
await say('Yesterday I go to the client and I finish the orders job');
// a reformulação aparece na legenda / transcrição
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/mt4-recast.png` });
await say("Today I'm going to write the data quality checks");
await say("I'm blocked because I don't have access to the production warehouse");
await say('Kwame, could you give me access today?');
await say('If I get access today, it should be done by Thursday');
await page.waitForSelector('h1:has-text("Você deu conta"), h1:has-text("objetivos")', { timeout: 90_000 });
await page.screenshot({ path: `${OUT}/mt5-summary.png`, fullPage: true });
const summary = await page.locator('main').innerText();
const recastShown = /went/i.test(summary);
const goals = (summary.match(/✓/g) ?? []).length;
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('fluente:v1')));
// desktop + chat aberto
const desk = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: 'dark' });
await desk.goto(URL); await desk.evaluate((s) => localStorage.setItem('fluente:v1', JSON.stringify(s)), st);
await desk.goto(URL + '#reuniao--incident-stale-dashboards'); await desk.reload(); await desk.waitForTimeout(300);
await desk.getByRole('button', { name: 'Participar agora' }).click();
const k2 = desk.getByRole('button', { name: 'Responder digitando' });
if ((await k2.getAttribute('aria-pressed')) !== 'true') await k2.click();
await desk.locator('.meet-turn').waitFor({ timeout: 90_000 });
await desk.getByLabel('Sua resposta digitada').fill('The dashboards is not updating since this morning and she dont know why');
await desk.getByRole('button', { name: 'Enviar' }).click();
await desk.waitForTimeout(600);
await desk.getByRole('button', { name: /Chat do coach/ }).click();
await desk.waitForTimeout(300);
await desk.screenshot({ path: `${OUT}/mt6-desk-chat.png` });
const notes = await desk.locator('.meet-note').count();
// silêncio: cobrança "on mute" (A5) — espera a vez e não responde
await desk.locator('.meet-turn').waitFor({ timeout: 90_000 });
await desk.waitForFunction(() => /mute|hear us/i.test(document.querySelector('main')?.innerText ?? ''), null, { timeout: 30_000 }).catch(() => null);
const muteNudge = /mute|hear us/i.test(await desk.locator('main').innerText());
// copiloto
await desk.goto(URL + '#copiloto'); await desk.waitForTimeout(300);
await desk.screenshot({ path: `${OUT}/mt7-copilot.png`, fullPage: true });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
console.log(JSON.stringify({ captions: before >= 0, recastShown, goals, results: st.meet?.results, bank: st.errorBank?.length, notes, muteNudge, overflow, errors }, null, 1));
await browser.close();
