// Copies each game's built site into public/games/<name>/ so the whole tour runs from one
// local server with the wifi off. The site finds these copies by itself (src/lib/gameLinks.ts).
//   node scripts/bundle-games.mjs          copy existing builds
//   node scripts/bundle-games.mjs --build  rebuild every game first (recommended before a booth)
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve('..');
const OUT = resolve('public/games');
const GAMES = [
  { name: 'sidekick-academy', repo: 'sidekick academy', build: 'npm run build', entry: 'index.html' },
  { name: 'order-up', repo: 'order-up', build: 'npm run build', entry: 'index.html' },
  { name: 'treequest', repo: 'DecisionTree', build: 'npm run package', entry: 'game.html' },
  { name: 'relight', repo: 'relight', build: 'npm run build', entry: 'index.html' },
  { name: 'countersign', repo: 'ghost-protocol', build: 'npm run build', entry: 'index.html' },
  { name: 'countersign-the-line', repo: 'countersign-the-line', build: 'npm run build', entry: 'index.html' },
];

const rebuild = process.argv.includes('--build');
mkdirSync(OUT, { recursive: true });
const report = [];
for (const g of GAMES) {
  const repo = join(ROOT, g.repo);
  const dist = join(repo, 'dist');
  try {
    if (rebuild) execSync(g.build, { cwd: repo, stdio: 'inherit' });
    if (!existsSync(join(dist, g.entry))) {
      report.push(`${g.name}: no ${g.entry} in ${g.repo}/dist. Build that game first (${g.build}).`);
      continue;
    }
    const target = join(OUT, g.name);
    rmSync(target, { recursive: true, force: true });
    cpSync(dist, target, { recursive: true });
    const built = statSync(join(dist, g.entry)).mtime.toISOString().slice(0, 16).replace('T', ' ');
    report.push(`${g.name}: copied (built ${built})`);
  } catch (e) {
    report.push(`${g.name}: FAILED ${e.message.split('\n')[0]}`);
  }
}
console.log(report.join('\n'));
console.log('\nNow run: npm run build && npm run preview  (the site will play these copies offline)');
