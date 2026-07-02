"use client";

import { useEffect, useRef, useState } from "react";

// Ease-out count-up for the money numbers that deserve a moment (dashboard
// KPIs, the book-of-business celebration). Renders the final value on the
// server so SEO/no-JS/reduced-motion all see the real number; the animation
// is purely additive.
export function CountUp({
  value,
  prefix = "$",
  durationMs = 1100,
}: {
  value: number;
  prefix?: string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number>(0);

  useEffect(() => {
    // Initial state already shows the real value (SSR/no-JS/reduced-motion
    // all see the final number) — the animation is purely additive.
    if (value <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, durationMs]);

  return (
    <span>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
}
