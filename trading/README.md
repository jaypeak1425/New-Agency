# Daily resistance → 1H breakout → retest entry

A multi-timeframe breakout system that **buys the pullback, not the break**.

1. On the **daily** chart, find unbroken resistance (pivot highs, clustered).
2. On the **1H** chart, wait for a bar that *closes* through one of those levels.
3. At that close, rest limit orders in the zone **between the level and the breakout
   close** — the break is information, but the price at the break is a bad entry.
4. The stop sits below the zone. Two modes; both are first-class and both are backtested.
5. If nothing fills inside the time window, or price closes back under the level first,
   cancel and log it.

Longs are the default. The logic is direction-agnostic throughout, so
`Config(direction=Direction.SHORT)` runs the exact mirror — daily support, 1H
breakdown, retest from below — through the same code.

> Not financial advice. This is a system specification made executable. Nothing here is
> a recommendation to trade, and every backtest number is a hypothesis until it survives
> data you have never looked at.

---

## Quick start

```bash
cd trading
python examples/run_backtest.py                    # synthetic fixture, default config
python examples/run_backtest.py --compare          # both stop modes × both zone bounds
python examples/run_backtest.py --audit            # the lookahead audit
python examples/run_backtest.py --walk-forward     # walk-forward + one holdout run
python examples/run_backtest.py --short            # the mirrored short system
python examples/run_backtest.py --hourly bars.csv --trade-log trades.csv

pip install pytest && python -m pytest             # 126 tests
```

CSV format: `timestamp,open,high,low,close,volume`, one row per **closed** 1H bar,
timestamp = close time. The daily series is derived from it by default, which
guarantees each daily bar is complete at the instant the engine may first see it.

**Stdlib only.** No numpy, no pandas, no broker SDK. The engine is a bar-at-a-time state
machine; vectorising it would mean holding whole arrays in scope, which is how lookahead
gets in. `pytest` is the sole dev dependency.

---

## Layout

```
breakout/
  config.py     every tunable number, validated at construction
  types.py      Bar, Direction, and the sign helpers that make shorts free
  indicators.py streaming ATR / mean / realized vol / percentile rank
  data/         loaders, session handling, the merged causal event stream, synthetic fixture
  levels/       pivot detection, clustering, level lifecycle
  signals/      1H breakout detection, the switchable filters, rolling context
  orders/       zone construction, laddering, stops, sizing, broker-agnostic intents
  engine/       event loop, order state machine, simulated broker (the fill model)
  backtest/     metrics, trade log, post-mortem logs, walk-forward, lookahead audit
tests/          126 tests
examples/       runnable CLI
```

The engine emits **order intents** and never touches a venue. `SimBroker` is one adapter;
a live adapter implements the same `submit(intent)` surface and nothing above it changes.

---

## How lookahead is prevented

Not by convention — structurally.

* Every indicator is **streaming**. It is fed one closed bar at a time and physically
  cannot see a bar it has not been shown.
* Pivots are emitted by an incremental detector on the bar that completes their
  right-hand window, stamped with both the pivot's time and its confirmation time. A
  level is unusable before confirmation because it does not exist yet.
* Daily and 1H bars are merged into **one event stream ordered by close time**. A daily
  bar's timestamp *is* its session close, so "when did this become knowable" and "what is
  its timestamp" are the same question for both timeframes.
* Within a 1H bar the order is fixed: resolve resting orders → manage open positions →
  mark equity → *then* look for a breakout. Scanning last is what guarantees a zone armed
  at the close of bar *t* cannot fill on bar *t*.
* Benchmarks exclude the bar they judge. The volume average is formed from bars strictly
  before the breakout bar; the compression rank is the one measured *before* the break.

And then it is checked. `lookahead_audit` runs the backtest, re-runs it with all data
truncated at each decision point, and compares the **full order-intent stream** — not the
metrics, since two different decision sequences can produce the same P&L by accident.
`test_the_audit_actually_catches_a_planted_leak` plants a level book that has seen the
whole daily series and asserts the audit fails, so the audit cannot pass vacuously.

---

## What the backtest is careful about

* **Bar-close only.** No decision reads an unclosed bar.
* **Limits fill only if the bar trades *through* them.** Touch-exactly is no fill unless
  `optimistic_fills=True`.
* **Same-bar ambiguity resolves pessimistically.** Entry and stop both reachable in one
  bar → assumed filled *then* stopped. Stop and target both reachable → stopped.
* **Stops are stop-markets:** they trigger on touch, fill at the stop price or at the open
  if the bar gapped past it, plus adverse slippage.
* **Market exits execute at the next bar's open**, never at the close that triggered them.
  You cannot trade a close you have only just seen.
* **Commission and slippage are config**, charged on notional and applied adversely.
* Metrics report **trade count first** and print a warning under 100 trades.
  `fill_rate` is over *armed zones*, and the trade log keeps unfilled zones — you cannot
  compute a fill rate from a file containing only the trades that happened.

### The two instrumented populations

Both are computed after the run, from recorded bar indices, and are invisible to the
engine by construction:

* **Every rejected signal** — with the filter that killed it and what price did over the
  next `max_hold_bars`, in ATR units. The filters are hypotheses; `summarise_rejections`
  is how you find out which ones cost more than they save. On the bundled fixture the
  body filter's one rejection went on to fall 8 ATR — it earned its keep that time.
* **Every failed break** — measured from the *fade's* side of the trade, because that
  population is a candidate short system and the question is whether it pays.

---

## Findings worth knowing before you tune this

Three things fell out of building it that the spec does not call out.

**1. The "cancel before any fill" branch is essentially unreachable.**
§4 says to cancel resting orders if a 1H bar closes back under the level *before any
fill*. But a bar cannot close under the level without trading through every resting limit
in the zone on the way down — so by the time that close is judged, the ladder has filled.
"Partially filled" was therefore redefined to **not all legs filled** (some cancelled by
expiry), which is both reachable and what the rule is plainly for. This is asserted
directly in `test_an_invalidating_bar_fills_the_ladder_on_its_way_down`. It is not a
simulation artefact: real resting limits fill on the way past too.

**2. `break_buffer_pct` interacts with "first close through".**
§3 tests the prior bar against *the level*, not the buffered trigger. With a large buffer,
a bar closing inside the buffer band spends the first-close-through condition without
arming anything, and the level then waits for a full round trip below. The spec's reading
is the default; `first_close_reference="trigger"` switches it.

**3. `breakout_high` raises the entries, it does not lower them.**
Measuring the same fractions of depth down from a *higher* top puts every entry higher, so
it fills more often and enters worse. On the bundled fixture, fill rate 95% → 100%. §9
asks for this to be tested before committing to a default; `--compare` runs all four
combinations, and the default stays `breakout_close`.

On the stop modes: `atr` gives constant risk per trade; `structure` gives a stop that
means something, and a gap-improved fill under it simply risks less. They diverge most on
wide zones. Both are supported, both are backtested, neither is privileged.

---

## Parameters

All of §5 at its stated defaults, in one validated `Config`. No magic numbers below it;
`Config.with_(**overrides)` is the only supported way to vary one.

Parameters the spec references in prose but does not tabulate, or that the implementation
needs as guards — each carries a comment in `config.py`:

| Param | Default | Why |
|---|---|---|
| `break_confirm_atr` | 0.25 | §2 names it; no default given |
| `atr_period_daily` | 14 | the level layer needs its own ATR |
| `count_retest_touches`, `touch_tol_atr`, `touch_cooldown_bars` | True, 0.25, 3 | §2 says track touches; a pivot cluster alone rarely reaches `min_touches=2` |
| `vol_lookback`, `compression_lookback` | 20, 20 | the "20-bar" windows in §3 |
| `compression_history_bars` | 1560 | §3's "trailing year" of 1H bars |
| `first_close_reference` | "level" | finding 2 above |
| `min_zone_depth_atr` | 0.05 | a zero-depth zone sizes to infinity |
| `max_arms_per_level` | 1 | §3's "no repeat firing", made explicit |
| `cancel_on_close_back`, `exit_partial_on_invalidation`, `exit_full_on_invalidation` | True, True, False | §4's invalidation rules; the third case is one §4 does not cover |
| `max_open_trades`, `max_armed_zones` | None | concurrency caps; unlimited matches the spec |
| `slippage_bps`, `commission_bps` | 1.0, 0.5 | §7 wants both modelled |
| `initial_equity`, `allow_fractional_qty` | 100000, True | sizing needs a base |

---

## About the synthetic fixture

`breakout/data/synthetic.py` manufactures the *shape* the system trades — a ceiling that
gets touched, a close through it, a pullback — so the engine and tests have something
deterministic to run against. It is a fixture, not a market model.

Its fill rate is unrealistically high because it engineers a pullback after every break,
and its expectancy is negative because nothing was tuned to make it otherwise. **Do not
read either number as evidence about the system.** They say the machinery works.

---

## Where to take it next

* **Regime filter.** §9's suggestion — arm only in compression — belongs at arming, not
  at detection. The hook is `Engine._eligible`.
* **The fade system.** `failed_break_summary` already reports the fade's mean excursions.
  If that population pays, it is the same engine with `direction=SHORT` and a different
  trigger.
* **Live adapter.** Implement `Broker.submit` against a venue. Note the two places the
  simulator is deliberately conservative and a live venue is not: resting limits fill
  intrabar, and market exits go at the next open.
