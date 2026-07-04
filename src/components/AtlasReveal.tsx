"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface RevealStep {
  label: string;
  detail: string;
}

// The "iPhone moment" (Phase 6 Session 1's killer visual): right after the
// intake is completed, Atlas's real pipeline is staged in step by step —
// every line comes from a computation the engine actually ran server-side
// (avatar classification, hard-rule check, library scan) — and then the case
// design itself rises in. Stagecraft over real output, never invented
// content. Plays only when `play` is set (the one-shot ?ready=1 redirect
// after saving the intake); on revisits the content renders instantly.
// Honors prefers-reduced-motion, and a click skips to the end.
export function AtlasReveal({
  play,
  steps,
  children,
}: {
  play: boolean;
  steps: RevealStep[];
  children: React.ReactNode;
}) {
  const [visibleSteps, setVisibleSteps] = useState(play ? 0 : steps.length);
  const [revealed, setRevealed] = useState(!play);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!play || revealed) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepMs = reduced ? 0 : 700;
    const tailMs = reduced ? 0 : 500;

    const scheduled = timers.current;
    for (let i = 1; i <= steps.length; i++) {
      scheduled.push(setTimeout(() => setVisibleSteps(i), i * stepMs));
    }
    scheduled.push(setTimeout(() => setRevealed(true), steps.length * stepMs + tailMs));
    return () => scheduled.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setVisibleSteps(steps.length);
    setRevealed(true);
  };

  return (
    <div>
      {play && (
        <div
          onClick={revealed ? undefined : skip}
          className={cn(
            "mt-6 max-w-2xl rounded-lg bg-navy p-8 shadow-sm transition-opacity duration-500",
            !revealed && "cursor-pointer",
          )}
          title={revealed ? undefined : "Click to skip"}
        >
          <p className="text-xs uppercase tracking-wide text-gold">Atlas</p>
          <ul className="mt-3 space-y-2.5">
            {steps.map((step, i) => (
              <li
                key={step.label}
                className={cn(
                  "flex items-start gap-3 transition-all duration-500",
                  i < visibleSteps ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full",
                    i < visibleSteps ? "bg-gold" : "bg-cream/20",
                  )}
                />
                <span className="text-sm leading-relaxed text-cream/90">
                  <span className="font-medium text-cream">{step.label}</span>
                  <span className="text-cream/70"> — {step.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {!revealed && (
            <p className="mt-4 text-xs text-cream/40" aria-live="polite">
              Working&hellip; click to skip
            </p>
          )}
        </div>
      )}

      <div
        className={cn(
          "transition-all duration-700",
          revealed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
        aria-hidden={!revealed}
      >
        {children}
      </div>
    </div>
  );
}
