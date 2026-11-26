// Screenshots of Lightkeepers at booth sizes: dawn (6–10), night (11–14), the sun on its way
// between them, a chapter panel, and the demo switching by itself. SIZES=1366x768 limits sizes.
// node tools/qa/shots.mjs <outDir> [baseUrl]
import { chromium, devices } from '@playwright/test';
const out = process.argv[2] ?? 'qa-shots';
const base = process.argv[3] ?? 'http://127.0.0.1:4200/';
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const report = [];
const view = (page) => page.evaluate(() => document.documentElement.dataset.view);

for (const [name, opts] of [
  ['1366x768', { viewport: { width: 1366, height: 768 } }],
  ['1920x1080', { viewport: { width: 1920, height: 1080 } }],
  ['ipad-landscape', { ...devices['iPad (gen 7) landscape'] }],
  ['ipad-portrait', { ...devices['iPad (gen 7)'] }],
].filter(([n]) => !process.env.SIZES || process.env.SIZES.split(',').includes(n))) {
  const ctx = await browser.newContext({ ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const shot = (n) => page.screenshot({ path: `${out}/ll-${name}-${n}.png` });

  for (const band of ['young', 'older']) {
    await page.goto(`${base}?band=${band}&still`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(4500);
    await shot(band === 'young' ? 'dawn' : 'night');
    const scroll = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1 || document.documentElement.scrollWidth > window.innerWidth + 1);
    const tags = await page.locator('.scene-tag, .lantern').count();
    report.push(`${name} ${band}: view=${await view(page)} scrolls=${scroll} lantern-buttons=${tags}`);
  }

  if (name === '1366x768') {
    // The sun's journey from dawn to night, caught on the way.
    await page.goto(`${base}?band=young&still`);
    await page.waitForTimeout(4000);
    await page.getByRole('radio', { name: 'Ages 11 to 14' }).click();
    for (const ms of [1300, 1100, 900]) {
      await page.waitForTimeout(ms);
      await shot(`sun-${ms}`);
    }
    await page.waitForTimeout(1500);
    report.push(`switch to 11–14: view=${await view(page)}`);
    // Keyboard on the switch.
    await page.getByRole('radio', { name: 'Ages 11 to 14' }).focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(600);
    report.push(`arrow key: view=${await view(page)}`);
    // Sidekick's lantern is on screen and opens its chapter.
    const sk = page.getByRole('button', { name: /^Sidekick Academy\./ });
    const box = await sk.boundingBox();
    report.push(`sidekick lantern on screen: ${!!box && box.x > 0 && box.x < 1366 && box.y > 0 && box.y < 768}`);
    await sk.click();
    await page.waitForTimeout(500);
    await shot('panel');
    report.push(`panel: ${await page.locator('#panel-title').innerText()}`);
    await page.keyboard.press('Escape');
    // The story and the teachers' notes, from the header.
    await page.getByRole('button', { name: 'Story', exact: true }).click();
    await page.waitForTimeout(500);
    await shot('story');
    await page.getByRole('tab', { name: 'For teachers' }).click();
    await page.waitForTimeout(300);
    await shot('teachers');
    report.push(`info sheet rows: ${await page.locator('.chapter-table tbody tr').count()}`);
    await page.keyboard.press('Escape');
    // Drag to circle the islands.
    await page.mouse.move(1000, 400);
    await page.mouse.down();
    await page.mouse.move(760, 380, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    await shot('orbited');
    // Left alone, the demo switches by itself.
    await page.goto(`${base}?band=young`);
    const before = await view(page);
    await page.waitForTimeout(17500);
    report.push(`auto switch after idle: ${before} -> ${await view(page)}`);
  }
  report.push(`${name} errors: ${JSON.stringify([...new Set(errors.map((e) => e.split(/\r?\n/)[0].slice(0, 140)))])}`);
  await ctx.close();
}
console.log(report.join('\n'));
await browser.close();
