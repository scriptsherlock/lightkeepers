// The story and the teachers' notes, in one sheet with two tabs. Opened from the header, so the
// main screen stays just the islands.
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { REGIONS, ROUTE, STATUS_LABEL, type Chapter } from '../content/chapters';
import { PROMISES, SPINE, STORY } from '../content/bands';
import { BUILT_FACTS } from '../content/site';

export type InfoTab = 'story' | 'teachers';

function Keeper() {
  return (
    <svg className="keeper" width="150" height="150" viewBox="0 0 160 160" role="img" aria-label="The Keeper, holding a lantern">
      <circle cx="80" cy="80" r="76" fill="var(--keeper-bg, #fff3d6)" />
      <circle cx="118" cy="104" r="30" fill="#ffd36b" opacity="0.4" />
      <path d="M38 156 Q40 104 80 100 Q120 104 122 156 Z" fill="#2c4a6e" />
      <path d="M58 104 Q80 116 102 104 L104 112 Q80 126 56 112 Z" fill="#ffb547" />
      <circle cx="80" cy="74" r="26" fill="#f2c9a0" />
      <path d="M58 80 Q60 102 80 104 Q100 102 102 80 Q96 92 80 92 Q64 92 58 80 Z" fill="#e8e4dc" />
      <circle cx="71" cy="72" r="2.6" fill="#2a2433" />
      <circle cx="89" cy="72" r="2.6" fill="#2a2433" />
      <path d="M73 83 Q80 88 87 83" stroke="#2a2433" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M52 64 Q56 40 80 40 Q104 40 108 64 Z" fill="#2c4a6e" />
      <rect x="50" y="60" width="60" height="8" rx="4" fill="#21395a" />
      <path d="M104 118 Q114 112 118 98" stroke="#2c4a6e" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M109 92 h18 l-3 -5 h-12 z" fill="#5a4a3a" />
      <rect x="110" y="92" width="16" height="22" rx="4" fill="#ffd36b" stroke="#5a4a3a" strokeWidth="2" />
      <path d="M118 97 c3 4 3 8 0 11 c-3 -3 -3 -7 0 -11 z" fill="#ff8a3d" />
    </svg>
  );
}

export function InfoSheet({ tab, onTab, onClose, onOpen }: { tab: InfoTab; onTab: (t: InfoTab) => void; onClose: () => void; onOpen: (c: Chapter) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
    return () => d.close();
  }, []);
  const tabs: [InfoTab, string][] = [
    ['story', 'The story'],
    ['teachers', 'For teachers'],
  ];
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    onTab(tab === 'story' ? 'teachers' : 'story');
  };
  return (
    <dialog
      ref={ref}
      className="panel info-sheet"
      aria-label={tab === 'story' ? 'The story' : 'For teachers'}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel-inner">
        <header className="panel-head">
          <div className="info-tabs" role="tablist" aria-label="About Lightkeepers" onKeyDown={onKey}>
            {tabs.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} className={tab === id ? 'on' : ''} onClick={() => onTab(id)}>
                {label}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </header>

        {tab === 'story' ? (
          <div role="tabpanel" className="info-body">
            <div className="story-top">
              <Keeper />
              <blockquote className="keeper-says">
                <p>Every lantern here is looked after by a helpful machine. Help me find out how they think.</p>
                <footer>The Keeper</footer>
              </blockquote>
            </div>
            <h2>The Keeper needs an apprentice</h2>
            {STORY.premise.map((p) => (
              <p key={p} className="story-line">{p}</p>
            ))}
            <p className="story-finale">“{STORY.finale}”</p>
            <div className="story-question">
              <h3>The Keeper always asks: {STORY.question}</h3>
              <ul>
                {STORY.answers.map((a) => (
                  <li key={a.when}>
                    <span>{a.when}</span>
                    <strong>{a.answer}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <h3 className="info-sub">One journey, three big ideas</h3>
            <ol className="info-spine">
              {SPINE.map((s, i) => (
                <li key={s.title} className={`spine-${s.region}`}>
                  <span className="spine-num" aria-hidden="true">{i + 1}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <span className="info-where">{REGIONS[s.region].name}</span>
                    <p>{s.text}</p>
                    <p className="spine-games">{s.games.join(', ')}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div role="tabpanel" className="info-body">
            <h2>For teachers</h2>
            <p className="info-lede">Each game teaches one idea about AI and ends with an “I can” statement. Open any row to see the chapter.</p>
            <div className="promises">
              {PROMISES.map((p) => (
                <div key={p.title} className="promise">
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
            <div className="table-wrap" role="region" aria-label="Every chapter" tabIndex={0}>
              <table className="chapter-table">
                <thead>
                  <tr>
                    <th scope="col">Chapter</th>
                    <th scope="col">Ages</th>
                    <th scope="col">The question</th>
                    <th scope="col">Pupils can say</th>
                    <th scope="col">Curriculum fit</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ROUTE.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">
                        <button className="link-btn" onClick={() => onOpen(c)}>{c.number}. {c.title}</button>
                      </th>
                      <td>{c.ages[0]} to {c.ages[1]}</td>
                      <td>{c.question}</td>
                      <td>{c.iCan}</td>
                      <td>{c.curriculum}</td>
                      <td><span className={`status status-${c.status}`}>{STATUS_LABEL[c.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="info-sub">How it’s built</h3>
            <div className="built-grid">
              {BUILT_FACTS.map((f) => (
                <div key={f.title} className="built-fact">
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
            <p className="fine">Curriculum links refer to the English national curriculum for computing. Made for Turing Education.</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
