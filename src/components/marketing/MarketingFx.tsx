"use client";

import { useEffect, useRef } from "react";

// Ambient motion engine for the marketing page, mounted once:
//  - gold scroll-progress beam
//  - scroll-reveal for [data-reveal] / [data-stagger]
//  - count-up for [data-count] numbers
//  - hero word-cascade trigger (adds .on to #mkt-hero after mount)
// All DOM-class based (no React state), fully disabled under
// prefers-reduced-motion, removed on unmount.
export function MarketingFx() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // hero cascade
    const hero = document.getElementById("mkt-hero");
    let heroTimer: ReturnType<typeof setTimeout> | undefined;
    if (hero) {
      if (reduce) hero.classList.add("on");
      else heroTimer = setTimeout(() => hero.classList.add("on"), 160);
    }

    // scroll progress
    const bar = barRef.current;
    const onScroll = () => {
      if (!bar) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${h > 0 ? (window.scrollY / h) * 100 : 0}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // reveals
    const revealEls = document.querySelectorAll("[data-reveal],[data-stagger]");
    let io: IntersectionObserver | undefined;
    if (reduce) {
      revealEls.forEach((el) => el.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      revealEls.forEach((el) => io?.observe(el));
    }

    // counters
    const counters = document.querySelectorAll<HTMLElement>("[data-count]");
    let cio: IntersectionObserver | undefined;
    if (reduce) {
      counters.forEach((n) => (n.textContent = n.dataset.count ?? "0"));
    } else {
      cio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            cio?.unobserve(e.target);
            const n = e.target as HTMLElement;
            const end = Number(n.dataset.count ?? "0");
            const t0 = performance.now();
            const run = (ts: number) => {
              const k = Math.min((ts - t0) / 1400, 1);
              n.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
              if (k < 1) requestAnimationFrame(run);
            };
            requestAnimationFrame(run);
          });
        },
        { threshold: 0.4 },
      );
      counters.forEach((n) => cio?.observe(n));
    }

    return () => {
      if (heroTimer) clearTimeout(heroTimer);
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
      cio?.disconnect();
    };
  }, []);

  return <div ref={barRef} className="mkt-progress" aria-hidden="true" />;
}
