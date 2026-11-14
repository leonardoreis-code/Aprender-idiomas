// Smoke E2E (gauntlet passo 4): onboarding → lição 1 completa → tela de conclusão.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('fonts') && errors.push(m.text()));
await page.goto(URL);
await page.screenshot({ path: `${OUT}/01-onboarding.png` });
await page.getByRole('button', { name: 'Começar' }).click();
await page.screenshot({ path: `${OUT}/02-home.png`, fullPage: true });
await page.getByRole('listitem', { name: /Olá! Quem é você\? — disponível/ }).click();
await page.screenshot({ path: `${OUT}/03-sheet.png` });
await page.getByRole('button', { name: 'Começar lição' }).click();

// Resolve cada exercício "trapaceando" via estado do DOM: escolhe opção correta quando visível.
const shots = new Set();
for (let step = 0; step < 250; step++) {
  if (await page.getByText(/Lição concluída|Sem nenhum erro|cérebro trabalhou/).count()) break;
  const kicker = (await page.locator('.ex-kicker').first().textContent().catch(() => '')) ?? '';
  if (!shots.has(kicker) && kicker) { shots.add(kicker); await page.screenshot({ path: `${OUT}/ex-${shots.size}-${kicker.replace(/\W+/g, '_')}.png` }); }
  const cont = page.getByRole('button', { name: 'Continuar' });
  if (await cont.count()) { await cont.click(); continue; }
  for (const name of ['Entendi', 'Vamos treinar']) {
    const b = page.getByRole('button', { name });
    if (await b.count()) { await b.click(); break; }
  }
  if (await page.getByRole('button', { name: 'Não posso falar agora' }).count()) { await page.getByRole('button', { name: 'Não posso falar agora' }).click(); continue; }
  const radios = page.getByRole('radio');
  if (await radios.count()) { await radios.first().click(); const v = page.getByRole('button', { name: 'Verificar' }); if (await v.count()) await v.click(); continue; }
  const chips = page.locator('.bank .chip:not(.used)');
  if (await chips.count()) { await chips.first().click(); await page.getByRole('button', { name: 'Verificar' }).click(); continue; }
  const input = page.locator('#dict');
  if (await input.count()) { await input.fill('hello'); await page.getByRole('button', { name: 'Verificar' }).click(); continue; }
  const pairs = page.locator('.pairs .option:not([disabled])');
  if (await pairs.count()) {
    // tenta combinações até casar tudo
    const left = page.locator('.pairs .options').first().locator('.option:not([disabled])');
    const right = page.locator('.pairs .options').nth(1).locator('.option:not([disabled])');
    const n = await right.count();
    const before = await left.count();
    for (let r = 0; r < n; r++) {
      await left.first().click(); await right.nth(r).click(); await page.waitForTimeout(550);
      if ((await left.count()) < before) break;
    }
    continue;
  }
  await page.waitForTimeout(300);
}
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/99-complete.png` });
const done = await page.getByText(/Lição concluída|Sem nenhum erro|cérebro trabalhou/).count();
await page.getByRole('button', { name: 'Continuar' }).click();
await page.screenshot({ path: `${OUT}/98-home-after.png`, fullPage: true });
const stateOk = await page.evaluate(() => JSON.parse(localStorage.getItem('fluente:v1')).lessonsDone);
console.log(JSON.stringify({ done: !!done, lessonsDone: stateOk, errors }, null, 1));
await browser.close();
process.exit(done && stateOk.includes('u1-l1') && !errors.length ? 0 : 1);
