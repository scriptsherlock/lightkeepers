// Where the take-away QR code points. Until Lightkeepers has its own live address this is the
// live Demos gallery, which links every game. Change it once the site is published.
export const SITE_URL = 'https://scriptsherlock.github.io/lightkeepers/';
export const GITHUB_URL = 'https://github.com/scriptsherlock';

// Credit wording is still to be agreed (plan, decision 7). Keep it short and factual.
export const CREDIT = 'Made for Turing Education.';

// Facts for "How it's built". Each one is true of the code today.
export const BUILT_FACTS = [
  { title: 'Machines you can read', text: 'Every “AI” in these games is deterministic, local code: a parser, a decision tree, a small neural network, a rules engine. Pupils can see why it acts.' },
  { title: 'Tests that prove the games', text: 'Relight runs every level’s solution through real Python. Order Up! checks every order can be won. Countersign checks every gate can still open. Sidekick checks every gradient against finite differences.' },
  { title: 'One static site each', text: 'No server, no accounts, no analytics. Each game deploys to GitHub Pages from its own repository.' },
  { title: 'Built with Claude Code', text: 'Designed, built and tested with Claude Code as a coding partner, then checked in real browsers at laptop and tablet sizes.' },
];
