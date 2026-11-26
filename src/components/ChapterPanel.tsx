// A chapter, opened from its lantern or card. Native <dialog>, so focus and Escape just work.
import { useEffect, useRef } from 'react';
import { REGIONS, STATUS_LABEL, suits, type BandId, type Chapter } from '../content/chapters';
import type { View } from '../content/bands';
import type { Links } from '../lib/gameLinks';
import { Clip } from './Clip';

interface Props {
  chapter: Chapter;
  view: View;
  band: BandId;
  links: Links;
  lit: boolean;
  onPlay: (c: Chapter) => void;
  onClose: () => void;
}

export function ChapterPanel({ chapter: c, view, band, links, lit, onPlay, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
    return () => d.close();
  }, []);
  const region = REGIONS[c.region];
  const link = links[c.id];
  const playable = (c.status === 'live' || c.status === 'in-development') && !!link;
  const teacher = view === 'teacher';
  return (
    <dialog
      ref={ref}
      className={`panel panel-${c.region}`}
      aria-labelledby="panel-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel-inner">
        <header className="panel-head">
          <p className="panel-where">
            {region.name}, {region.time.toLowerCase()}
            {c.number ? <span className="panel-num">Chapter {c.number}</span> : null}
          </p>
          <button className="icon-btn" onClick={onClose} aria-label="Close chapter" autoFocus>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </header>

        {c.clip ? (
          <figure className="panel-shot">
            <Clip chapter={c} label={`${c.title}, recorded in play`} />
            {lit && <figcaption>Lantern lit</figcaption>}
          </figure>
        ) : c.preview ? (
          <figure className="panel-shot">
            <img src={c.preview} alt={`${c.title}, as it looks in play`} />
            {lit && <figcaption>Lantern lit</figcaption>}
          </figure>
        ) : (
          <div className="panel-shot panel-shot-empty" aria-hidden="true">
            <span>{STATUS_LABEL[c.status]}</span>
          </div>
        )}

        <h2 id="panel-title">{c.title}</h2>
        <p className="panel-machine">With {c.machine}</p>
        <p className="panel-question">{c.question}</p>
        <p className="panel-hook">{c.hooks[band]}</p>

        <div className="panel-facts">
          <div>
            <span>Best for</span>
            <strong>Ages {c.ages[0]} to {c.ages[1]}</strong>
            {!teacher && (suits(c, band) ? <small className="fit-yes">Right for this age group</small> : <small>For the other age group, still free to play</small>)}
          </div>
          <div>
            <span>Status</span>
            <strong className={`status status-${c.status}`}>{STATUS_LABEL[c.status]}</strong>
          </div>
          <div>
            <span>Works on</span>
            <strong>{c.devices}</strong>
          </div>
        </div>

        <h3>What you do</h3>
        <ol className="panel-steps">
          {c.whatYouDo.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <div className="panel-ican">
          <span>When the lantern is lit</span>
          <strong>{c.iCan}</strong>
        </div>

        {c.honesty && <p className="panel-honest">{c.honesty}</p>}

        <details className="panel-more" open={teacher || band === 'older'}>
          <summary>Under the hood</summary>
          <p>{c.underTheHood}</p>
          <p className="panel-small">Built with {c.stack}.</p>
          {teacher && <p className="panel-small">Curriculum fit: {c.curriculum}</p>}
        </details>

        <div className="panel-actions">
          {playable ? (
            <>
              <button className="btn btn-primary" onClick={() => onPlay(c)}>
                {c.status === 'in-development' ? 'Try the prototype' : 'Play here'}
              </button>
              <a className="btn btn-quiet" href={link.href} target="_blank" rel="noreferrer">
                Open in a new tab
              </a>
            </>
          ) : (
            <p className="panel-small">This lantern isn’t lit yet. It’s part of what comes next.</p>
          )}
        </div>
        {playable && link.local && <p className="panel-small">Playing from this laptop, so it works without wifi.</p>}
      </div>
    </dialog>
  );
}
