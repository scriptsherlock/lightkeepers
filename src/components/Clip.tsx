// Recorded gameplay. Muted, looping, and always pausable (motion over five seconds needs a
// pause control). With reduced motion it waits on the poster until someone presses play.
import { useEffect, useRef, useState } from 'react';
import { CHAPTERS, type Chapter } from '../content/chapters';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Clip({ chapter, label }: { chapter: Chapter; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reduced());
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing]);
  return (
    <div className="clip">
      <video
        ref={ref}
        src={chapter.clip}
        poster={chapter.preview}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
      />
      <button className="clip-toggle" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause the clip' : 'Play the clip'}>
        {playing ? (
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12M13 4v12" /></svg>
        ) : (
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" /></svg>
        )}
      </button>
    </div>
  );
}

/** A card's clip: shows the poster, plays while hovered or focused, rewinds when left. */
export function useHoverClip() {
  const ref = useRef<HTMLVideoElement>(null);
  const start = () => {
    const v = ref.current;
    if (!v || reduced()) return;
    v.play().catch(() => {});
  };
  const stop = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };
  return { ref, start, stop };
}

// ------------------------------------------------------------------ the tour
const TOUR = CHAPTERS.filter((c) => c.clip && c.number !== null).sort((a, b) => a.number! - b.number!);

/** Every clip back to back, with the chapter's question over it. For the booth screen. */
export function Tour({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const c = TOUR[i];
  useEffect(() => {
    const d = dialog.current!;
    if (!d.open) d.showModal();
    return () => d.close();
  }, []);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing, i]);
  return (
    <dialog
      ref={dialog}
      className="tour"
      aria-label="A one-minute tour of the games"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <video key={c.id} ref={video} src={c.clip} poster={c.preview} muted playsInline autoPlay onEnded={() => setI((n) => (n + 1) % TOUR.length)} />
      <div className="tour-caption" aria-live="polite">
        <span>Chapter {c.number}: {c.title}{c.status === 'in-development' ? ' (prototype)' : ''}</span>
        <strong>{c.question}</strong>
      </div>
      <div className="tour-bar">
        <ol className="tour-dots" aria-label="Clips">
          {TOUR.map((t, n) => (
            <li key={t.id}>
              <button className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={`Play ${t.title}`} aria-current={n === i ? 'true' : undefined} />
            </li>
          ))}
        </ol>
        <button className="btn btn-bar" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="btn btn-bar" onClick={onClose} autoFocus>Close the tour</button>
      </div>
    </dialog>
  );
}
