// Lanterns a visitor has lit on this device. Shared key, so the games can light them too later.
// Only chapter ids are stored: nothing personal.
const KEY = 'lightkeepers.progress';

export interface Progress {
  version: 1;
  lit: string[];
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, lit: [] };
    const p = JSON.parse(raw) as Partial<Progress>;
    return { version: 1, lit: Array.isArray(p.lit) ? p.lit.filter((x): x is string => typeof x === 'string').slice(0, 50) : [] };
  } catch {
    return { version: 1, lit: [] };
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private mode or storage full: lanterns just won't be remembered.
  }
}

export const lightLantern = (p: Progress, id: string): Progress => (p.lit.includes(id) ? p : { ...p, lit: [...p.lit, id] });
