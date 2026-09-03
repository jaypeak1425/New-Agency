#!/usr/bin/env python3
"""The G1 gate, end to end: grid -> trial log -> walk-forward -> stress -> verdict.

    python examples/promote.py
    python examples/promote.py --hourly btc_1h.csv --tz UTC --session-close 00:00
    python examples/promote.py --trials trials.json      # persist the trial count

This is the "backtest first, keep the winners, cut the losers" loop with the
discipline attached. Every configuration tried is counted — including the ones
you would rather forget — because the count is an input to the Deflated Sharpe
Ratio and cannot be reconstructed afterwards.

Expect most candidates to fail. That is the process working, not a bug. Budget
for building six sleeves to keep two.

One thing to watch in the grid output: in `structure` stop mode the stop is
pinned to the level, so `atr_mult` does nothing and those rows come out
identical. Redundant axes still count as trials and still raise the Deflated
Sharpe bar the survivor has to clear — so prune a grid to the parameters that
actually vary the strategy, rather than spraying it wide and paying for the
combinations twice.
"""

from __future__ import annotations

import argparse
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from breakout.backtest import expand_grid, run_backtest, walk_forward  # noqa: E402
from breakout.config import Config  # noqa: E402
from breakout.data import MarketData, load_bars_csv  # noqa: E402
from breakout.data.synthetic import SyntheticSpec, make_hourly  # noqa: E402
from core.costs import CostModel, latency_report  # noqa: E402
from core.stats import returns_from_equity  # noqa: E402
from core.trials import TrialLog, g1_gate  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--hourly", help="CSV of 1H bars; omit to use the synthetic fixture")
    ap.add_argument("--tz", default="America/New_York")
    ap.add_argument("--session-close", default="16:00")
    ap.add_argument("--days", type=int, default=1400, help="synthetic fixture length")
    ap.add_argument("--trials", help="JSON path for the trial log (persists the count)")
    ap.add_argument("--bar-seconds", type=int, default=3600)
    args = ap.parse_args()

    if args.hourly:
        data = MarketData.build(load_bars_csv(args.hourly, tz=args.tz),
                                tz=args.tz, session_close=args.session_close)
    else:
        data = MarketData.build(make_hourly(SyntheticSpec(days=args.days)))
    print(f"{len(data.hourly):,} 1H bars / {len(data.daily):,} daily bars  "
          f"{data.hourly[0].ts:%Y-%m-%d} -> {data.hourly[-1].ts:%Y-%m-%d}\n")

    costs = CostModel.tradingview(bar_seconds=args.bar_seconds)
    print(latency_report(costs), "\n")

    base = Config(tz=args.tz, session_close=args.session_close)
    log = TrialLog(path=args.trials, periods_per_year=365 * 24 * (3600 / args.bar_seconds))

    grid = expand_grid(
        stop_mode=["atr", "structure"],
        zone_upper=["breakout_close", "breakout_high"],
        atr_mult=[2.0, 2.5, 3.0],
    )
    print(f"--- grid: {len(grid)} configurations, every one of them counted ---")
    best_label, best_score = None, float("-inf")
    for i, params in enumerate(grid):
        cfg = base.with_(**params)
        result = run_backtest(data, cfg, costs=costs)
        label = "-".join(f"{k}={v}" for k, v in params.items())
        log.record(
            label, params,
            returns_from_equity(result.equity_curve),
            trade_count=result.metrics.trade_count,
        )
        score = result.metrics.expectancy_r * result.metrics.trade_count
        marker = ""
        if score > best_score:
            best_score, best_label, marker = score, label, "  <- best so far"
        print(f"  [{i + 1:>2}/{len(grid)}] {label:<52} "
              f"n={result.metrics.trade_count:>3} exp={result.metrics.expectancy_r:+.3f}R{marker}")

    print(f"\nbest in-sample: {best_label}")
    best_params = log.get(best_label).params

    holdout_start = data.hourly[-1].ts - timedelta(days=180)
    wf = walk_forward(data, base.with_(**best_params), grid=[{}],
                      train_days=365, test_days=120, holdout_start=holdout_start)
    print(f"\nwalk-forward: {len(wf.folds)} folds, pooled OOS n={wf.pooled_metrics.trade_count} "
          f"exp={wf.pooled_metrics.expectancy_r:+.3f}R")

    stressed = run_backtest(
        data, base.with_(**best_params),
        costs=CostModel.tradingview(
            bar_seconds=args.bar_seconds, commission_bps=1.0, half_spread_bps=2.0,
            slippage_bps=2.0, slippage_vol_coef=50.0, latency_seconds=70.0,
        ),
    ).metrics
    print(f"2x cost stress: n={stressed.trade_count} exp={stressed.expectancy_r:+.3f}R\n")

    gate = g1_gate(
        log, best_label,
        walk_forward_expectancy=wf.pooled_metrics.expectancy_r,
        stressed_expectancy=stressed.expectancy_r,
    )
    print(gate.report())
    if args.trials:
        log.save()
        print(f"\ntrial log ({len(log)} configurations) -> {args.trials}")
    return 0 if gate.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
