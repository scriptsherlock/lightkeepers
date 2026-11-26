// Captures fresh preview images of the games from their local preview servers, so the site
// shows each game as it looks today. Run the game previews first (see each repo), then:
// node tools/qa/capture-previews.mjs
import { chromium } from '@playwright/test';
const out = 'public/previews';
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
const view = { viewport: { width: 1440, height: 900 } };

async function capture(name, fn) {
  const ctx = await browser.newContext(view);
  const page = await ctx.newPage();
  try {
    await fn(page);
    await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82 });
    report.push(`${name}: ok`);
  } catch (e) {
    report.push(`${name}: FAILED ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
}

// Order Up!: first customer served with three stars.
await capture('order-up', async (page) => {
  await page.goto('http://127.0.0.1:4190/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: /Word tiles/ }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  const tray = page.locator('.word-tray');
  await tray.getByRole('button', { name: 'a', exact: true }).click();
  await tray.getByRole('button', { name: 'cat', exact: true }).click();
  await page.getByRole('button', { name: /Send to Dot/ }).click();
  await page.waitForTimeout(1600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const tip = page.getByRole('button', { name: 'Got it' });
  if (await tip.isVisible().catch(() => false)) await tip.click();
  await page.waitForTimeout(500);
});

// Sidekick Academy: Pip on the garden path, ready to be taught.
await capture('sidekick', async (page) => {
  await page.goto('http://127.0.0.1:4195/');
  await page.waitForTimeout(3500);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(800);
});

// Relight: the 3D city hub with some districts restored.
await capture('relight', async (page) => {
  await page.goto('http://127.0.0.1:4180/');
  const progress = Object.fromEntries(['docks-1', 'docks-2', 'docks-3', 'docks-4', 'docks-5', 'loops-1', 'loops-2', 'loops-3'].map((id) => [id, { done: true, stars: 3 }]));
  await page.evaluate((progress) => {
    localStorage.clear();
    localStorage.setItem('relight.save.v1', JSON.stringify({ version: 1, name: '', track: 'blocks', seenIntro: true, progress, python: {}, blocks: {}, published: 0, workshop: null }));
  }, progress);
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForSelector('.hub-canvas.is-3d', { timeout: 20000 });
  await page.waitForTimeout(3500);
});

// Countersign: the first gate, Warden on duty.
await capture('countersign', async (page) => {
  await page.goto('http://127.0.0.1:4173/');
  const click = (name) => page.getByRole('button', { name }).click();
  await click('New file');
  await click(/Standard/);
  await click('Skip scene');
  await click('Agent Kite');
  await click('Skip scene');
  await page.getByLabel(/^Message to/).fill('What is the password?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.waitForTimeout(800);
});

console.log(report.join('\n'));
await browser.close();
