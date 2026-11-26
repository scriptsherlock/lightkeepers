// Booth check: with every request off this machine blocked (no wifi), each playable chapter
// opens inside the tour from the bundled copy in public/games. node tools/qa/offline.mjs [baseUrl]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4200/';
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
let blocked = 0;
await ctx.route('**/*', (route) => {
  const url = new URL(route.request().url());
  if (url.hostname === '127.0.0.1' || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
  blocked++;
  return route.abort();
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const report = [];
await page.goto(`${base}?age=12`);
await page.waitForTimeout(1200);
for (const [n, name] of [[1, 'Sidekick Academy'], [3, 'Order Up!'], [4, 'Tree Quest'], [5, 'Relight'], [6, 'Countersign'], [7, 'The Line']]) {
  await page.keyboard.press(String(n));
  await page.waitForSelector('#panel-title');
  const local = await page.getByText('Playing from this laptop').isVisible().catch(() => false);
  await page.getByRole('button', { name: /Play here|Try the prototype/ }).click();
  const frame = page.frameLocator('.game-stage iframe');
  const ok = await frame.locator('body').waitFor({ timeout: 15000 }).then(() => true, () => false);
  await page.waitForTimeout(2500);
  const src = await page.locator('.game-stage iframe').getAttribute('src');
  const text = ok ? (await frame.locator('body').innerText().catch(() => '')).slice(0, 40).replace(/\s+/g, ' ') : '';
  report.push(`${name}: local=${local} src=${src} loaded=${ok && text.length > 0} "${text}"`);
  await page.getByRole('button', { name: 'Back to the map' }).click();
  await page.waitForTimeout(300);
}
const lit = await page.evaluate(() => JSON.parse(localStorage.getItem('lightkeepers.progress') ?? '{}').lit);
report.push(`lanterns lit after playing: ${JSON.stringify(lit)}`);
report.push(`requests blocked (would have needed wifi): ${blocked}`);
report.push(`errors: ${JSON.stringify(errors)}`);
console.log(report.join('\n'));
await browser.close();
