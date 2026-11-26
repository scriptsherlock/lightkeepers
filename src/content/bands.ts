// Words for each age band, and for teachers. Components never hard-code these.
import type { BandId } from './chapters';

export type View = BandId | 'teacher';

export interface BandCopy {
  label: string;
  ages: string;
  place: string;
  headline: string;
  sub: string;
  keeper: string; // the Keeper's welcome
  chaptersTitle: string;
  chaptersSub: string;
  storyTitle: string;
}

export const BANDS: Record<View, BandCopy> = {
  young: {
    label: 'Ages 6 to 10',
    ages: '6–10',
    place: 'Dawn on the Lantern Isles',
    headline: 'Help the machines. Light the lanterns.',
    sub: 'Teach a robot with examples, order pictures from a paint robot, and help the Wise Tree learn to make choices.',
    keeper: 'Hello, apprentice! Every lantern here is looked after by a helpful machine. Let’s find out how they think.',
    chaptersTitle: 'Lanterns to light first',
    chaptersSub: 'Short, gentle games. Tap, try, and see what the machine does.',
    storyTitle: 'The Keeper needs a helper',
  },
  middle: {
    label: 'Ages 10 to 12',
    ages: '10–12',
    place: 'Afternoon in the Living Kingdom',
    headline: 'Every lantern is one big idea about AI.',
    sub: 'Train a real neural network, teach a tree to make choices, and write code that switches a city back on.',
    keeper: 'Each machine is stuck on one problem. Work out how it thinks, and its lantern lights up.',
    chaptersTitle: 'Your next lanterns',
    chaptersSub: 'Each game answers one question about how AI really works.',
    storyTitle: 'An apprentice for the Keeper',
  },
  older: {
    label: 'Ages 11 to 14',
    ages: '11–14',
    place: 'Night in Nova Grid',
    headline: 'Understand it. Test it. Decide when to trust it.',
    sub: 'Write real code to switch a city back on, build a decision tree, and trick an AI guard with words alone.',
    keeper: 'At night the machines are harder to read. Your judgement is the light now.',
    chaptersTitle: 'Lanterns for after dark',
    chaptersSub: 'Real terms, real code, and the ways AI can fail.',
    storyTitle: 'People keep the light',
  },
  teacher: {
    label: 'For teachers',
    ages: '7–17',
    place: 'The Keeper’s office',
    headline: 'AI literacy games that grow up with the child, from 7 to 17.',
    sub: 'Seven chapters, one story. No accounts, no tracking, no live AI. Nothing a pupil types leaves the device.',
    keeper: 'Each game teaches one idea, ends with an “I can” statement, and works offline in a normal browser.',
    chaptersTitle: 'Every chapter at a glance',
    chaptersSub: 'Ages, the question each game answers, and what it needs.',
    storyTitle: 'The story behind the games',
  },
};

export const STORY = {
  premise: [
    'The old Keeper looks after the lanterns of the Lantern Lands, and each lantern is kept lit by a helpful machine.',
    'The Keeper is ready to retire, but first they need an apprentice who truly understands how machines think.',
    'Visit each place, help its machine, and light its lantern.',
  ],
  finale: 'Machines can learn, decide and talk. But people keep the light.',
  question: 'Who was really deciding?',
  answers: [
    { when: 'Order Up!', answer: 'I was. Dot only did what my words said.' },
    { when: 'Sidekick Academy', answer: 'Pip was, but it learned from my examples.' },
    { when: 'The Line', answer: 'I have to work it out, and say how sure I am.' },
  ],
};

export const SPINE = [
  { region: 'isles' as const, title: 'Meet AI', text: 'AI learns from examples, writes by predicting words, and does what your words say, not what you meant.', games: ['Sidekick Academy', 'Echo’s Letters', 'Order Up!'] },
  { region: 'kingdom' as const, title: 'How it decides', text: 'A machine can learn rules by asking good questions of its examples.', games: ['Tree Quest'] },
  { region: 'city' as const, title: 'Build and test', text: 'Tell a computer exactly what to do, find where AI breaks, and judge who to trust.', games: ['Relight', 'Countersign', 'The Line'] },
];

export const PROMISES = [
  { title: 'No accounts', text: 'Pupils open a page and play. Nothing to sign up for.' },
  { title: 'No live AI', text: 'Every machine is a transparent simulation, so pupils can see why it acts. Nothing typed leaves the device.' },
  { title: 'Works offline', text: 'Each game is a static site. The whole set can run from one laptop with the wifi off.' },
  { title: 'Honest labels', text: 'Prototypes say so. Simulations say they are simulations.' },
];
