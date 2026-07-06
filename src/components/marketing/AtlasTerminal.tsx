"use client";

import { useEffect, useRef, useState } from "react";

// The centerpiece: Atlas designs a case in front of the visitor, on loop.
// Every line mirrors what the real engine does (avatar classification, the
// 9 hard rules, Brain-Locked strategy selection, the compliance filter) —
// stagecraft over real behavior, never invented capability. Styled segments
// are rendered as React nodes (no innerHTML), typing is plain text.
type Seg = { t: string; c?: "gold" | "ok" };
type Line = { cls: "usr" | "atl" | "ok"; segs: Seg[]; delay: number };

const SCRIPT: Line[] = [
  {
    cls: "usr",
    segs: [{ t: '> "I’ve got a guy — two partners, C-corp, $8M revenue, no funded buy-sell."' }],
    delay: 30,
  },
  { cls: "atl", segs: [{ t: "ATLAS ▸ Reading scenario…" }], delay: 16 },
  {
    cls: "atl",
    segs: [{ t: "ATLAS ▸ Avatar: " }, { t: "BUSINESS OWNER", c: "gold" }, { t: " · priority stack confirmed" }],
    delay: 14,
  },
  {
    cls: "atl",
    segs: [{ t: "ATLAS ▸ 9 hard rules checked — " }, { t: "clear", c: "ok" }],
    delay: 14,
  },
  {
    cls: "atl",
    segs: [
      { t: "ATLAS ▸ Strategy: " },
      { t: "Buy-Sell Funding", c: "gold" },
      { t: " (cross-purchase) + " },
      { t: "Key-Person", c: "gold" },
    ],
    delay: 14,
  },
  {
    cls: "atl",
    segs: [{ t: "ATLAS ▸ Compliance filter — " }, { t: "PASS", c: "ok" }],
    delay: 14,
  },
  { cls: "atl", segs: [{ t: "ATLAS ▸ Wholesaler handoff drafted · pitch deck assembled" }], delay: 14 },
  { cls: "ok", segs: [{ t: "✦ Case design ready. Next meeting: a presentation, not a discovery call." }], delay: 20 },
];

const plain = (l: Line) => l.segs.map((s) => s.t).join("");

function LineView({ line, typed }: { line: Line; typed?: number }) {
  if (typed === undefined) {
    return (
      <div className={`mkt-ln mkt-${line.cls}`}>
        {line.segs.map((s, i) => (
          <span key={i} className={s.c ? `mkt-seg-${s.c}` : undefined}>
            {s.t}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={`mkt-ln mkt-${line.cls}`}>
      {plain(line).slice(0, typed)}
      <span className="mkt-caret" aria-hidden="true" />
    </div>
  );
}

export function AtlasTerminal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [doneLines, setDoneLines] = useState(0);
  const [typed, setTyped] = useState(0);

  // Start when scrolled into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            io.disconnect();
            setTimeout(() => setStarted(true), 150);
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Typing engine.
  useEffect(() => {
    if (!started) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(() => setDoneLines(SCRIPT.length), 0);
      return () => clearTimeout(t);
    }
    if (doneLines >= SCRIPT.length) {
      // hold, then loop
      const t = setTimeout(() => {
        setDoneLines(0);
        setTyped(0);
      }, 5200);
      return () => clearTimeout(t);
    }
    const line = SCRIPT[doneLines];
    const full = plain(line).length;
    if (typed < full) {
      const t = setTimeout(() => setTyped(typed + 1), line.delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setDoneLines(doneLines + 1);
      setTyped(0);
    }, 420);
    return () => clearTimeout(t);
  }, [started, doneLines, typed]);

  return (
    <div ref={rootRef} className="mkt-termframe">
      <div className="mkt-terminal">
        <div className="mkt-termbar">
          <i /> <i /> <i />
          <span className="mkt-termtitle">ATLAS · CASE ENGINE</span>
        </div>
        <div className="mkt-termbody" aria-hidden="true">
          {SCRIPT.slice(0, doneLines).map((l, i) => (
            <LineView key={i} line={l} />
          ))}
          {started && doneLines < SCRIPT.length && <LineView line={SCRIPT[doneLines]} typed={typed} />}
        </div>
      </div>
    </div>
  );
}
