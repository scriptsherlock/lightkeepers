// Booth check: every game opened from Lightkeepers has all its levels open (the demo unlock),
// played from the bundled copies with the wifi blocked. node tools/qa/unlock.mjs [baseUrl]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4200/?still';
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
await ctx.route('**/*', (r) => (new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort()));
const page = await ctx.newPage();
const report = [];
await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(1500);

async function open(n) {
  await page.keyboard.press(String(n));
  await page.getByRole('button', { name: /Play here|Try the prototype/ }).click();
  const frame = page.frameLocator('.game-stage iframe');
  await frame.locator('body').waitFor();
  await page.waitForTimeout(2500);
  return frame;
}
async function close() {
  await page.getByRole('button', { name: 'Back to the map' }).click();
  await page.waitForTimeout(300);
}
const src = () => page.locator('.game-stage iframe').getAttribute('src');

// 1 Sidekick Academy: every chapter in the sidebar can be chosen.
let f = await open(1);
report.push(`Sidekick ${await src()}: locked chapters = ${await f.locator('.mission-list button:disabled').count()} of ${await f.locator('.mission-list button').count()}`);
await close();

// 3 Order Up!: every customer and the Studio are open.
f = await open(3);
await f.getByRole('button', { name: /Start|Open the shop/ }).click();
if (await f.getByRole('button', { name: /Word tiles/ }).count()) await f.getByRole('button', { name: /Word tiles/ }).click();
if (await f.getByRole('button', { name: 'Skip', exact: true }).count()) await f.getByRole('button', { name: 'Skip', exact: true }).click();
report.push(`Order Up! ${await src()}: locked customers = ${await f.locator('.rail-ticket:disabled').count()} of ${await f.locator('.rail-ticket').count()}`);
await close();

// 4 Tree Quest and 5 Relight use their own teacher unlocks (#teacher, #unlock).
f = await open(4);
report.push(`Tree Quest ${await src()}`);
await close();
f = await open(5);
report.push(`Relight ${await src()}`);
await close();

// 6 Countersign: jump to any phase from the title.
f = await open(6);
report.push(`Countersign ${await src()}: phase jumps = ${await f.getByRole('group', { name: 'Jump to a phase' }).getByRole('button').count()}`);
await close();

// 7 The Line: jump to any shift from the title.
f = await open(7);
report.push(`The Line ${await src()}: shift jumps = ${await f.getByRole('group', { name: 'Jump to a shift' }).getByRole('button').count()}`);
await close();

console.log(report.join('\n'));
await browser.close();
