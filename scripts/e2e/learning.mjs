// E2E dos mecanismos de aprendizado: tente antes, banco de erros pessoais, "não era erro", backup e novas telas.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.URL ?? 'http://localhost:8787/';
const OUT = process.env.OUT ?? '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/fonts|favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));
const get = () => page.evaluate(() => JSON.parse(localStorage.getItem('fluente:v1')));
await page.goto(URL);
await page.evaluate(() => localStorage.setItem('fluente:v1', JSON.stringify({ onboarded: true, profile: { name: 'Leo', level: 'fala', goals: ['trabalho'], minutes: 25 } })));

// 1. Tente antes
await page.goto(URL + '#aula--fala-01'); await page.reload(); await page.waitForTimeout(300);
await page.locator('#pre-0').fill('nonsense answer');
await page.locator('#pre-1').fill('x');
await page.locator('#pre-2').fill('y');
await page.screenshot({ path: `${OUT}/l1-pretest.png` });
await page.getByRole('button', { name: 'Ver como me saí' }).click();
const pre = (await get()).lessons['fala-01']?.pre;

// 2. Erros reais entram no banco (via treinador, digitado)
await page.goto(URL + '#professora'); await page.waitForTimeout(200);
await page.getByRole('button', { name: /Daily standup/ }).click();
await page.getByRole('button', { name: /digitar/ }).click();
await page.getByLabel('Sua resposta em inglês').fill('Yesterday I go to the office and she work late and I have a doubt');
await page.getByRole('button', { name: 'Enviar' }).click();
await page.waitForSelector('.repair');
const bank = (await get()).errorBank.map((c) => c.rule);

// 3. Conserte seus erros
await page.goto(URL + '#meus-erros'); await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Digitar' }).click().catch(() => {});
await page.screenshot({ path: `${OUT}/l2-errors.png` });
const first = await page.locator('.live-text').first().textContent();
const fixes = { doubt: 'I have a question', 'I go': 'Yesterday I went to the office', 'she work': 'she works late' };
const answer = Object.entries(fixes).find(([k]) => first.includes(k))?.[1] ?? 'x';
await page.getByLabel('Trecho corrigido').fill(answer);
await page.getByRole('button', { name: 'Verificar' }).click();
await page.screenshot({ path: `${OUT}/l3-errors-ok.png` });
const okText = await page.locator('.word-ok, .word-miss').first().textContent();
await page.getByRole('button', { name: /Próximo|Ver resultado/ }).click();
// "não era erro" duas vezes silencia a regra
let muted = [];
for (let k = 0; k < 2; k++) { const b = page.getByRole('button', { name: 'Não era erro' }); if (await b.count()) { await b.click(); await page.waitForTimeout(150); } }
const st = await get();

// 4. Backup: restaurar um estado alterado
await page.goto(URL + '#ajustes'); await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Restaurar de um backup' }).click();
const modified = { ...st, gems: 777 };
await page.locator('#bk').fill(JSON.stringify(modified));
await page.getByRole('button', { name: /Restaurar e substituir/ }).click();
const gems = (await get()).gems;
await page.screenshot({ path: `${OUT}/l4-backup.png`, fullPage: true });

// 5. novas telas abrem sem erro
for (const h of ['#falar', '#semana', '#treino--transformar', '#treino--perguntas', '#treino--resposta-rapida', '#treino--numeros', '#treino--shadowing', '#treino--vocabulario', '#treino--star', '#curso', '#aula--b2-01', '#aula--fala-13', '#simulacoes', '#simulacao--incident-call', '#evolucao', '#inicio']) {
  await page.goto(URL + h); await page.waitForTimeout(250);
  if (['#falar', '#semana', '#treino--transformar', '#treino--numeros', '#treino--star', '#curso'].includes(h)) await page.screenshot({ path: `${OUT}/l5${h.replace(/[#-]+/g, '_')}.png`, fullPage: true });
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
console.log(JSON.stringify({ pre, bank, okText, fp: st.fp, bankAfter: st.errorBank.length, gems, overflow, errors }, null, 1));
await browser.close();
process.exit(errors.length || overflow || pre !== 0 || bank.length < 3 || gems !== 777 ? 1 : 0);
