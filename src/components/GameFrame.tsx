// A game, played inside the tour. The bar stays outside the frame, because a game that
// captures keys (Relight's city) would swallow Escape.
import { useEffect, useRef, useState } from 'react';
import type { Chapter } from '../content/chapters';

export function GameFrame({ chapter, href, onClose }: { chapter: Chapter; href: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="game-frame"
      aria-label={`${chapter.title}, playing`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="game-bar">
        <button className="btn btn-bar" onClick={onClose} autoFocus>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4l-6 6 6 6" /></svg>
          Back to the map
        </button>
        <p>
          {chapter.number ? `Chapter ${chapter.number}: ` : ''}
          <strong>{chapter.title}</strong>
          <span className="game-q">{chapter.question}</span>
        </p>
        <a className="btn btn-bar" href={href} target="_blank" rel="noreferrer">
          Open in a new tab
        </a>
      </div>
      <div className="game-stage">
        {!loaded && (
          <div className="game-loading" role="status">
            <span className="game-loading-lantern" aria-hidden="true" />
            Lighting the lantern…
          </div>
        )}
        <iframe src={href} title={chapter.title} allow="fullscreen" onLoad={() => setLoaded(true)} />
      </div>
    </dialog>
  );
}
