"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

// Responsive app chrome: a fixed sidebar on desktop (md+), and on mobile a
// slim top bar with a hamburger that opens a slide-over drawer. The same
// brand / nav / footer nodes are rendered in both the sidebar and the drawer
// so there's one source of truth. The drawer closes on any nav-link click
// (event delegation — avoids a set-state-in-effect on route change) and on
// backdrop click. Everything is print:hidden so the pitch deck prints clean.
export function AppShell({
  brand,
  nav,
  footer,
  children,
}: {
  brand: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const railContents = (
    <>
      <div className="px-2">{brand}</div>
      <div onClick={() => setOpen(false)}>{nav}</div>
      <div className="mt-auto space-y-3 border-t border-cream/10 px-2 pt-4 text-sm">{footer}</div>
    </>
  );

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <nav className="hidden w-60 flex-col gap-6 bg-navy px-4 py-6 md:flex print:hidden">
        {railContents}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between bg-navy px-4 py-3 md:hidden print:hidden">
          <div>{brand}</div>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-cream hover:bg-cream/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <main className="flex-1 bg-cream px-6 py-8 md:px-10 md:py-10 print:bg-white print:p-0">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden print:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <nav
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col gap-6 bg-navy px-4 py-6 shadow-xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="px-2">{brand}</div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-cream hover:bg-cream/10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div onClick={() => setOpen(false)}>{nav}</div>
          <div className="mt-auto space-y-3 border-t border-cream/10 px-2 pt-4 text-sm">{footer}</div>
        </nav>
      </div>
    </div>
  );
}
