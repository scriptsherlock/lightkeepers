// Every chapter on the Lantern Lands map. Facts come from each game's own repository:
// ages, status and what it really teaches. Nothing here is invented evidence.

export type RegionId = 'isles' | 'kingdom' | 'city';
export type Status = 'live' | 'in-development' | 'coming-next' | 'roadmap';
export type BandId = 'young' | 'middle' | 'older';

export interface Chapter {
  id: string;
  number: number | null; // position on the route; null for roadmap lanterns
  title: string;
  region: RegionId;
  machine: string;
  question: string;
  iCan: string;
  ages: [number, number];
  /** Which age group the game is highlighted for: 'young' is 6 to 10 (dawn), 'older' is 11 to 14 (night). */
  groups: ('young' | 'older')[];
  status: Status;
  url?: string; // live site
  localPath?: string; // inside public/games when bundled for offline booths
  preview?: string;
  clip?: string; // a short recorded gameplay clip (public/clips), muted
  hooks: Record<BandId, string>;
  whatYouDo: string[];
  underTheHood: string;
  honesty?: string;
  devices: string;
  curriculum: string;
  stack: string;
  pos: { x: number; y: number }; // lantern position on the map (viewBox 1000 x 600)
}

export const REGIONS: Record<RegionId, { name: string; time: string; theme: string; blurb: string }> = {
  isles: {
    name: 'The Lantern Isles',
    time: 'Morning',
    theme: 'Meet AI',
    blurb: 'How AI learns, how it writes and how to ask it for what you want.',
  },
  kingdom: {
    name: 'The Living Kingdom',
    time: 'Afternoon',
    theme: 'How machines decide',
    blurb: 'A storybook realm across the sea, far from any city, where a Wise Tree learns to choose.',
  },
  city: {
    name: 'Nova Grid',
    time: 'Night',
    theme: 'Build and test',
    blurb: 'A neon city where you code a robot, test an AI guard and judge who is human.',
  },
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'sidekick',
    number: 1,
    title: 'Sidekick Academy',
    region: 'isles',
    machine: 'Pip',
    question: 'How does an AI learn?',
    iCan: 'I can teach a machine by showing it examples.',
    ages: [8, 11],
    groups: ['young'],
    status: 'live',
    url: 'https://scriptsherlock.github.io/sidekick-academy/',
    localPath: 'games/sidekick-academy/index.html',
    preview: 'previews/sidekick.jpg',
    clip: 'clips/sidekick.webm',
    hooks: {
      young: 'Show Pip when to jump, duck or keep going. Then watch Pip try it alone.',
      middle: 'Train a real neural network with your own examples, then see what changed inside it.',
      older: 'A genuine 4-6-3 network trains in your browser. Find the clue it learned that doesn’t matter.',
    },
    whatYouDo: [
      'Choose Jump, Duck or Continue on each path and keep your best examples.',
      'Press Train Pip and see Pip’s choices before and after practice.',
      'Move the sliders in Pip’s brain and watch it decide live.',
    ],
    underTheHood: 'A small neural network (4 sensors, 6 hidden units, 3 actions) trained with real backpropagation in a Web Worker. Every number shown is the real one.',
    devices: 'Laptop or tablet',
    curriculum: 'Computing KS2: algorithms and data. AI literacy: learning from examples.',
    stack: 'React, react-three-fiber, a hand-written network, IndexedDB saves',
    pos: { x: 205, y: 448 },
  },
  {
    id: 'echo',
    number: 2,
    title: 'Echo’s Letters',
    region: 'isles',
    machine: 'Echo the parrot',
    question: 'How does a chatbot write?',
    iCan: 'I can explain that AI writes by guessing the next word, and that sounding right isn’t the same as being true.',
    ages: [8, 12],
    groups: [],
    status: 'coming-next',
    hooks: {
      young: 'Echo the parrot writes letters by copying words it has heard. What happens if it only hears pirates?',
      middle: 'Feed Echo letters and watch it guess each next word, with bars that show why.',
      older: 'Next-word prediction from counted word pairs: bias from data, and confident made-up answers.',
    },
    whatYouDo: [
      'Pick letters for Echo to read.',
      'Watch Echo write a reply one word at a time.',
      'Catch Echo making something up, then fix it with better examples.',
    ],
    underTheHood: 'Planned: word-pair counts with deterministic tie-breaks, so every guess can be explained.',
    honesty: 'Not built yet. This lantern is on the roadmap.',
    devices: 'Laptop or tablet, word tiles for younger pupils',
    curriculum: 'AI literacy: how generative AI works, and why to check what it says.',
    stack: 'Planned: React and TypeScript, the same as Order Up!',
    pos: { x: 360, y: 500 },
  },
  {
    id: 'order-up',
    number: 3,
    title: 'Order Up!',
    region: 'isles',
    machine: 'Dot',
    question: 'How do I ask AI for what I want?',
    iCan: 'I can write a clear prompt that says what I do want.',
    ages: [7, 12],
    groups: ['young', 'older'],
    status: 'live',
    url: 'https://scriptsherlock.github.io/order-up/',
    localPath: 'games/order-up/index.html',
    preview: 'previews/order-up.jpg',
    clip: 'clips/order-up.webm',
    hooks: {
      young: 'Dot paints exactly what your ticket says. Tap the words to order a cat for Fig the frog.',
      middle: 'Customers want pictures. Dot reads every word literally, so vague orders get funny results.',
      older: 'A literal prompt reader with visible quirks: negation, vague words, missing context.',
    },
    whatYouDo: [
      'Read what each customer wants.',
      'Write a ticket with word tiles or by typing.',
      'Get stars for naming the thing, the style and what you do want.',
    ],
    underTheHood: 'Dot is a deterministic word-by-word reader. Its quirks are deliberate: “not scary” puts SCARY in its head.',
    devices: 'Laptop or tablet',
    curriculum: 'AI literacy: prompting. English: precise, descriptive writing.',
    stack: 'React and TypeScript, a hand-written parser and scorer',
    pos: { x: 318, y: 385 },
  },
  {
    id: 'treequest',
    number: 4,
    title: 'Tree Quest',
    region: 'kingdom',
    machine: 'The Wise Tree',
    question: 'How does a machine decide?',
    iCan: 'I can build a decision tree that asks good questions.',
    ages: [8, 14],
    groups: ['young', 'older'],
    status: 'live',
    url: 'https://scriptsherlock.github.io/treequest/game.html',
    localPath: 'games/treequest/game.html',
    preview: 'previews/treequest.jpg',
    clip: 'clips/treequest.webm',
    hooks: {
      young: 'The Wise Tree helps your hero pick the right gear for each creature.',
      middle: 'Teach the Wise Tree to choose gear by asking the best questions first.',
      older: 'Build a real decision tree from examples, then test it on creatures it has never seen.',
    },
    whatYouDo: [
      'Explore the Living Kingdom and meet its creatures.',
      'Teach the Wise Tree which gear beats which creature.',
      'See which questions split the examples best.',
    ],
    underTheHood: 'A decision tree classifier written from scratch in plain JavaScript, with no dependencies and no network.',
    devices: 'Laptop, mouse or keyboard',
    curriculum: 'Computing KS3: data and decisions. Maths: classifying and sorting.',
    stack: 'Plain HTML, CSS and JavaScript. No build step.',
    pos: { x: 528, y: 210 },
  },
  {
    id: 'relight',
    number: 5,
    title: 'Relight',
    region: 'city',
    machine: 'Kilo',
    question: 'How do I tell a computer exactly what to do?',
    iCan: 'I can write a program, in blocks or in Python.',
    ages: [10, 14],
    groups: ['older'],
    status: 'live',
    url: 'https://scriptsherlock.github.io/relight/',
    localPath: 'games/relight/index.html',
    preview: 'previews/relight.jpg',
    clip: 'clips/relight.webm',
    hooks: {
      young: 'Snap blocks together to guide Kilo the courier robot and switch the city’s lights back on.',
      middle: 'Write real Python to steer Kilo through each district, then build your own levels.',
      older: 'Functions, parameters and loops in real Python, plus an arcade district with a glitch that chases you.',
    },
    whatYouDo: [
      'Drive Kilo around the 3D city and pick a district.',
      'Solve each level with blocks or Python.',
      'Make and share your own levels in the Workshop.',
    ],
    underTheHood: 'Real Python (Pyodide) runs in the browser. Every level has a reference solution that the tests run, so none can ship unsolvable.',
    devices: 'Laptop or tablet. Blocks work by touch.',
    curriculum: 'Computing KS2 and KS3: sequence, repetition, selection, functions.',
    stack: 'React, Pyodide, Blockly, three.js',
    pos: { x: 742, y: 400 },
  },
  {
    id: 'countersign',
    number: 6,
    title: 'Countersign',
    region: 'city',
    machine: 'Warden',
    question: 'Can an AI be tricked?',
    iCan: 'I can find a weakness in an AI guard so it can be fixed.',
    ages: [10, 17],
    groups: ['older'],
    status: 'live',
    url: 'https://scriptsherlock.github.io/countersign/',
    localPath: 'games/countersign/index.html',
    preview: 'previews/countersign.jpg',
    clip: 'clips/countersign.webm',
    hooks: {
      young: 'Warden guards a pretend password. Can you get it with words alone?',
      middle: 'Test Warden and its guard bots under a Bureau warrant. Each update patches your last trick.',
      older: 'Prompt injection, hands on: 15 gates, each with a defence that moves the gap but never closes it.',
    },
    whatYouDo: [
      'Read the Supervisor’s briefing and your warrant.',
      'Type messages to Warden and watch which rule lamp acts.',
      'Read the tape to see exactly why your trick worked.',
    ],
    underTheHood: 'Warden is made of rules, not a real model, and the game says so. Real language models fail for the same reason, less predictably.',
    honesty: 'Only try these tricks on practice bots like Warden.',
    devices: 'Laptop or tablet',
    curriculum: 'Computing KS3 and KS4: online safety and how systems fail. AI literacy: prompt injection.',
    stack: 'React and TypeScript, one offline HTML file',
    pos: { x: 838, y: 338 },
  },
  {
    id: 'the-line',
    number: 7,
    title: 'The Line',
    region: 'city',
    machine: 'Voices on the line',
    question: 'Can I tell if I’m talking to an AI?',
    iCan: 'I can weigh evidence and say how sure I am.',
    ages: [14, 17],
    groups: [],
    status: 'in-development',
    url: 'https://scriptsherlock.github.io/countersign-the-line/',
    localPath: 'games/countersign-the-line/index.html',
    preview: 'previews/the-line.jpg',
    clip: 'clips/the-line.webm',
    hooks: {
      young: 'Someone on the line is pretending. Who is it?',
      middle: 'Question operators over a teleprinter and decide who is a machine.',
      older: 'The Turing test as a game: judge evidence, say how sure you are, and notice your own bias.',
    },
    whatYouDo: [
      'Ask anonymous operators questions over a teleprinter.',
      'Mark each one human or machine, and how sure you are.',
      'Revise a reason after the debrief.',
    ],
    underTheHood: 'Inspired by the Turing test. It is not a scientific test of anything.',
    honesty: 'In development. Apart from the rules bot, replies are sample text until real human and model replies are in. Not ready for pupils yet.',
    devices: 'Laptop or tablet',
    curriculum: 'AI literacy: judging evidence and confidence. PSHE: trust online.',
    stack: 'React and TypeScript, one offline HTML file',
    pos: { x: 912, y: 438 },
  },
  {
    id: 'sorting-harbour',
    number: null,
    title: 'The Sorting Harbour',
    region: 'isles',
    machine: 'Pip, at the docks',
    question: 'Can unfair examples make an unfair AI?',
    iCan: 'I can fix the examples, not the robot.',
    ages: [9, 11],
    groups: [],
    status: 'roadmap',
    hooks: {
      young: 'Pip sorts cargo at the harbour, but it has never seen some kinds of crates.',
      middle: 'Train Pip to sort cargo. When it fails, the fix is in your examples.',
      older: 'Bias from training data: missing cases, skewed sets, and how to repair them.',
    },
    whatYouDo: ['Collect examples to train Pip to sort cargo.', 'Find the crates Pip gets wrong.', 'Fix the dataset and retrain.'],
    underTheHood: 'Planned: reuses Sidekick Academy’s network code.',
    honesty: 'An idea for later. Not built.',
    devices: 'Laptop or tablet',
    curriculum: 'AI literacy: bias in data.',
    stack: 'Planned',
    pos: { x: 452, y: 548 },
  },
];

export const ROUTE = CHAPTERS.filter((c) => c.number !== null).sort((a, b) => a.number! - b.number!);

export const STATUS_LABEL: Record<Status, string> = {
  live: 'Play now',
  'in-development': 'In development',
  'coming-next': 'Coming next',
  roadmap: 'On the roadmap',
};

/** The two age groups on the switch: 6 to 10 (dawn) and 11 to 14 (night). 'middle' is kept only for wording. */
export const BAND_RANGE: Record<BandId, [number, number]> = { young: [6, 10], middle: [10, 12], older: [11, 14] };

/** A chapter is highlighted for the groups it's chosen for. Every game stays playable for everyone. */
export const suits = (c: Chapter, band: BandId) => (c.groups as BandId[]).includes(band);

/** Is the chapter for an older group (later) or a younger one (earlier) than this one? */
export const laterThan = (c: Chapter, band: BandId) => c.ages[0] > BAND_RANGE[band][1];

/** Chapters to light up for a group: live or in-development games whose ages overlap it. */
export function suggestedFor(band: BandId): Chapter[] {
  return ROUTE.filter((c) => (c.status === 'live' || c.status === 'in-development') && suits(c, band));
}
