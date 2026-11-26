// The Lantern Lands. Colours come from the sky at the chosen age, so the same map reads as
// morning on the Isles, afternoon over the Kingdom, or night in Nova Grid.
import type { KeyboardEvent } from 'react';
import { CHAPTERS, ROUTE, STATUS_LABEL, suits, type BandId, type Chapter } from '../content/chapters';
import type { SkyStop } from '../lib/age';

interface Props {
  sky: SkyStop;
  band: BandId;
  lit: string[];
  onOpen: (c: Chapter) => void;
}

// Route through the lanterns in chapter order, as one smooth dotted line.
function routePath(): string {
  const pts = ROUTE.map((c) => c.pos);
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 26;
    d += ` Q${mx} ${my} ${b.x} ${b.y}`;
  }
  return d;
}

// Buildings for Nova Grid: x, width, height. Fixed so the skyline never shifts.
const TOWERS: [number, number, number][] = [
  [688, 26, 52], [716, 20, 78], [738, 30, 60], [770, 22, 104], [794, 34, 70], [830, 18, 132], [850, 28, 88],
  [880, 24, 116], [906, 30, 66], [938, 22, 92], [962, 20, 50],
];

function Lantern({ c, band, lit, onOpen }: { c: Chapter; band: BandId; lit: boolean; onOpen: (c: Chapter) => void }) {
  const playable = c.status === 'live' || c.status === 'in-development';
  const forAge = playable && suits(c, band);
  const state = !playable ? 'unlit' : lit ? 'lit' : forAge ? 'suggested' : 'idle';
  const label = `${c.title}. ${c.question} ${c.number ? `Chapter ${c.number}. ` : ''}${STATUS_LABEL[c.status]}.${forAge ? ' Suits this age group.' : ''}`;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(c);
    }
  };
  const tagW = Math.max(74, c.title.length * 7.1 + 22);
  return (
    <g
      className={`lantern lantern-${state}`}
      transform={`translate(${c.pos.x} ${c.pos.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => onOpen(c)}
      onKeyDown={onKey}
    >
      <circle className="lantern-glow" r="34" cy="-30" />
      <circle className="lantern-ring" r="22" cy="-30" />
      <g className="lantern-body">
        <line x1="0" y1="0" x2="0" y2="-14" className="lantern-pole" />
        <path d="M-9 -38 h18 l-3 -5 h-12 z" className="lantern-cap" />
        <rect x="-8" y="-38" width="16" height="22" rx="4" className="lantern-glass" />
        <path d="M0 -33 c3 4 3 8 0 11 c-3 -3 -3 -7 0 -11 z" className="lantern-flame" />
        <rect x="-10" y="-17" width="20" height="4" rx="2" className="lantern-cap" />
      </g>
      <g className="lantern-tag" transform="translate(0 16)">
        <rect x={-tagW / 2} y="0" width={tagW} height="22" rx="11" />
        <text x="0" y="15" textAnchor="middle">
          {c.number ? `${c.number}  ` : ''}
          {c.title}
        </text>
      </g>
    </g>
  );
}

export function LanternMap({ sky, band, lit, onOpen }: Props) {
  const windowGlow = 0.12 + sky.glow * 0.88;
  return (
    <svg
      className="lantern-map"
      viewBox="0 0 1000 600"
      overflow="visible"
      preserveAspectRatio="xMidYMax meet"
      role="group"
      aria-label="The Lantern Lands map. Each lantern is one chapter."
      style={{ ['--land' as string]: sky.land, ['--land-shade' as string]: sky.landShade, ['--sand' as string]: sky.sand, ['--glow' as string]: String(sky.glow) }}
    >
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.sea} />
          <stop offset="1" stopColor={sky.seaDeep} />
        </linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.horizon} stopOpacity="0.85" />
          <stop offset="1" stopColor={sky.horizon} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="beam" cx="0" cy="0.5" r="1">
          <stop offset="0" stopColor="#fff3c4" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sea and horizon haze */}
      {/* the sea runs off the left edge, under the words, so the horizon is one line */}
      <path d="M-1600 150 Q500 138 1000 150 V640 H-1600 Z" fill="url(#sea)" />
      <rect x="-1600" y="146" width="2600" height="40" fill="url(#haze)" />
      <g className="waves" stroke="#ffffff" strokeOpacity={0.18 + (1 - sky.glow) * 0.2} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M60 300 q12 -6 24 0 q12 6 24 0" />
        <path d="M430 340 q12 -6 24 0 q12 6 24 0" />
        <path d="M600 470 q12 -6 24 0 q12 6 24 0" />
        <path d="M150 560 q12 -6 24 0 q12 6 24 0" />
        <path d="M880 540 q12 -6 24 0 q12 6 24 0" />
        <path d="M270 250 q10 -5 20 0 q10 5 20 0" />
        <path d="M700 270 q10 -5 20 0 q10 5 20 0" />
      </g>

      {/* ---------------- The Living Kingdom: far across the sea */}
      <g className="region-kingdom">
        <path d="M360 236 Q420 150 480 196 Q520 128 590 182 Q650 140 720 236 Z" fill={sky.landShade} opacity="0.55" />
        <ellipse cx="540" cy="238" rx="200" ry="34" fill={sky.sand} />
        <path d="M352 236 Q420 196 500 210 Q600 188 728 236 Q640 252 540 254 Q430 252 352 236 Z" fill={sky.land} />
        {/* castle */}
        <g fill={sky.landShade}>
          <rect x="594" y="186" width="52" height="34" />
          <rect x="588" y="170" width="14" height="50" />
          <rect x="638" y="166" width="14" height="54" />
          <rect x="612" y="176" width="16" height="18" />
          <path d="M588 170 l7 -12 l7 12 z M638 166 l7 -13 l7 13 z M612 176 l8 -12 l8 12 z" />
        </g>
        <g fill="#ffd36b" opacity={0.2 + sky.glow * 0.8}>
          <rect x="604" y="196" width="5" height="7" rx="1" />
          <rect x="626" y="198" width="5" height="7" rx="1" />
          <rect x="592" y="182" width="5" height="6" rx="1" />
        </g>
        {/* the Wise Tree */}
        <rect x="456" y="190" width="10" height="30" rx="3" fill="#7a5a3a" />
        <circle cx="461" cy="178" r="28" fill={sky.landShade} />
        <circle cx="446" cy="186" r="16" fill={sky.land} opacity="0.7" />
        <circle cx="474" cy="170" r="12" fill={sky.land} opacity="0.55" />
        <circle cx="400" cy="214" r="9" fill={sky.landShade} />
        <circle cx="690" cy="222" r="8" fill={sky.landShade} />
      </g>

      {/* ---------------- Nova Grid: the city at the right */}
      <g className="region-city">
        <ellipse cx="826" cy="436" rx="178" ry="40" fill={sky.sand} />
        <path d="M652 436 Q700 404 830 408 Q940 404 1000 430 L1000 452 Q900 470 826 470 Q720 468 652 436 Z" fill={sky.landShade} />
        {TOWERS.map(([x, w, h], i) => (
          <g key={i}>
            <rect x={x} y={420 - h} width={w} height={h} rx="2" fill={i % 3 === 0 ? sky.landShade : sky.land} />
            {Array.from({ length: Math.floor(h / 14) }, (_, r) =>
              Array.from({ length: Math.max(1, Math.floor(w / 9)) }, (_, col) => (
                <rect
                  key={`${r}-${col}`}
                  x={x + 4 + col * 9}
                  y={420 - h + 6 + r * 14}
                  width="4"
                  height="6"
                  rx="1"
                  fill={(r + col + i) % 5 === 0 ? '#5cf2ff' : (r * 3 + col + i) % 7 === 0 ? '#ff4fa3' : '#ffd36b'}
                  opacity={(r + col * 2 + i) % 4 === 0 ? windowGlow * 0.35 : windowGlow}
                />
              )),
            )}
          </g>
        ))}
        {/* the Relay mast that Warden guards */}
        <line x1="839" y1="288" x2="839" y2="250" stroke={sky.landShade} strokeWidth="3" />
        <circle cx="839" cy="248" r="4" fill="#ff4fa3" opacity={0.35 + sky.glow * 0.65} />
      </g>

      {/* ---------------- The Lantern Isles: near, bright, friendly */}
      <g className="region-isles">
        {/* lighthouse rock, where the Keeper lives: out at sea between the Isles and the city */}
        <g transform="translate(470 98)">
        <ellipse cx="96" cy="436" rx="54" ry="16" fill={sky.sand} />
        <path d="M54 436 Q74 410 100 414 Q130 412 142 436 Z" fill={sky.landShade} />
        <path d="M86 418 l4 -74 h14 l4 74 z" fill="#fff8ee" />
        <path d="M87.2 396 h19.6 l-0.9 -14 h-17.8 z M88.6 370 h16.8 l-0.8 -12 h-15.2 z" fill="#ff8a6b" />
        <rect x="86" y="332" width="22" height="14" rx="3" fill="#2a3a5c" />
        <rect x="90" y="334" width="14" height="10" rx="2" fill="#ffd36b" opacity={0.45 + sky.glow * 0.55} />
        <path d="M84 332 h26 l-13 -10 z" fill="#ff8a6b" />
        <path d="M108 339 L300 300 L300 378 Z" fill="url(#beam)" opacity={sky.glow * 0.8} />
        </g>

        {/* island A: the academy gardens */}
        <ellipse cx="214" cy="468" rx="136" ry="40" fill={sky.sand} />
        <path d="M86 466 Q130 426 214 430 Q300 426 346 466 Q290 494 214 496 Q130 494 86 466 Z" fill={sky.land} />
        <circle cx="150" cy="442" r="14" fill={sky.landShade} />
        <circle cx="168" cy="448" r="10" fill={sky.landShade} opacity="0.8" />
        <circle cx="282" cy="446" r="12" fill={sky.landShade} />
        <rect x="236" y="436" width="22" height="16" rx="2" fill="#fff8ee" />
        <path d="M232 437 l15 -11 l15 11 z" fill="#e8916b" />

        {/* island C: Dot's picture shop */}
        <ellipse cx="320" cy="404" rx="82" ry="24" fill={sky.sand} />
        <path d="M246 402 Q280 378 322 380 Q366 378 398 402 Q360 418 320 420 Q276 418 246 402 Z" fill={sky.land} />
        <rect x="336" y="374" width="34" height="22" rx="2" fill="#fff8ee" />
        <path d="M334 374 h38 v-6 h-38 z" fill="#f4a9c5" />
        <path d="M334 374 q4.75 5 9.5 0 q4.75 5 9.5 0 q4.75 5 9.5 0 q4.75 5 9.5 0" fill="#f4a9c5" />

        {/* island B: the harbour post office */}
        <ellipse cx="366" cy="516" rx="72" ry="22" fill={sky.sand} />
        <path d="M300 514 Q330 494 366 496 Q404 494 434 514 Q400 530 366 532 Q330 530 300 514 Z" fill={sky.land} />
        <rect x="378" y="488" width="26" height="18" rx="2" fill="#fff8ee" opacity="0.9" />
        <path d="M376 489 l15 -10 l15 10 z" fill="#6aa7d8" />
        <path d="M430 520 h40" stroke="#8a6a4a" strokeWidth="4" strokeLinecap="round" />

        {/* a small islet for the roadmap harbour */}
        <ellipse cx="456" cy="566" rx="40" ry="11" fill={sky.sand} opacity="0.7" />
        <path d="M422 564 Q440 552 456 553 Q476 552 492 564 Q474 572 456 573 Q438 572 422 564 Z" fill={sky.land} opacity="0.7" />
      </g>

      {/* the route, in chapter order */}
      <path d={routePath()} className="route" fill="none" />

      {CHAPTERS.map((c) => (
        <Lantern key={c.id} c={c} band={band} lit={lit.includes(c.id)} onOpen={onOpen} />
      ))}
    </svg>
  );
}
