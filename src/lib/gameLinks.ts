// At a booth the games are bundled into public/games (npm run bundle:games), so the tour runs
// with the wifi off. Online, the live GitHub Pages sites are used instead.
import { useEffect, useState } from 'react';
import { CHAPTERS, type Chapter } from '../content/chapters';

export type Links = Record<string, { href: string; local: boolean }>;

const online = (): Links =>
  Object.fromEntries(CHAPTERS.filter((c) => c.url).map((c) => [c.id, { href: c.url!, local: false }]));

async function hasLocal(c: Chapter): Promise<boolean> {
  if (!c.localPath) return false;
  try {
    const res = await fetch(c.localPath, { method: 'HEAD', cache: 'no-store' });
    return res.ok && (res.headers.get('content-type') ?? '').includes('html');
  } catch {
    return false;
  }
}

export function useGameLinks(): Links {
  const [links, setLinks] = useState<Links>(online);
  useEffect(() => {
    // Bundled copies only exist on the booth laptop, so the live site doesn't look for them.
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    let alive = true;
    Promise.all(CHAPTERS.map(async (c) => [c, await hasLocal(c)] as const)).then((found) => {
      if (!alive) return;
      const next = online();
      for (const [c, ok] of found) if (ok) next[c.id] = { href: c.localPath!, local: true };
      setLinks(next);
    });
    return () => {
      alive = false;
    };
  }, []);
  return links;
}
