import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bandFor, bandFromParam, clampAge, luminance, skyAt, SKY, MIN_AGE, MAX_AGE } from '../../src/lib/age';
import { CHAPTERS, ROUTE, suggestedFor } from '../../src/content/chapters';
import { BANDS } from '../../src/content/bands';
import { lightLantern } from '../../src/lib/progress';
import { daylight, nextTau } from '../../src/lib/daylight';

describe('age bands', () => {
  it('splits 7–9, 10–12 and 13–17', () => {
    expect([7, 9, 10, 12, 13, 17].map(bandFor)).toEqual(['young', 'young', 'middle', 'middle', 'older', 'older']);
  });
  it('clamps the dial to 7–17', () => {
    expect(clampAge(3)).toBe(MIN_AGE);
    expect(clampAge(40)).toBe(MAX_AGE);
  });
});

describe('the sky', () => {
  it('matches each stop exactly and stays valid in between', () => {
    for (const stop of SKY) expect(skyAt(stop.age).top).toBe(stop.top);
    for (let a = MIN_AGE; a <= MAX_AGE; a += 0.25) {
      const s = skyAt(a);
      for (const c of [s.top, s.horizon, s.sea, s.land]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      expect(s.glow).toBeGreaterThanOrEqual(0);
      expect(s.glow).toBeLessThanOrEqual(1);
    }
  });
  it('gets darker and starrier as the learner gets older', () => {
    expect(luminance(skyAt(17).top)).toBeLessThan(luminance(skyAt(7).top));
    expect(skyAt(17).stars).toBe(1);
    expect(skyAt(7).stars).toBe(0);
  });
  it('picks hero text that stays readable on the sky', () => {
    for (let a = MIN_AGE; a <= MAX_AGE; a += 0.5) {
      const s = skyAt(a);
      const [hi, lo] = [luminance(s.ink), luminance(s.top)].sort((x, y) => y - x);
      expect((hi + 0.05) / (lo + 0.05), `age ${a}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('chapters', () => {
  it('number the route 1 to 7 without gaps', () => {
    expect(ROUTE.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('keep Relight and Countersign for ages 10 and up', () => {
    for (const id of ['relight', 'countersign']) {
      const c = CHAPTERS.find((x) => x.id === id)!;
      expect(c.ages[0]).toBe(10);
      expect(c.groups).toEqual(['older']);
    }
  });
  it('have sensible ages, a question and an I can statement', () => {
    for (const c of CHAPTERS) {
      expect(c.ages[0]).toBeGreaterThanOrEqual(MIN_AGE);
      expect(c.ages[1]).toBeLessThanOrEqual(MAX_AGE);
      expect(c.ages[0]).toBeLessThanOrEqual(c.ages[1]);
      expect(c.question.endsWith('?')).toBe(true);
      expect(c.iCan.startsWith('I can')).toBe(true);
      expect(Object.keys(c.hooks).sort()).toEqual(['middle', 'older', 'young']);
    }
  });
  it('only link live sites, and every playable game has one', () => {
    for (const c of CHAPTERS) {
      if (c.status === 'live' || c.status === 'in-development') expect(c.url).toMatch(/^https:\/\/scriptsherlock\.github\.io\//);
      else expect(c.url).toBeUndefined();
    }
  });
  it('point at preview images and clips that exist', () => {
    for (const c of CHAPTERS) {
      if (c.preview) expect(existsSync(`public/${c.preview}`), c.preview).toBe(true);
      if (c.clip) expect(existsSync(`public/${c.clip}`), c.clip).toBe(true);
    }
  });
  it('open every level in every playable game for the demo', () => {
    for (const c of CHAPTERS.filter((x) => x.url)) expect(c.unlock, c.id).toMatch(/^#(unlock|teacher)$/);
  });
  it('label anything unfinished honestly', () => {
    for (const c of CHAPTERS.filter((x) => x.status !== 'live')) expect(c.honesty).toBeTruthy();
  });
  it('light the right lanterns for each group', () => {
    const young = suggestedFor('young').map((c) => c.id);
    const older = suggestedFor('older').map((c) => c.id);
    expect(young).toEqual(['sidekick', 'order-up', 'treequest']);
    expect(older).toEqual(['order-up', 'treequest', 'relight', 'countersign']);
    expect([...young, ...older]).not.toContain('the-line'); // a prototype is never pushed
  });
  it('maps old ?age links and new ?band links to a group', () => {
    expect(bandFromParam(null, '8')).toBe('young');
    expect(bandFromParam(null, '11')).toBe('older');
    expect(bandFromParam('older', null)).toBe('older');
    expect(bandFromParam('middle', null)).toBe('older');
    expect(bandFromParam('nonsense', null)).toBe('young');
  });
});

describe('copy and progress', () => {
  it('has words for every view', () => {
    for (const v of ['young', 'middle', 'older', 'teacher'] as const) {
      expect(BANDS[v].headline.length).toBeGreaterThan(10);
      expect(BANDS[v].keeper.length).toBeGreaterThan(10);
    }
  });
  it('lights each lantern once', () => {
    const p = lightLantern(lightLantern({ version: 1, lit: [] }, 'relight'), 'relight');
    expect(p.lit).toEqual(['relight']);
  });
});

describe('the sun', () => {
  it('rests at dawn for 6 to 10 and at night for 11 to 14', () => {
    const dawn = daylight(0), night = daylight(1);
    expect(dawn.elevation).toBeGreaterThan(0);
    expect(dawn.elevation).toBeLessThan(5);
    expect(dawn.warm).toBeGreaterThan(0.5);
    expect(night.day).toBe(0);
    expect(night.dark).toBe(true);
  });
  it('climbs and crosses the sky on the way from dawn to night', () => {
    const noon = daylight(0.41);
    expect(noon.elevation).toBeGreaterThan(10);
    expect(daylight(0).azimuth).toBeGreaterThan(daylight(0.8).azimuth); // left to right
  });
  it('rises again on the left after the night', () => {
    expect(daylight(2).elevation).toBeCloseTo(daylight(0).elevation, 5);
    expect(Math.cos(daylight(2).azimuth)).toBeCloseTo(Math.cos(daylight(0).azimuth), 5);
    expect(daylight(1.5).elevation).toBeLessThan(-6);
  });
  it('only ever moves time forward', () => {
    expect(nextTau(0, true)).toBe(1);
    expect(nextTau(1, false)).toBe(2);
    expect(nextTau(1.4, true)).toBe(3);
    expect(nextTau(2, false)).toBe(2);
  });
});
