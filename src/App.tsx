import { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BAND_RANGE, ROUTE, suggestedFor, type Chapter } from './content/chapters';
import { BANDS } from './content/bands';
import { bandFromParam, skyAt } from './lib/age';
import { daylight, nextTau } from './lib/daylight';
import { lightLantern, loadProgress, saveProgress, type Progress } from './lib/progress';
import { useGameLinks } from './lib/gameLinks';
import { useAutoCycle, usePresenterKeys } from './lib/booth';
import { Sky } from './components/Sky';
import { LanternMap } from './components/LanternMap';
import { AgeSwitch, type Group } from './components/AgeSwitch';
import { ChapterPanel } from './components/ChapterPanel';
import { GameFrame } from './components/GameFrame';
import { Tour } from './components/Clip';
import { InfoSheet, type InfoTab } from './components/InfoSheet';

const Scene3D = lazy(() => import('./components/Scene3D'));

const params = new URLSearchParams(location.search);
const START: Group = bandFromParam(params.get('band'), params.get('age'));
const AUTO = !params.has('still');
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const webglOK = (() => {
  if (params.has('flat')) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

/** If the 3D scene fails for any reason, the flat map takes over. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Time of day, moving forward to `target` over about four seconds, so the sun visibly travels. */
function useTau(target: number) {
  const [tau, setTau] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reducedMotion()) {
      from.current = target;
      setTau(target);
      return;
    }
    const start = performance.now(), a = from.current, dur = 2300;
    let raf = 0;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const v = a + (target - a) * ease(t);
      from.current = v;
      setTau(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return tau;
}

export default function App() {
  const [group, setGroupRaw] = useState<Group>(START);
  const [target, setTarget] = useState(START === 'older' ? 1 : 0);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [open, setOpen] = useState<Chapter | null>(null);
  const [playing, setPlaying] = useState<Chapter | null>(null);
  const [tour, setTour] = useState(false);
  const [info, setInfo] = useState<InfoTab | null>(null);
  const links = useGameLinks();

  const tau = useTau(target);
  const light = useMemo(() => daylight(tau), [tau]);
  const flatSky = useMemo(() => skyAt(light.flatAge), [light.flatAge]);
  const copy = BANDS[group];
  const [lo, hi] = BAND_RANGE[group];

  useLayoutEffect(() => {
    document.documentElement.dataset.view = group;
  }, [group]);
  useEffect(() => saveProgress(progress), [progress]);

  const setGroup = useCallback((g: Group) => {
    setGroupRaw(g);
    setTarget((t) => nextTau(t, g === 'older'));
  }, []);
  const toggle = useCallback(() => setGroup(group === 'young' ? 'older' : 'young'), [group, setGroup]);

  const home = useCallback(() => {
    setOpen(null);
    setPlaying(null);
    setTour(false);
    setInfo(null);
  }, []);

  useAutoCycle(AUTO, !!open || !!playing || tour || !!info, toggle, () => {
    setOpen(null);
    setTour(false);
    setInfo(null);
  });

  usePresenterKeys({
    openChapter: (n) => {
      const c = ROUTE[n - 1];
      if (c) {
        setPlaying(null);
        setTour(false);
        setOpen(c);
      }
    },
    home,
    reset: () => {
      setProgress({ version: 1, lit: [] });
      home();
      setGroup('young');
    },
    nudgeBand: () => toggle(),
    tour: () => {
      setOpen(null);
      setTour((t) => !t);
    },
  });

  const play = (c: Chapter) => {
    if (!links[c.id]) return;
    setProgress((p) => lightLantern(p, c.id));
    setOpen(null);
    setPlaying(c);
  };

  const flat = (
    <>
      <Sky sky={flatSky} />
      <LanternMap sky={flatSky} band={group} lit={progress.lit} onOpen={setOpen} />
    </>
  );

  return (
    <main className={`stage ${light.dark ? 'on-dark' : ''}`} style={{ color: light.ink, background: `linear-gradient(${flatSky.top}, ${flatSky.horizon})` }}>
      <p className="brand">
        <svg viewBox="0 0 24 32" aria-hidden="true">
          <path d="M5 8h14l-2.5-5h-9z" fill="currentColor" />
          <rect x="5" y="8" width="14" height="17" rx="3.5" fill="#ffb547" />
          <path d="M12 11c3 3.5 3 7 0 10-3-3-3-6.5 0-10z" fill="#fff4d6" />
          <rect x="3.5" y="25" width="17" height="3.5" rx="1.75" fill="currentColor" />
        </svg>
        <span>Lightkeepers</span>
        <small>made for Turing Education</small>
      </p>
      <nav className="stage-nav" aria-label="About">
        <button onClick={() => setInfo('story')}>Story</button>
        <button onClick={() => setInfo('teachers')}>For teachers</button>
      </nav>

      {webglOK ? (
        <SceneBoundary fallback={flat}>
          <Suspense fallback={flat}>
            <Scene3D light={light} band={group} lit={progress.lit} reduced={reducedMotion()} active={!playing && !tour} onOpen={setOpen} />
          </Suspense>
        </SceneBoundary>
      ) : (
        flat
      )}

      <div className="hero-copy">
        <p className="hero-place">{copy.place}</p>
        <h1>{copy.headline}</h1>
        <p className="hero-sub">{copy.sub}</p>
        <AgeSwitch group={group} onGroup={setGroup} />
        <div className="hero-suggest" aria-live="polite">
          <span>Lanterns for ages {lo} to {hi}</span>
          <ul>
            {suggestedFor(group).map((c) => (
              <li key={c.id}>
                <button className={`chip chip-${c.region}`} onClick={() => setOpen(c)}>
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button className="tour-btn" onClick={() => setTour(true)}>
          <span aria-hidden="true">
            <svg viewBox="0 0 20 20"><path d="M7 5l8 5-8 5z" /></svg>
          </span>
          Watch the one-minute tour
        </button>
      </div>

      {open && (
        <ChapterPanel
          key={open.id}
          chapter={open}
          view={group}
          band={group}
          links={links}
          lit={progress.lit.includes(open.id)}
          onPlay={play}
          onClose={() => setOpen(null)}
        />
      )}
      {playing && links[playing.id] && <GameFrame chapter={playing} href={links[playing.id].href} onClose={() => setPlaying(null)} />}
      {tour && <Tour onClose={() => setTour(false)} />}
      {info && (
        <InfoSheet
          tab={info}
          onTab={setInfo}
          onClose={() => setInfo(null)}
          onOpen={(c) => {
            setInfo(null);
            setOpen(c);
          }}
        />
      )}
    </main>
  );
}
