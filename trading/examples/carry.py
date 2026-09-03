#!/usr/bin/env python3
"""Sleeve 7 — carry. Screen live funding, and backtest it.

    python examples/carry.py                             # synthetic fixture
    python examples/carry.py --screen                    # live, needs MOONDEV_API_KEY
    python examples/carry.py --symbol BTC --days 365     # real funding history
    python examples/carry.py --symbol ETH --days 365 --with-prices   # + liquidation check
    python examples/carry.py --sweep                     # what smoothing does to churn

The screen is where the Moon Dev feed earns its place: 224 symbols of live
funding with no rate limit is a cross-section you cannot build from candles.
The backtest takes funding history from Hyperliquid, because the Moon Dev
retention window is far too short for it.

Not financial advice. Carry is delta-neutral, not risk-neutral: the short perp
leg has its own margin account and can be liquidated on a spot spike while the
combined position is perfectly hedged.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.feeds import FeedError, HyperliquidFeed, MoonDevFeed  # noqa: E402
from core.feeds.funding import HOURLY  # noqa: E402
from core.feeds.synthetic import FundingSpec, make_funding  # noqa: E402
from core.sleeves.carry import CarryConfig, backtest_carry, screen  # noqa: E402


def run_screen(cfg: CarryConfig, top: int) -> int:
    try:
        snapshot = MoonDevFeed().prices()
    except FeedError as exc:
        print(f"feed error: {exc}", file=sys.stderr)
        return 2
    hurdle = max(cfg.min_carry, cfg.min_carry_over_cost * cfg.round_trip_cost_fraction)
    picked = screen(snapshot, cfg, top=top)
    print(f"--- live funding screen, {len(snapshot.rates)} symbols, "
          f"hurdle {hurdle:.1%} annualized ---")
    if not picked:
        print("nothing clears the hurdle. Being flat is a position.")
    for symbol, annualized in picked:
        oi = snapshot.open_interest.get(symbol, 0.0)
        print(f"  {symbol:<12} {annualized:>8.1%} annualized   OI {oi:>15,.0f}")
    print(f"\nround-trip cost is {cfg.round_trip_cost_fraction:.2%} of notional "
          f"({cfg.min_carry_over_cost:g}x that is the gate)")
    return 0


def sweep(funding, cfg: CarryConfig) -> None:
    print("--- what smoothing does to churn ---")
    print(f"{'smoothing':<14}{'trades':>8}{'net':>12}{'funding':>11}{'costs':>10}{'hold':>8}")
    for n in (1, 4, 8, 24, 72, 168):
        r = backtest_carry(funding, CarryConfig(**{**cfg.__dict__, "smoothing_intervals": n}))
        closed = r.closed
        hold = sum(t.intervals for t in closed) / len(closed) if closed else 0.0
        print(f"{n:>4} intervals {len(closed):>8}{r.net_pnl:>12,.0f}"
              f"{r.funding_pnl:>11,.0f}{r.costs:>10,.0f}{hold:>8.1f}")
    print("\nToo little smoothing churns on single negative prints and pays the round")
    print("trip each time; too much misses the yield. The default is 8 because that is")
    print("the 8-hour convention most venues use, NOT because it won on this fixture —")
    print("picking the fixture's best value is how a parameter gets fitted to noise.\n")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--screen", action="store_true", help="live cross-sectional screen (MoonDev)")
    ap.add_argument("--symbol", help="fetch real funding history for this symbol (Hyperliquid)")
    ap.add_argument("--days", type=int, default=365)
    ap.add_argument("--with-prices", action="store_true",
                    help="also fetch candles so short-leg liquidation can be simulated")
    ap.add_argument("--min-carry", type=float, default=0.10)
    ap.add_argument("--smoothing", type=int, default=8)
    ap.add_argument("--notional", type=float, default=10_000.0)
    ap.add_argument("--sweep", action="store_true")
    ap.add_argument("--top", type=int, default=20)
    args = ap.parse_args()

    cfg = CarryConfig(min_carry=args.min_carry, smoothing_intervals=args.smoothing,
                      notional=args.notional)

    if args.screen:
        return run_screen(cfg, args.top)

    prices = None
    if args.symbol:
        feed = HyperliquidFeed()
        end = datetime.now(timezone.utc)
        try:
            funding = feed.funding_history(args.symbol, end - timedelta(days=args.days), end)
            if args.with_prices:
                bars, _ = feed.candles(args.symbol, "1h", end - timedelta(days=args.days), end)
                prices = bars
        except FeedError as exc:
            print(f"feed error: {exc}", file=sys.stderr)
            return 2
        if not funding:
            print(f"no funding history returned for {args.symbol}", file=sys.stderr)
            return 2
        label = f"{args.symbol} funding, {args.days}d"
    else:
        funding = make_funding(FundingSpec(hours=24 * args.days))
        label = f"synthetic funding, {args.days}d (a fixture, not a market)"

    annualized = [p.annualized(HOURLY) for p in funding]
    print(f"{len(funding):,} hourly funding intervals  "
          f"mean {sum(annualized) / len(annualized):+.1%} annualized, "
          f"{sum(1 for a in annualized if a < 0) / len(annualized):.0%} of intervals negative\n")

    if args.sweep:
        sweep(funding, cfg)

    result = backtest_carry(funding, cfg, prices=prices)
    print(result.report(label))
    if prices is None:
        print("\nNOTE: no price series supplied, so short-leg liquidation was not simulated.")
        print("      Zero liquidations here means 'never looked', not 'never happened'.")
        print("      Re-run with --with-prices.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
