# Tier 1 — the brain

Python. Data, costs, statistics, risk, sleeves, allocation. Everything that
TradingView structurally cannot do.

```
core/
  feeds/      MoonDev + Hyperliquid adapters, candle parsing, the coverage doctor
  costs.py    commission, spread, vol-scaled slippage, latency, funding
  stats.py    Deflated Sharpe, PBO, the distributions they need
  trials.py   the trial log and the G1 promotion gate
  risk.py     hard limits, drawdown governor, correlation override
  monitor.py  heartbeat, stale-data guard, idempotency, reconciliation
  sleeves/    the Sleeve contract + Sleeve 5 adapter
  portfolio.py  regime gate, allocation formula, vol targeting
```

`breakout/` holds Sleeve 5's engine and the shared primitives (`Bar`,
`Direction`, `MarketData`) that `core` builds on. Tier 2 is `pine/`.

---

## Read this before you plan a backtest

**The Moon Dev data layer keeps ~60 days of history.** Its own docs say so (30
days for the HIP-3 tick DB), and bars are aggregated server-side from stored
ticks, so bar history cannot be deeper than tick retention.

Sixty days is about sixty daily bars. Against what this strategy needs:

| Requirement | Needs | 60-day feed gives |
|---|---|---|
| Confirm one daily pivot (`pivot_lookback=5`) | 11 daily bars | ok |
| A level book worth querying | ~40 daily bars | marginal |
| `max_level_age_days=180` to mean anything | 180 days | **no** |
| One walk-forward fold + holdout | ~570 days | **no** |
| G1's 100-trade minimum | years | **nowhere close** |

So: **MoonDev for live and recent data** — liquidations, funding, order flow,
whale positions, the things it is genuinely good at and nobody else serves.
**Hyperliquid's own `/info` candle archive for backtest history.** Both adapters
are in `feeds/`, both speak the same candle format, both return the same
`MarketData`.

Run the doctor before you trust either:

```bash
export MOONDEV_API_KEY=...          # never paste the key on a command line
python examples/data_doctor.py --source hyperliquid --symbol BTC --days 730
python examples/data_doctor.py --source moondev     --symbol BTC --days 60
```

It fetches, measures coverage, judges it against the strategy's actual
requirements, and then runs the backtest so you see the real sample size instead
of assuming one.

**Second data finding: MoonDev volume is frequently `0`.** OHLC is valid across
the full stored history, but `v` is only populated for ticks collected after
their trade-stream rollout; older bars carry `v = 0` and a valid `n` (number of
price updates). So **leave `require_volume=False` on that feed.** A volume filter
comparing zeros to zeros does not filter — it rejects everything or passes
everything, and both look like a working filter from the outside. The doctor
checks this and says so. `--tick-count-volume` substitutes `n`, which is an
activity proxy and not volume; the parse report keeps saying so.

---

## The latency term

25–50 seconds from a TradingView alert to a broker fill, and the slow part is
TradingView's own dispatcher, not your bridge. You cannot simulate "fill N
seconds later" on bar data, so `costs.py` prices it from the bar's own
volatility:

```
sigma_bar = ATR / (2*sqrt(ln 2))              Parkinson: range -> vol
sigma_lat = sigma_bar * sqrt(t_lat / t_bar)   diffusion: vol scales with sqrt(t)
E|move|   = sigma_lat * sqrt(2/pi)            half-normal expected displacement
```

and charges it **adversely**, which is deliberate: a stop fires *because* price
is moving against you and tends to keep moving for the seconds your order is in
flight. Adverse selection on delayed exits is real, not a coin flip.

What that produces, per aggressive fill, at 35 seconds:

| Bars | Cost | Verdict |
|---|---|---|
| 1h | 0.047 ATR | tolerable — model it, don't assume it away |
| 15m | 0.094 ATR | material |
| 5m | 0.164 ATR | **disqualifying** on a webhook |
| 1m | 0.366 ATR | **disqualifying** |

This is why `BreakoutRetestSleeve.min_timeframe` is `15m` and why a fast
mean-reversion sleeve cannot live on this architecture. It is also why this
particular sleeve survives: its entries are **resting limit orders**, which do
not pay the delay — a late-placed limit is the same limit when price comes back
to it. Only the exits are exposed. `entry_exposure()` and `latency_report()`
report the two separately.

```python
from core.costs import CostModel
from breakout.backtest import run_backtest

run_backtest(data, cfg, costs=CostModel.tradingview(bar_seconds=3600))
run_backtest(data, cfg, costs=CostModel.direct_api())     # Tier 1 execution
```

Passing no cost model reproduces the flat `Config` bps exactly, so nothing that
already worked silently moved.

---

## Why the raw Sharpe of your best configuration is not evidence

Overfitting is not a risk you avoid by being careful — it is a mechanical
consequence of trying configurations. `stats.py` implements the two corrections:

**Deflated Sharpe Ratio.** Asks whether this Sharpe beats the best Sharpe you'd
*expect* from that many trials on pure noise, correcting for sample length,
skew and kurtosis. The test suite makes the point directly: 200 columns of coin
flips produce a winner with an annualized Sharpe above 5 and a Probabilistic
Sharpe of 0.9998 — "certainly positive". Its DSR is 0.76, and the gate holds.

**Probability of Backtest Overfitting**, by combinatorially symmetric
cross-validation. Verified calibrated: ~0.5 on pure noise, 0.0 when one
configuration genuinely wins. Note `PBOResult.is_noisy` — a single PBO from few
trials is itself a noisy estimate, and individual draws on noise range roughly
0.2–0.8.

Both need the trial count, which is why `trials.py` persists to disk:

```python
log = TrialLog(path="trials.json")
log.record("atr-2.5", {"atr_mult": 2.5}, returns, trade_count=140)
log.record("atr-3.0", {"atr_mult": 3.0}, returns2, abandoned=True)   # count it anyway
print(g1_gate(log, "atr-2.5",
              walk_forward_expectancy=..., stressed_expectancy=...).report())
```

Nobody remembers the eleven parameter sets they tried on a Tuesday and threw
away, and every one of them raised the bar the survivor has to clear. A trial log
containing only winners produces a DSR that lies in your favour — asserted in
`test_the_log_counts_abandoned_trials_too`.

---

## Risk, and the order it fires in

`risk.py` checks every limit *before* an order goes out. The limits compound
against *current* equity, so a governor at half size on a shrunken book sizes
smaller than half of the original.

One interaction worth knowing, because it surprised the tests: **a fast drop
trips the daily kill switch before the drawdown governor ever sees it.** An 11%
single-day loss is a −3% kill-switch event (flatten, halt 24h), not a
resize-to-half event. The governor's halving is for a *slow bleed* — several days
of −2% that never breach the daily limit but accumulate past −10%. The two cover
different failure shapes and the fast one wins. Both are tested separately.

The −18% halt has **no automatic exit**. `resume()` is an explicit call, and it
re-anchors the peak so the halt does not instantly re-fire.

`monitor.py` is the operational half: heartbeat, stale-data guard, idempotency
(TradingView fires duplicates — every payload carries a UUID and the receiver
rejects repeats), and reconciliation against the broker's actual positions on a
15-minute timer. Infrastructure failure will cost more than strategy failure in
year one.

---

## What is NOT built

Stated plainly so nothing here is mistaken for more than it is.

- **The regime engine (Phase 2).** No HMM, no feature pipeline, no fitted
  states. `portfolio.RegimeGate` implements the anti-whipsaw layer that will sit
  on top of it — hysteresis at 0.65/0.40, confirmation delay, transition logging
  — and consumes posteriors from outside. With no posterior supplied every
  sleeve weights at 1.0 and the gate is inert, so the stack runs today and gains
  the regime dimension when the model lands. **A missing regime engine must never
  silently switch every sleeve off**; that is asserted in the tests.
- **Sleeves 1, 2, 3, 4, 6, 7, 8.** Only Sleeve 5 exists. Sleeve 7 (carry) is the
  highest-Sharpe, lowest-correlation addition and works when nothing else does —
  it is the one to build next, and it is Tier 1 only.
- **Execution adapters.** The engine emits `OrderIntent`s and `SimBroker` is the
  only adapter. A live adapter implements the same `submit(intent)` surface.
- **The webhook receiver.** `IdempotencyGuard` and `Reconciliation` are the
  pieces it needs; the HTTP service around them is not written.

Per the spec's own build order: expect Phases 1–3 to take longer than 4–6
combined. That is correct, not a problem.

---

*Not financial advice. Every backtest number here is a hypothesis until it
survives data you have never looked at.*
