// "How old is your learner?" Two groups on one switch: 6 to 10 brings the dawn, 11 to 14 the
// night. Arrow keys move between them.
import { useRef, type KeyboardEvent } from 'react';

export type Group = 'young' | 'older';
export const GROUPS: { id: Group; ages: string; label: string }[] = [
  { id: 'young', ages: '6–10', label: 'Ages 6 to 10' },
  { id: 'older', ages: '11–14', label: 'Ages 11 to 14' },
];

function Icon({ id }: { id: Group }) {
  return id === 'young' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M12 5v2.5M5.4 9.4l1.7 1.7M18.6 9.4l-1.7 1.7M2.5 20h19" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 4.5a7.5 7.5 0 1 0 4 12.8A8 8 0 0 1 15.5 4.5z" />
    </svg>
  );
}

export function AgeSwitch({ group, onGroup }: { group: Group; onGroup: (g: Group) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = GROUPS.findIndex((g) => g.id === group);
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (index + step + GROUPS.length) % GROUPS.length;
    onGroup(GROUPS[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className="switch-card">
      <p className="switch-label" id="age-label">How old is your learner?</p>
      <div className="age-switch" role="radiogroup" aria-labelledby="age-label" onKeyDown={onKey} style={{ ['--i' as string]: index }}>
        <span className="age-switch-thumb" aria-hidden="true" />
        {GROUPS.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={group === g.id}
            aria-label={g.label}
            tabIndex={group === g.id ? 0 : -1}
            className={`age-option ${group === g.id ? 'on' : ''}`}
            onClick={() => onGroup(g.id)}
          >
            <Icon id={g.id} />
            <span className="age-option-ages">{g.ages}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
