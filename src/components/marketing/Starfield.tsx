"use client";

import { useEffect, useRef } from "react";

// The Horizon-2039 constellation: drifting gold particles, softly linked,
// gently attracted to the pointer. Pure canvas — no libraries, adaptive
// particle count, devicePixelRatio capped at 2, static single frame under
// prefers-reduced-motion.
export function Starfield({ density = 11000 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const parent = cv.parentElement;
    if (!parent) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;
    let px = -999;
    let py = -999;
    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let P: P[] = [];

    const size = () => {
      const r = parent.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(28, Math.floor((W * H) / density));
      P = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.5,
      }));
    };

    const draw = (animate: boolean) => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        if (animate) {
          p.x += p.vx;
          p.y += p.vy;
          if (px > -500) {
            const dx = px - p.x;
            const dy = py - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 160 && d > 1) {
              p.x += (dx / d) * 0.5;
              p.y += (dy / d) * 0.5;
            }
          }
          if (p.x < 0) p.x = W;
          if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H;
          if (p.y > H) p.y = 0;
        }
        ctx.fillStyle = "rgba(212,175,55,.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
        for (let j = i + 1; j < P.length; j++) {
          const q = P[j];
          const dx2 = p.x - q.x;
          const dy2 = p.y - q.y;
          const dd = dx2 * dx2 + dy2 * dy2;
          if (dd < 12000) {
            ctx.strokeStyle = `rgba(212,175,55,${0.13 * (1 - dd / 12000)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
    };
    const onLeave = () => {
      px = -999;
      py = -999;
    };

    size();
    window.addEventListener("resize", size);

    if (reduce) {
      draw(false);
    } else {
      parent.addEventListener("pointermove", onMove, { passive: true });
      parent.addEventListener("pointerleave", onLeave);
      const frame = () => {
        draw(true);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, [density]);

  return <canvas ref={ref} className="absolute inset-0" aria-hidden="true" />;
}
