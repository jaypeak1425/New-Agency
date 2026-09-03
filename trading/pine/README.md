# Pine v6 — the execution surface

One file: `breakout_retest.pine`, the Pine-eligible half of Sleeve 5.

TradingView is the cockpit and the trigger. It is not the brain. Everything that
needs more than one instrument, more than one position, or more than 40
`request.security` calls lives in Python. See `../core/README.md`.

## Install

1. TradingView → Pine Editor → paste `breakout_retest.pine` → **Add to chart**.
2. **Put the chart on 1H.** The daily levels are pulled in; the chart timeframe
   is the execution timeframe. On a 5m chart this script will trade a different
   system than the one you backtested.
3. Strategy Tester → Properties. Set commission and slippage to match your venue,
   not the defaults.
4. Alerts require a paid plan, and webhooks only reach ports 80/443.

## The repainting idiom, and why it looks wrong

```pine
request.security(sym, "D", expr[1], lookahead = barmerge.lookahead_on)
```

`lookahead_on` reads like cheating. The `[1]` is what makes it honest: together
they return the **previous completed** daily bar, identically in history and in
realtime.

The alternatives both lie to you:

| Idiom | History | Realtime | Verdict |
|---|---|---|---|
| `lookahead_on` alone | future daily bar | current | lookahead. Never use. |
| `lookahead_off` alone | last completed | *forming* bar | silently repaints |
| `lookahead_on` + `[1]` | last completed | last completed | correct |

Cost: a level becomes usable one daily bar later than strictly necessary.
`ta.pivothigh()` already carries its own `pivotLookback`-bar confirmation lag,
and the `[1]` adds one more on top. That is deliberate — it is the cheap
direction to be wrong in.

The script never branches on `barstate.isrealtime`, never calls `security()` on
the chart timeframe, and leaves `calc_on_every_tick` off, so every decision is
made on a closed bar.

## Where Pine and the Python engine disagree

Reconcile these before you trust either. They are Pine limitations, not bugs.

| | Python engine | Pine strategy |
|---|---|---|
| Concurrent zones | many, on different levels | **one at a time**, nearest eligible level |
| Level book | full lifecycle, retirement, replay of the confirmation window | same rules, one extra daily bar of lag |
| Position | per-leg stops and independent legs | `pyramiding=2`, two entry IDs, per-entry `strategy.exit` |
| Fill model | limit fills only on trade-*through* | TradingView fills a limit on touch |
| Market exits | next bar's open | TradingView's broker emulator, same bar |

That fill-model difference is the one that matters: **TradingView is more
optimistic than the Python engine on every limit fill.** Expect the Pine
backtest to show a higher fill rate and a better average entry. If Pine looks
materially better than Python on the same data and settings, that gap is the
optimism, not an edge.

## Webhook payload

Alerts emit JSON. Point the alert at your bridge and use `{{strategy.order.alert_message}}`
for order events, or the `alert()` payloads for zone lifecycle events.

```json
{"v":1,"event":"zone_armed","id":"BTCUSD-1730390400000","sym":"BTCUSD",
 "level":68250.0,"far":69100.0,"e1":68819.5,"e2":68539.0,"stop":67540.0}
```

Events: `zone_armed`, `entry` (leg 1|2), `exit` (leg 1|2), `failed_break`.

**Idempotency is your problem, not TradingView's.** TradingView can and does
fire the same alert twice. The `id` field is `ticker + bar open time` — unique
per zone per bar. Your receiver must reject a repeat `id` rather than opening a
second position. Build that before you connect real money.

**Latency.** Alert → bridge → broker is 25–50 seconds end to end, and the slow
part is TradingView's dispatcher, not your bridge. This sleeve tolerates it
better than most because the entries are *resting limit orders* — a late-placed
limit still gets filled if price comes back to it, and the retest is what the
system waits for anyway. The exposure is the exits: a stop or invalidation that
routes through the webhook eats the full delay. `core/costs.py` models both
separately, and models them adversely.

## Settings that must match for reconciliation

`pivotLookback`, `clusterTolAtr`, `minTouches`, `breakConfirmAtr`,
`breakBufferPct`, `entryFrac1/2`, `stopMode`, `atrMult`, `structBufferAtr`,
`atrPeriod`, `zoneExpiryBars`, `riskPerTrade`, `maxPositionPct`.

The Python defaults live in `breakout/config.py` and are the source of truth.
The Pine inputs default to the same numbers. If you tune one, tune both, or the
paper-trading gate (G3) compares two different systems.

## What is deliberately not here

Pine cannot do these at all — do not attempt a workaround, run them in Tier 1:

- **Stat arb / pairs (Sleeve 6)** — one Pine strategy cannot long one symbol and
  short another. Architecturally impossible, not merely hard.
- **Carry / funding basis (Sleeve 7)** — two legs, two venues, and funding-rate
  data Pine has no access to.
- **Cross-sectional momentum (Sleeve 8)** — needs simultaneous positions across a
  ranked universe.
- **Portfolio vol targeting** — needs the full covariance matrix across sleeves.
  Compute the scalar in Tier 1 and pass it in as an input if you want Pine to
  respect it.
