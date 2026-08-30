#!/usr/bin/env python3
"""Run the system end to end.

    python examples/run_backtest.py                      # synthetic fixture
    python examples/run_backtest.py --hourly bars.csv    # your own 1H data
    python examples/run_backtest.py --compare            # both stop modes x both zone bounds
    python examples/run_backtest.py --walk-forward       # walk-forward + untouched holdout
    python examples/run_backtest.py --audit              # lookahead audit

Nothing here is a recommendation to trade. The synthetic fixture in particular
is a shape generator, not a market: its numbers say the machinery works, not
that the system does.
"""

from __future__ import annotations

import argparse
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from breakout.backtest import (  # noqa: E402
    evaluate_holdout,
    expand_grid,
    lookahead_audit,
    run_backtest,
    to_rows,
    walk_forward,
    write_csv,
)
from breakout.config import Config  # noqa: E402
from breakout.data import MarketData, load_bars_csv  # noqa: E402
from breakout.data.synthetic import SyntheticSpec, make_hourly  # noqa: E402
from breakout.types import Direction  # noqa: E402


def load(args) -> MarketData:
    if args.hourly:
        hourly = load_bars_csv(args.hourly, tz=args.tz)
        daily = load_bars_csv(args.daily, tz=args.tz) if args.daily else None
        return MarketData.build(hourly, daily, tz=args.tz, session_close=args.session_close)
    return MarketData.build(make_hourly(SyntheticSpec(days=args.days, seed=args.seed)))


def compare(data: MarketData, base: Config) -> None:
    print("--- §9: the two open decisions, measured rather than assumed ---")
    header = f"{'stop_mode':<12}{'zone_upper':<16}{'armed':>7}{'filled':>8}{'fill%':>8}{'exp(R)':>9}{'PF':>7}"
    print(header)
    for stop_mode in ("atr", "structure"):
        for zone_upper in ("breakout_close", "breakout_high"):
            m = run_backtest(data, base.with_(stop_mode=stop_mode, zone_upper=zone_upper)).metrics
            print(
                f"{stop_mode:<12}{zone_upper:<16}{m.armed_zones:>7}{m.trade_count:>8}"
                f"{m.fill_rate:>7.0%}{m.expectancy_r:>9.3f}{m.profit_factor:>7.2f}"
            )
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hourly", help="CSV of 1H bars (timestamp,open,high,low,close,volume)")
    parser.add_argument("--daily", help="CSV of daily bars; derived from the 1H series if omitted")
    parser.add_argument("--tz", default="America/New_York")
    parser.add_argument("--session-close", default="16:00")
    parser.add_argument("--days", type=int, default=1400, help="synthetic fixture length")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--short", action="store_true", help="run the mirrored short system")
    parser.add_argument("--stop-mode", choices=("atr", "structure"), default="atr")
    parser.add_argument("--zone-upper", choices=("breakout_close", "breakout_high"),
                        default="breakout_close")
    parser.add_argument("--compare", action="store_true")
    parser.add_argument("--walk-forward", action="store_true")
    parser.add_argument("--audit", action="store_true")
    parser.add_argument("--trade-log", help="write the trade log to this CSV")
    args = parser.parse_args()

    data = load(args)
    if not data.hourly:
        print("no bars loaded", file=sys.stderr)
        return 1
    print(
        f"{len(data.hourly)} 1H bars / {len(data.daily)} daily bars  "
        f"{data.hourly[0].ts:%Y-%m-%d} -> {data.hourly[-1].ts:%Y-%m-%d}\n"
    )

    cfg = Config(
        direction=Direction.SHORT if args.short else Direction.LONG,
        stop_mode=args.stop_mode,
        zone_upper=args.zone_upper,
    )

    if args.compare:
        compare(data, cfg)

    result = run_backtest(data, cfg)
    print(result.report())
    print()

    if args.trade_log:
        write_csv(args.trade_log, to_rows(result.trades))
        print(f"trade log -> {args.trade_log} ({len(result.trades)} rows, unfilled zones included)\n")

    if args.audit:
        print(lookahead_audit(data, cfg, limit=25).report(), "\n")

    if args.walk_forward:
        holdout_start = data.hourly[-1].ts - timedelta(days=180)
        wf = walk_forward(
            data,
            cfg,
            grid=expand_grid(stop_mode=["atr", "structure"], atr_mult=[2.0, 2.5, 3.0]),
            train_days=365,
            test_days=120,
            holdout_start=holdout_start,
        )
        print(wf.report(), "\n")
        print("Spending the holdout, once:")
        print(evaluate_holdout(data, cfg, holdout_start).report("holdout"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
