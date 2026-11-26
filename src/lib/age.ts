// The age dial drives everything: the band (copy, type, colour) and the sky (continuous).
import type { BandId, RegionId } from '../content/chapters';

export const MIN_AGE = 7;
export const MAX_AGE = 17;

export function bandFor(age: number): BandId {
  if (age < 10) return 'young';
  if (age < 13) return 'middle';
  return 'older';
}

/** The point in the day the sky settles on for each group (as an age along the dial). */
export const BAND_SKY_AGE: Record<BandId, number> = { young: 8, middle: 11.5, older: 16.2 };

/** The switch has two groups: 6 to 10 ('young') and 11 to 14 ('older'). */
export function bandFromParam(band: string | null, age: string | null): 'young' | 'older' {
  if (band === 'young') return 'young';
  if (band === 'older' || band === 'middle') return 'older';
  const n = Number(age);
  return Number.isFinite(n) && n > 10 ? 'older' : 'young';
}

export const regionForBand: Record<BandId, RegionId> = { young: 'isles', middle: 'kingdom', older: 'city' };

export const clampAge = (n: number) => Math.min(MAX_AGE, Math.max(MIN_AGE, n));

// ---------------------------------------------------------------- colour
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

/** One moment of the day. Every colour in the hero is interpolated between these. */
export interface SkyStop {
  age: number;
  top: string;
  horizon: string;
  sea: string;
  seaDeep: string;
  land: string;
  landShade: string;
  sand: string;
  ink: string; // text drawn on the sky
  glow: number; // how strongly lanterns and windows glow (0..1)
  stars: number; // star opacity (0..1)
  sun: number; // 0 sunrise .. 1 set; >1 means the moon is up
}

export const SKY: SkyStop[] = [
  { age: 7, top: '#8fd3ff', horizon: '#fff0d9', sea: '#5bbde3', seaDeep: '#3a9cc8', land: '#9fdc8f', landShade: '#6fbf73', sand: '#ffe3a3', ink: '#1f2f52', glow: 0.15, stars: 0, sun: 0.18 },
  { age: 9.5, top: '#7cc6f2', horizon: '#fde7c2', sea: '#4fb3d9', seaDeep: '#3393c0', land: '#93d283', landShade: '#62b26a', sand: '#fbdc97', ink: '#1f2f52', glow: 0.2, stars: 0, sun: 0.38 },
  { age: 11.5, top: '#79acd8', horizon: '#ffd38a', sea: '#4c9fc6', seaDeep: '#2f7ea9', land: '#8cbf6b', landShade: '#5d9a54', sand: '#f2c978', ink: '#2a2433', glow: 0.35, stars: 0, sun: 0.66 },
  { age: 13, top: '#3f4a8f', horizon: '#ff9f7a', sea: '#3c6f9e', seaDeep: '#28507c', land: '#5f8a5e', landShade: '#466c4b', sand: '#d8a27a', ink: '#fff3ea', glow: 0.65, stars: 0.25, sun: 0.94 },
  { age: 15, top: '#16224f', horizon: '#5a3f7d', sea: '#1f3a66', seaDeep: '#142a4f', land: '#2f4f55', landShade: '#223b43', sand: '#6e6a7c', ink: '#eaf2ff', glow: 0.9, stars: 0.75, sun: 1.3 },
  { age: 17, top: '#050d24', horizon: '#1b2f63', sea: '#0f2347', seaDeep: '#0a1833', land: '#1f3640', landShade: '#162a33', sand: '#3c4458', ink: '#eaf2ff', glow: 1, stars: 1, sun: 1.6 },
];

export function skyAt(age: number): SkyStop {
  const a = clampAge(age);
  let i = 0;
  while (i < SKY.length - 2 && a > SKY[i + 1].age) i++;
  const p = SKY[i], q = SKY[i + 1];
  const t = Math.min(1, Math.max(0, (a - p.age) / (q.age - p.age)));
  const num = (k: 'glow' | 'stars' | 'sun') => p[k] + (q[k] - p[k]) * t;
  return {
    age: a,
    top: mix(p.top, q.top, t),
    horizon: mix(p.horizon, q.horizon, t),
    sea: mix(p.sea, q.sea, t),
    seaDeep: mix(p.seaDeep, q.seaDeep, t),
    land: mix(p.land, q.land, t),
    landShade: mix(p.landShade, q.landShade, t),
    sand: mix(p.sand, q.sand, t),
    ink: t < 0.5 ? p.ink : q.ink,
    glow: num('glow'),
    stars: num('stars'),
    sun: num('sun'),
  };
}

/** Relative luminance, used to keep hero text readable on any sky. */
export function luminance(h: string): number {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
