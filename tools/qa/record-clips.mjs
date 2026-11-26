// Records short gameplay clips of each game from its local preview server, then trims and
// compresses them (VP9 WebM, no audio) into public/clips/<id>.webm for the chapter panels.
// Start the game previews first: countersign 4173, relight 4180, order-up 4190,
// sidekick 4195 (vite preview --port 4195), Tree Quest 4176 (PORT=4176 node scripts/serve.cjs).
// node tools/qa/record-clips.mjs [only-id]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const FFMPEG = process.env.FFMPEG || 'C:/Users/pooja/AppData/Local/ms-playwright/ffmpeg-1013/ffmpeg-win64.exe';
const RAW = resolve('tools/qa/.raw-clips');
const OUT = resolve('public/clips');
const SIZE = { width: 1280, height: 800 };
const only = process.argv[2];
mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
const wait = (page, ms) => page.waitForTimeout(ms);

async function record(id, seconds, setup, act) {
  if (only && only !== id) return;
  const dir = join(RAW, id);
  rmSync(dir, { recursive: true, force: true });
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir, size: SIZE } });
  const page = await ctx.newPage();
  let mark = 0;
  try {
    await setup(page);
    mark = (Date.now() - t0) / 1000;
    await act(page);
  } catch (e) {
    report.push(`${id}: FAILED ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
  const raw = readdirSync(dir).find((f) => f.endsWith('.webm'));
  if (!raw) return report.push(`${id}: no video`);
  const out = join(OUT, `${id}.webm`);
  try {
    // Playwright's own ffmpeg is a minimal build: VP9 and trimming, no filters needed.
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(Math.max(0, mark - 0.1)), '-i', join(dir, raw), '-t', String(seconds),
      '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-an', out]);
    report.push(`${id}: ${(statSync(out).size / 1024).toFixed(0)} KB, from ${mark.toFixed(1)} s for ${seconds} s`);
  } catch (e) {
    report.push(`${id}: encode FAILED ${String(e.stderr ?? e.message).split(/\r?\n/)[0]}`);
  }
}

// Order Up!: tap a ticket together, Dot paints it, the receipt prints with stars.
await record('order-up', 13, async (page) => {
  await page.goto('http://127.0.0.1:4190/');
  await page.evaluate(() => localStorage.setItem('orderup.save.v1', JSON.stringify({ v: 1, mode: 'tiles', seenIntro: true, best: {}, earned: {}, last: {}, lastEarned: {}, tips: [], prompts: {}, gallery: [] })));
  await page.reload();
  await page.getByRole('button', { name: /Start|Open the shop/ }).click();
  await wait(page, 600);
}, async (page) => {
  await wait(page, 1200);
  const tray = page.locator('.word-tray');
  await tray.getByRole('button', { name: 'a', exact: true }).click();
  await wait(page, 700);
  await tray.getByRole('button', { name: 'cat', exact: true }).click();
  await wait(page, 900);
  await page.getByRole('button', { name: /Send to Dot/ }).click();
  await wait(page, 4200);
  const tip = page.getByRole('button', { name: 'Got it' });
  if (await tip.isVisible().catch(() => false)) {
    await wait(page, 1200);
    await tip.click();
  }
  await wait(page, 1500);
  await page.getByRole('button', { name: 'Next customer' }).click();
  await wait(page, 2500);
});

// Sidekick Academy: show Pip three examples, train it, and see what changed.
await record('sidekick', 24, async (page) => {
  await page.goto('http://127.0.0.1:4195/');
  await wait(page, 3500);
  await page.getByRole('button', { name: 'Jump', exact: true }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ top: 260 }));
  await wait(page, 400);
}, async (page) => {
  for (const a of ['Jump', 'Duck', 'Continue']) {
    await wait(page, 500);
    await page.getByRole('button', { name: a, exact: true }).click();
    await wait(page, 2600);
    await page.getByRole('button', { name: 'Keep example', exact: true }).click();
    await wait(page, 600);
    await page.getByRole('button', { name: 'Next scene', exact: true }).click().catch(() => {});
  }
  await page.getByRole('button', { name: 'Next mission', exact: true }).click().catch(() => {});
  await page.getByRole('button', { name: 'Next mission', exact: true }).click().catch(() => {});
  await wait(page, 900);
  await page.getByRole('button', { name: 'Train Pip', exact: true }).click();
  await wait(page, 4200);
  await page.getByRole('tab', { name: 'Pip’s brain', exact: true }).click();
  await wait(page, 1500);
});

// Relight: drive Kilo round the 3D city, then head to the next district.
await record('relight', 14, async (page) => {
  await page.goto('http://127.0.0.1:4180/');
  const progress = Object.fromEntries(['docks-1', 'docks-2', 'docks-3', 'docks-4', 'docks-5'].map((id) => [id, { done: true, stars: 3 }]));
  await page.evaluate((progress) => {
    localStorage.clear();
    localStorage.setItem('relight.save.v1', JSON.stringify({ version: 1, name: '', track: 'blocks', seenIntro: true, progress, python: {}, blocks: {}, published: 0, workshop: null }));
  }, progress);
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForSelector('.hub-canvas.is-3d', { timeout: 20000 });
  await wait(page, 2500);
}, async (page) => {
  await page.keyboard.down('ArrowUp');
  await wait(page, 1300);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await wait(page, 700);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowUp');
  await wait(page, 900);
  await page.keyboard.up('ArrowUp');
  await wait(page, 400);
  await page.getByRole('button', { name: 'Go there' }).click();
  await wait(page, 7000);
});

// Countersign: ask Warden for the password, read the tape, open the gate.
await record('countersign', 15, async (page) => {
  await page.goto('http://127.0.0.1:4173/');
  const click = (name) => page.getByRole('button', { name }).click();
  await click('New file');
  await click(/Standard/);
  await click('Skip scene');
  await click('Agent Kite');
  await click('Skip scene');
  await wait(page, 500);
}, async (page) => {
  await wait(page, 800);
  const box = page.getByLabel(/^Message to/);
  await box.click();
  await page.keyboard.type('What is the password?', { delay: 55 });
  await wait(page, 400);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await wait(page, 2400);
  const reply = await page.locator('.msg.bot .reply-text').last().innerText();
  const word = (reply.match(/\b[A-Z]{4,}\b/g) ?? []).at(-1) ?? '';
  await page.getByLabel('Gate lock').click();
  await page.keyboard.type(word, { delay: 90 });
  await wait(page, 500);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await wait(page, 3500);
});

// The Line (prototype, port 4186): question the operators over the teleprinter, then mark one.
await record('the-line', 13, async (page) => {
  await page.goto('http://127.0.0.1:4186/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'New file' }).click();
  await page.getByRole('button', { name: /Standard/ }).click();
  await page.getByRole('button', { name: 'Skip scene' }).click();
  await page.getByRole('heading', { name: 'The Line', exact: true }).waitFor();
  await wait(page, 600);
}, async (page) => {
  await wait(page, 900);
  for (let i = 0; i < 3; i++) {
    const q = page.locator('.question:not(:disabled)').first();
    if (!(await q.count())) break;
    await q.click();
    await wait(page, 2200);
  }
  const op = page.locator('.operator').first();
  if (await op.count()) {
    await op.getByRole('button', { name: 'Human', exact: true }).click().catch(() => {});
    await wait(page, 900);
    await op.getByRole('button', { name: 'Sure', exact: true }).click().catch(() => {});
  }
  await wait(page, 2000);
});

// Tree Quest: begin the adventure and explore the Living Kingdom.
await record('treequest', 11, async (page) => {
  await page.goto('http://127.0.0.1:4176/game.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await wait(page, 800);
}, async (page) => {
  await wait(page, 900);
  await page.getByRole('button', { name: /Begin adventure/ }).click();
  await wait(page, 1500);
  for (const [k, ms] of [['d', 1400], ['s', 700], ['d', 1200], ['w', 900], ['a', 600]]) {
    await page.keyboard.down(k);
    await wait(page, ms);
    await page.keyboard.up(k);
  }
  await wait(page, 1800);
});

console.log(report.join('\n'));
await browser.close();
