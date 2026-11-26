// The sky behind the map. Redrawn only when the age (and so the time of day) changes:
// no idle animation, so the page is calm unless someone moves the dial.
import { useEffect, useRef } from 'react';
import type { SkyStop } from '../lib/age';

// Fixed star field, so stars don't jump between redraws.
const STARS = Array.from({ length: 140 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: r(1), y: r(2) * 0.62, size: 0.5 + r(3) * 1.4, bright: 0.35 + r(4) * 0.65 };
});

export function Sky({ sky }: { sky: SkyStop }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, sky.top);
      g.addColorStop(0.72, sky.horizon);
      g.addColorStop(1, sky.horizon);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Stars fade in from dusk.
      if (sky.stars > 0.01) {
        for (const s of STARS) {
          ctx.globalAlpha = sky.stars * s.bright;
          ctx.fillStyle = '#fffbea';
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // The sun travels an arc across the day; after sunset the moon rises on the other side.
      // Kept over the map side of the hero, so it never sits behind the headline.
      const arc = (p: number) => ({ x: w * (0.44 + 0.5 * p), y: h * (0.5 - Math.sin(Math.PI * p) * 0.36) });
      if (sky.sun <= 1.05) {
        const { x, y } = arc(Math.min(1, sky.sun));
        const r = Math.max(26, Math.min(w, h) * 0.055);
        const warm = sky.sun > 0.8 ? '#ffb27a' : '#ffe08a';
        const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 4);
        halo.addColorStop(0, warm + 'aa');
        halo.addColorStop(1, warm + '00');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = sky.sun > 0.8 ? '#ffc792' : '#fff3c4';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sky.sun > 1) {
        const p = Math.min(1, (sky.sun - 1) / 0.6);
        const { x, y } = arc(0.25 + p * 0.35);
        const r = Math.max(18, Math.min(w, h) * 0.035);
        ctx.globalAlpha = Math.min(1, p * 1.6);
        const halo = ctx.createRadialGradient(x, y, r, x, y, r * 5);
        halo.addColorStop(0, 'rgba(220,232,255,0.28)');
        halo.addColorStop(1, 'rgba(220,232,255,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eef3ff';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = sky.top; // crescent
        ctx.beginPath();
        ctx.arc(x + r * 0.42, y - r * 0.18, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [sky]);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
