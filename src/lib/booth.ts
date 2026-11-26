// Booth helpers: the demo's own switching between groups, idle tidying, and presenter keys.
import { useEffect, useRef } from 'react';

const FIRST_SWITCH_MS = 15_000; // nobody has touched anything for this long: start the show
const EVERY_MS = 12_000; // then switch groups this often (the sun takes about 4 s of it)
const TIDY_MS = 90_000; // close an open chapter or tour after this long untouched

/**
 * Switches between the age groups by itself when nobody is using the screen. Any touch, key or
 * wheel resets the clock. It never switches while `busy` (a chapter, game or tour is open).
 */
export function useAutoCycle(on: boolean, busy: boolean, next: () => void, tidy: () => void) {
  const state = useRef({ last: performance.now(), switched: 0, tidied: false });
  const ref = useRef({ busy, next, tidy });
  ref.current = { busy, next, tidy };

  useEffect(() => {
    if (!on) return;
    const s = state.current;
    const wake = () => {
      s.last = performance.now();
      s.tidied = false;
    };
    const timer = window.setInterval(() => {
      const now = performance.now();
      const idle = now - s.last;
      if (idle > TIDY_MS && !s.tidied) {
        s.tidied = true;
        ref.current.tidy();
      }
      if (!ref.current.busy && idle > FIRST_SWITCH_MS && now - s.switched > EVERY_MS) {
        s.switched = now;
        ref.current.next();
      }
    }, 500);
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      window.clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [on]);
}

export interface PresenterActions {
  openChapter: (n: number) => void;
  home: () => void;
  reset: () => void;
  nudgeBand: (d: number) => void;
  tour: () => void;
}

/** Hidden keys for the person at the booth. Ignored while typing or when a modifier is held. */
export function usePresenterKeys(a: PresenterActions) {
  const ref = useRef(a);
  ref.current = a;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) {
        if (!(t instanceof HTMLInputElement && t.type === 'range')) return;
      }
      const k = e.key.toLowerCase();
      if (k >= '1' && k <= '7') ref.current.openChapter(Number(k));
      else if (k === '0') ref.current.home();
      else if (k === 'r') ref.current.reset();
      else if (k === '[') ref.current.nudgeBand(-1);
      else if (k === ']') ref.current.nudgeBand(1);
      else if (k === 'v') ref.current.tour();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
