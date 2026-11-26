// Time of day as one number that only moves forward, so the sun really travels.
//   tau = 0, 2, 4…  dawn: the sun just over the sea on the left (ages 6 to 10)
//   tau = 1, 3, 5…  night: deep blue, moon and stars (ages 11 to 14)
// Going from dawn to night the sun climbs, crosses the sky and sets on the right.
// Going from night to dawn it passes under the sea and rises again on the left.
import { mix } from './age';

export interface Daylight {
  elevation: number; // degrees above the sea (negative: below)
  azimuth: number; // radians, three.js spherical theta (PI looks straight ahead)
  day: number; // 0 night .. 1 full day
  night: number; // 1 - day
  warm: number; // 0..1, how golden the low sun is
  fog: string; // colour of the far haze
  ink: string; // readable text colour over this sky
  dark: boolean;
  flatAge: number; // for the flat fallback map, as an age along its old morning-to-night scale
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function daylight(tau: number): Daylight {
  const phase = ((tau % 2) + 2) % 2;
  let elevation: number, azimuth: number;
  if (phase <= 1) {
    const t = phase;
    azimuth = Math.PI + 0.75 - t * 1.5;
    elevation = t < 0.82 ? 2.5 + Math.sin((Math.PI * t) / 0.82) * 10 : 2.5 - ((t - 0.82) / 0.18) * 8.5;
  } else {
    const t = phase - 1;
    azimuth = Math.PI - 0.75 - t * (Math.PI * 2 - 1.5);
    elevation = t < 0.75 ? -6 - Math.sin((Math.PI * t) / 0.75) * 10 : -6 + ((t - 0.75) / 0.25) * 8.5;
  }
  const day = clamp01((elevation + 3) / 7);
  const night = 1 - day;
  const warm = elevation > -3 ? clamp01(1 - (elevation - 1) / 9) : 0;
  const dayFog = mix('#d9e7f3', '#f4c8b1', warm);
  const fog = mix('#1a2456', dayFog, day);
  return {
    elevation,
    azimuth,
    day,
    night,
    warm,
    fog,
    ink: day > 0.45 ? '#1f2f52' : '#eaf2ff',
    dark: day <= 0.45,
    flatAge: 7 + night * 10,
  };
}

/** The next resting point for a group, always forward in time from `now`. */
export function nextTau(now: number, night: boolean): number {
  const base = Math.floor(now);
  const want = night ? 1 : 0; // parity of the resting point
  let t = base;
  while (t < now - 1e-6 || ((t % 2) + 2) % 2 !== want) t++;
  return t;
}
