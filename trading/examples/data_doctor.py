#!/usr/bin/env python3
"""Can this data source actually backtest the strategy? Run this first.

    export MOONDEV_API_KEY=...            # never paste the key on the CLI
    python examples/data_doctor.py --source hyperliquid --symbol BTC --days 730
    python examples/data_doctor.py --source moondev --symbol BTC --days 60
    python examples/data_doctor.py --source hyperliquid --symbol ETH --save eth_1h.csv

Fetches, measures coverage, judges it against the strategy's requirements, and
then runs the backtest on whatever arrived so you can see the real sample size
rather than assuming one.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from breakout.backtest import run_backtest  # noqa: E402
from breakout.config import Config  # noqa: E402
from core.feeds import FeedError, HyperliquidFeed, MoonDevFeed  # noqa: E402
from core.feeds.doctor import assess  # noqa: E402
from core.feeds.hyperliquid import INTERVAL_MINUTES  # noqa: E402


def save_csv(path: str, bars) -> None:
    with open(path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["timestamp", "open", "high", "low", "close", "volume"])
        for b in bars:
            writer.writerow([b.ts.isoformat(), b.open, b.high, b.low, b.close, b.volume])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=("hyperliquid", "moondev"), default="hyperliquid")
    ap.add_argument("--symbol", default="BTC")
    ap.add_argument("--interval", default="1h")
    ap.add_argument("--days", type=int, default=730)
    ap.add_argument("--market", choices=("crypto", "futures", "equities"), default="crypto")
    ap.add_argument("--session-close", default="00:00", help="00:00 UTC for crypto")
    ap.add_argument("--tick-count-volume", action="store_true",
                    help="MoonDev only: substitute tick count n for volume (a proxy, not volume)")
    ap.add_argument("--save", help="write the intraday bars to this CSV for offline backtesting")
    ap.add_argument("--no-backtest", action="store_true")
    args = ap.parse_args()

    try:
        if args.source == "moondev":
            feed = MoonDevFeed()
            print(f"health: {feed.health()}")
            data, parsed = feed.market_data(
                args.symbol, days=args.days, interval=args.interval,
                volume_from_tick_count=args.tick_count_volume,
                session_close=args.session_close,
            )
        else:
            feed = HyperliquidFeed()
            data, parsed = feed.market_data(
                args.symbol, days=args.days, interval=args.interval,
                session_close=args.session_close,
            )
    except FeedError as exc:
        print(f"feed error: {exc}", file=sys.stderr)
        if exc.body:
            print(f"  body: {exc.body[:400]}", file=sys.stderr)
        return 2

    if not data.hourly:
        print("the feed returned no bars — check the symbol and the interval", file=sys.stderr)
        return 2

    cfg = Config()
    coverage = assess(
        data, cfg,
        source=args.source, symbol=args.symbol, interval=args.interval,
        interval_minutes=INTERVAL_MINUTES.get(args.interval, 60),
        parse_report=parsed, market=args.market,
    )
    print(coverage.report())

    if args.save:
        save_csv(args.save, data.hourly)
        print(f"\nsaved {len(data.hourly):,} bars -> {args.save}")
        print(f"  reuse offline: python examples/run_backtest.py --hourly {args.save} "
              f"--tz UTC --session-close {args.session_close}")

    if not args.no_backtest:
        print()
        result = run_backtest(data, cfg.with_(tz="UTC", session_close=args.session_close))
        print(result.report(f"{args.symbol} {args.interval} via {args.source}"))
        if result.metrics.armed_zones == 0:
            print(
                "\nZero zones armed. Before touching the strategy parameters, check the "
                "coverage verdicts above — on a short series the level book never fills up, "
                "and that is a data problem wearing a strategy problem's clothes."
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
