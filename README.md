# Claude Code Kickoff — Case Atlas

This package bootstraps the build in Claude Code. Drop it into an empty repo and go.

## How to use

1. Create an empty GitHub repo, clone it locally.
2. Copy the contents of this package into the repo root:
   - `CLAUDE.md` → repo root (Claude Code reads this every session)
   - `docs/` → all source specs (already organized)
   - `phase-1-sessions/PHASE-1.md` → the session-by-session prompts for Phase 1
3. Open the repo in Claude Code.
4. Start with **Phase 1, Session 1** (see `phase-1-sessions/PHASE-1.md`). Paste the session block
   as your prompt. Run one session at a time; test at the end of each.
5. In parallel you can run **Session A** (compliance filter) and **Session B** (hard rules) anytime
   — they need nothing from the Brain and slot into Phase 3.

## What's decided (so Claude Code doesn't ask)

Integrated SaaS · Atlas typer is native · Next.js + Supabase + Stripe · deploy Railway ·
$97/mo · AI routed by complexity · names are placeholders (bot = Atlas).

## The one open dependency

**The Brain** — your canonical strategy library. Phases 1, 2, and most of 3's *machinery* build
without it. Phase 3's *content* (real strategy records) needs it. When you have it, add it under
`docs/brain/` and tell Claude Code to ingest it in Phase 3, Session 1.

## Doc reading order

`docs/00-developer-brief.md` → `docs/01-phased-build-plan.md` → then the phase you're on. The full
index and per-phase "what I can build" map is in `docs/BUILD_PLAN_reconciled.md`.
