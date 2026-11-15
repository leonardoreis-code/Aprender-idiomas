// E2E da prova de aprendizado: faz um checkpoint completo (digitado) e confere a página de evolução.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.URL ?? 'http://localhost:8787/';
const OUT = process.env.OUT ?? '.';
const browser = await chromium.launch();
const errors = [];
const mk = async (w, scheme) => {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts|favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));
  return page;
};
const page = await mk(420, 'light');
await page.goto(URL);
await page.evaluate(() => localStorage.setItem('fluente:v1', JSON.stringify({ onboarded: true, profile: { name: 'Leo', level: 'fala', goals: ['trabalho'], minutes: 25 } })));
await page.goto(URL + '#inicio'); await page.reload(); await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/e1-home.png`, fullPage: true });
await page.getByRole('button', { name: /Continuar: Checkpoint de fala/ }).click();
await page.getByRole('checkbox').check();
await page.screenshot({ path: `${OUT}/e2-intro.png` });
await page.getByRole('button', { name: 'Começar o checkpoint' }).click();
const answers = ["It's late and I'm tired", 'My boss live in London', 'Does your team use Python', "I don't know this client", 'Last week I buy a new car', 'Did you see my email yesterday', 'Tomorrow I will present the results', 'I live here for 3 years', 'Have two errors in the report', 'You should talk to her', 'Who do you work with', 'I was late because the traffic was terrible'];
for (const [k, a] of answers.entries()) {
  if (k === 0) await page.screenshot({ path: `${OUT}/e3-item.png` });
  await page.locator('#cp-in').fill(a);
  await page.waitForTimeout(120);
  await page.getByRole('button', { name: 'Próxima' }).click();
}
for (const t of ['I work as a data engineer and yesterday I fixed a pipeline and I had two meetings with my team', 'Last month we had a problem with duplicated orders and I solved it with a new test']) {
  await page.locator('#cp-free').fill(t);
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Enviar' }).click();
}
await page.waitForSelector('.cp-index');
await page.screenshot({ path: `${OUT}/e4-result.png`, fullPage: true });
const first = await page.evaluate(() => JSON.parse(localStorage.getItem('fluente:v1')).checkpoints[0]);

// semeia histórico: 3 checkpoints + 6 semanas de prática, para ver os gráficos
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('fluente:v1'));
  const day = (n) => { const d = new Date(Date.now() - n * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const base = s.checkpoints[0];
  s.plan = { startDay: day(57) };
  s.checkpoints = [
    { ...base, id: 'cp-1', day: day(57), week: 0, form: 'A', index: 31, accuracy: 0.42, secPerWord: 2.4, wpm: 48 },
    { ...base, id: 'cp-2', day: day(29), week: 4, form: 'B', index: 44, accuracy: 0.58, secPerWord: 1.9, wpm: 63 },
    { ...base, id: 'cp-3', day: day(1), week: 8, form: 'C', index: 57, accuracy: 0.75, secPerWord: 1.45, wpm: 81 },
  ];
  s.daily = {};
  for (let n = 55; n >= 0; n--) {
    if (n % 7 === 3) continue;
    const g = (55 - n) / 55;
    s.daily[day(n)] = { spokenSec: 240 + g * 500, spoken: 14 + Math.round(g * 20), produced: 20, correct: 15, due: 6, dueOk: Math.round(6 * (0.62 + g * 0.26)), spwSum: 5 * (2.3 - g * 0.9), spwN: 5, mayaSec: n % 2 ? 300 + g * 400 : 0, wpmSum: 50 + g * 35, wpmN: 1, auto: Math.round(g * 120) };
  }
  localStorage.setItem('fluente:v1', JSON.stringify(s));
});
await page.goto(URL + '#evolucao'); await page.reload(); await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/e5-evolucao.png`, fullPage: true });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
const state = await page.evaluate(() => localStorage.getItem('fluente:v1'));
const desk = await mk(1200, 'dark');
await desk.goto(URL);
await desk.evaluate((s) => localStorage.setItem('fluente:v1', s), state);
await desk.goto(URL + '#evolucao'); await desk.reload(); await desk.waitForTimeout(400);
await desk.locator('.chart-plot rect[tabindex]').nth(1).hover();
await desk.screenshot({ path: `${OUT}/e6-evolucao-desk-dark.png`, fullPage: true });
await desk.goto(URL + '#inicio'); await desk.waitForTimeout(300);
await desk.screenshot({ path: `${OUT}/e7-home-desk-dark.png` });
for (const h of ['#fala-livre', '#minhas-frases', '#pratica--erros', '#perfil']) { await desk.goto(URL + h); await desk.waitForTimeout(250); }
console.log(JSON.stringify({ index: first.index, accuracy: first.accuracy, modality: first.modality, secPerWord: first.secPerWord, wpm: first.wpm, wrong: first.items.filter((i) => i.verdict === 'wrong').map((i) => `${i.id}:${i.errors.join('+')}`), overflow, errors }, null, 1));
await browser.close();
process.exit(errors.length || overflow ? 1 : 0);
