"""Sleeve 7 — carry / funding-rate basis. Tier 1 only.

Long spot, short perpetual, equal notional. Net delta about zero, and you
collect funding for as long as leveraged longs are paying to be long. This is
the sleeve that most directly answers "make money regardless of direction",
because it does not need a direction at all — which is also why it is the
highest-Sharpe, lowest-correlation thing to add next to a directional book.

It cannot live in Pine. One Pine strategy holds one position in one instrument;
this needs two legs on two venues plus funding data Pine has no access to.

-------------------------------------------------------------------------------
THE ECONOMICS, WRITTEN OUT, BECAUSE THE SIGNS ARE EASY TO GET BACKWARDS
-------------------------------------------------------------------------------
Enter: long 1 unit spot at S0, short 1 unit perp at P0. Basis b = (P - S) / S.

    price PnL = (S1 - S0) + (P0 - P1) = -(b1 - b0) * S = (b0 - b1) * notional

So the price leg pays you when the **basis narrows**. Entering rich and exiting
flat is a gain; entering flat and exiting rich is a loss. Delta cancels, basis
does not.

    funding PnL = sum over intervals of rate_t * notional

Positive rate means longs pay shorts, and you are the short. That is the yield.

Two things this makes visible, and both matter:

* **Attribution.** If the P&L came from the basis rather than from funding, you
  did not run a carry trade — you ran a basis bet that happened to be flat. The
  backtest reports the split for exactly this reason.
* **The real risk is not directional.** The combined position is delta-neutral,
  but the short perp leg has its own margin account and can be liquidated on a
  spot spike while the overall position is perfectly hedged. Size that leg's
  margin for a 3-sigma adverse move, not a 1-sigma one.

Research on crypto funding arbitrage has found forced exits in the large
majority of opportunities studied. The spread has to be wide *and* persistent
enough to survive costs before it reverts, so `min_carry_over_cost` is a gate
rather than a suggestion: funding that barely clears fees is not an edge.

-------------------------------------------------------------------------------
WHY THE EXIT IS SMOOTHED
-------------------------------------------------------------------------------
Hourly funding flips negative for single intervals constantly — on the bundled
fixture, 44% of intervals are negative while the mean is comfortably positive.
Exiting on each negative print churns the position and pays the full two-leg
round trip every time. That single decision is the difference between a sleeve
that collects its yield and one that hands the yield to the exchange: the
fixture goes from 165 trades and a net loss to a fraction of that with the same
funding collected. `smoothing_intervals` judges the signal on a trailing mean,
which is what you would actually do and what the venue's own 8-hour convention
approximates.

Entry and exit use the *same* smoothed signal, deliberately. An earlier version
smoothed only the exit, and it churned worse the more it smoothed: entry fired
on an instantaneous spike the lagging mean had not registered, so the position
opened and closed on consecutive intervals. Mismatched entry and exit signals
fight each other, and the cost of the fight is a full round trip each time.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Sequence

from breakout.orders.intents import IntentKind, OrderIntent
from breakout.types import Bar, Direction

from ..feeds.funding import HOURLY, FundingPoint, FundingSnapshot
from .base import MarketContext, SleeveBase, register


@dataclass(frozen=True)
class CarryConfig:
    intervals_per_year: float = HOURLY     # Hyperliquid pays hourly. Check your venue.
    min_carry: float = 0.10                # annualized, to open
    exit_carry: float = 0.02               # annualized, to close
    min_carry_over_cost: float = 3.0       # carry must beat round-trip cost by this
    smoothing_intervals: int = 8           # judge entry AND exit on a mean, not one print
    zscore_lookback: int = 168             # one week of hourly funding
    min_zscore: float = 0.0                # richness relative to the symbol's own history
    max_hold_intervals: int = 24 * 30
    notional: float = 10_000.0             # per leg
    entry_cost_bps: float = 5.0            # per leg
    exit_cost_bps: float = 5.0             # per leg
    margin_multiple: float = 3.0           # sigmas of adverse move the short leg must survive
    min_margin_fraction: float = 0.02      # floor, so the margin check is never silently off
    liquidation_cost_bps: float = 50.0     # penalty when the short leg is taken out

    @property
    def round_trip_cost_fraction(self) -> float:
        """Two legs, two sides each."""
        return 2.0 * (self.entry_cost_bps + self.exit_cost_bps) / 10_000.0


@dataclass
class CarryTrade:
    symbol: str
    entry_ts: datetime
    entry_index: int
    entry_premium: float
    entry_carry: float              # annualized, at entry
    notional: float
    exit_ts: datetime | None = None
    exit_index: int | None = None
    exit_premium: float | None = None
    exit_reason: str = ""
    funding_pnl: float = 0.0
    intervals: int = 0
    liquidated: bool = False
    costs: float = 0.0

    @property
    def basis_pnl(self) -> float:
        """Narrowing basis pays; widening costs."""
        if self.exit_premium is None:
            return 0.0
        return (self.entry_premium - self.exit_premium) * self.notional

    @property
    def net_pnl(self) -> float:
        return self.funding_pnl + self.basis_pnl - self.costs

    @property
    def realized_carry(self) -> float:
        """Annualized return on one leg's notional, over the actual hold."""
        if self.intervals <= 0 or self.notional <= 0:
            return 0.0
        per_interval = self.net_pnl / self.notional / self.intervals
        return per_interval * HOURLY if self.intervals else 0.0


@dataclass
class CarryResult:
    trades: list[CarryTrade] = field(default_factory=list)
    config: CarryConfig | None = None
    observations: int = 0

    @property
    def closed(self) -> list[CarryTrade]:
        return [t for t in self.trades if t.exit_index is not None]

    @property
    def net_pnl(self) -> float:
        return sum(t.net_pnl for t in self.closed)

    @property
    def funding_pnl(self) -> float:
        return sum(t.funding_pnl for t in self.closed)

    @property
    def basis_pnl(self) -> float:
        return sum(t.basis_pnl for t in self.closed)

    @property
    def costs(self) -> float:
        return sum(t.costs for t in self.closed)

    @property
    def liquidations(self) -> int:
        return sum(1 for t in self.closed if t.liquidated)

    @property
    def funding_share(self) -> float:
        """Share of gross P&L that came from funding rather than the basis.

        Near 1.0 is a carry trade. Near 0 — or negative — is a basis bet that
        has been calling itself one.
        """
        gross = abs(self.funding_pnl) + abs(self.basis_pnl)
        return 0.0 if gross <= 0 else self.funding_pnl / gross

    def report(self, title: str = "carry") -> str:
        closed = self.closed
        wins = [t for t in closed if t.net_pnl > 0]
        holds = [t.intervals for t in closed] or [0]
        lines = [
            f"--- {title} ---",
            f"trades               {len(closed)}      <- read this first",
            f"observations         {self.observations:,} funding intervals",
            f"net                  {self.net_pnl:+,.2f}",
            f"  from funding       {self.funding_pnl:+,.2f}",
            f"  from basis         {self.basis_pnl:+,.2f}",
            f"  costs              {self.costs:-,.2f}",
            f"funding share        {self.funding_share:.1%} of gross",
            f"win rate             {len(wins) / len(closed):.1%}" if closed else "win rate             n/a",
            f"avg hold             {sum(holds) / len(holds):.1f} intervals",
            f"liquidations         {self.liquidations}",
        ]
        if closed and self.funding_share < 0.5:
            lines.append(
                "NOTE: most of the P&L came from the basis, not from funding. That is a "
                "basis bet wearing a carry trade's clothes — size it as the directional "
                "position it actually is."
            )
        if len(closed) < 30:
            lines.append(f"NOTE: {len(closed)} trades is a small sample. Hypothesis, not measurement.")
        return "\n".join(lines)


# ------------------------------------------------------------------ screen
def screen(
    snapshot: FundingSnapshot,
    cfg: CarryConfig | None = None,
    top: int = 20,
) -> list[tuple[str, float]]:
    """Cross-sectional screen: which symbols pay enough to be worth the legs.

    This is what the Moon Dev feed is genuinely best at — 224 symbols of live
    funding with no rate limit, which is a screen you cannot build from candles.
    """
    cfg = cfg or CarryConfig()
    hurdle = max(cfg.min_carry, cfg.min_carry_over_cost * cfg.round_trip_cost_fraction)
    return [(sym, ann) for sym, ann in snapshot.ranked(top=len(snapshot.rates)) if ann >= hurdle][:top]


def rolling_zscore(rates: Sequence[float], lookback: int) -> float | None:
    """How rich is the latest funding against this symbol's own recent history."""
    if len(rates) < max(lookback // 4, 8):
        return None
    window = list(rates[-lookback:])
    if len(window) < 2:
        return None
    mean = sum(window) / len(window)
    var = sum((r - mean) ** 2 for r in window) / (len(window) - 1)
    sd = math.sqrt(var)
    scale = max(abs(mean), max((abs(r) for r in window), default=0.0))
    if sd <= 1e-12 * max(scale, 1e-300):
        return 0.0
    return (window[-1] - mean) / sd


# ---------------------------------------------------------------- backtest
def backtest_carry(
    funding: Sequence[FundingPoint],
    cfg: CarryConfig | None = None,
    prices: Sequence[Bar] | None = None,
) -> CarryResult:
    """Walk a funding series, holding the carry while it pays.

    Decisions use only funding observed up to and including the current
    interval — the same bar-close discipline as the directional engine, for the
    same reason.

    ``prices`` is optional. Supplied, the short leg's margin is checked against
    the realised adverse move and liquidations are simulated. Omitted, the
    margin is still *sized*, but liquidation cannot be simulated and the result
    is therefore optimistic — which the report says out loud rather than
    leaving you to infer.
    """
    cfg = cfg or CarryConfig()
    result = CarryResult(config=cfg, observations=len(funding))
    if not funding:
        return result

    by_ts = {b.ts: b for b in (prices or [])}
    hurdle = max(cfg.min_carry, cfg.min_carry_over_cost * cfg.round_trip_cost_fraction)
    leg_entry_cost = cfg.notional * cfg.entry_cost_bps / 10_000.0
    leg_exit_cost = cfg.notional * cfg.exit_cost_bps / 10_000.0

    rates: list[float] = []
    open_trade: CarryTrade | None = None
    entry_price: float | None = None
    margin_fraction = 0.0

    for i, point in enumerate(funding):
        rates.append(point.rate)
        annualized = point.annualized(cfg.intervals_per_year)

        if open_trade is not None:
            # Funding accrues on the interval just observed.
            open_trade.funding_pnl += point.rate * open_trade.notional
            open_trade.intervals += 1

            smoothed_annualized = _smoothed_annualized(rates, cfg)
            smoothed = smoothed_annualized / cfg.intervals_per_year

            reason = ""
            if smoothed < 0:
                reason = "funding_flipped_negative"
            elif smoothed_annualized < cfg.exit_carry:
                reason = "carry_decayed"
            elif open_trade.intervals >= cfg.max_hold_intervals:
                reason = "max_hold"

            # The short perp leg has its own margin account and can be taken out
            # by a spot spike even though the combined position is hedged.
            bar = by_ts.get(point.ts)
            if bar is not None and entry_price:
                adverse = (bar.high - entry_price) / entry_price
                if adverse >= margin_fraction:
                    open_trade.liquidated = True
                    open_trade.costs += cfg.notional * cfg.liquidation_cost_bps / 10_000.0
                    reason = "short_leg_liquidated"

            if reason:
                open_trade.exit_ts = point.ts
                open_trade.exit_index = i
                open_trade.exit_premium = point.premium
                open_trade.exit_reason = reason
                open_trade.costs += 2 * leg_exit_cost
                open_trade = None
                entry_price = None
            continue

        # Entry uses the SAME smoothed signal as the exit. Judging entry on the
        # instantaneous rate while judging exit on a trailing mean makes the two
        # rules fight: you enter on a spike the lagging mean has not seen yet,
        # and exit on the next interval. Measured, that mismatch tripled the
        # trade count as the smoothing window grew.
        if _smoothed_annualized(rates, cfg) < hurdle:
            continue
        z = rolling_zscore(rates, cfg.zscore_lookback)
        if z is not None and z < cfg.min_zscore:
            continue

        open_trade = CarryTrade(
            symbol=point.symbol,
            entry_ts=point.ts,
            entry_index=i,
            entry_premium=point.premium,
            entry_carry=annualized,
            notional=cfg.notional,
            costs=2 * leg_entry_cost,
        )
        result.trades.append(open_trade)

        bar = by_ts.get(point.ts)
        if bar is not None:
            entry_price = bar.close
            margin_fraction = _margin_fraction(prices or [], point.ts, cfg)

    # A position still open when the data ends must be marked out. Left open, its
    # accrued funding and its costs vanish from every metric, and the sleeve
    # reports a P&L for trades it never finished.
    if open_trade is not None:
        last = funding[-1]
        open_trade.exit_ts = last.ts
        open_trade.exit_index = len(funding) - 1
        open_trade.exit_premium = last.premium
        open_trade.exit_reason = "end_of_data"
        open_trade.costs += 2 * leg_exit_cost

    return result


def _smoothed_annualized(rates: Sequence[float], cfg: CarryConfig) -> float:
    """Trailing-mean funding, annualized. One signal for both entry and exit."""
    window = list(rates[-max(cfg.smoothing_intervals, 1):])
    if not window:
        return 0.0
    return (sum(window) / len(window)) * cfg.intervals_per_year


def _margin_fraction(prices: Sequence[Bar], ts: datetime, cfg: CarryConfig) -> float:
    """Margin the short leg needs to survive a `margin_multiple`-sigma move.

    Estimated from trailing realised volatility. Sizing the short leg for a
    1-sigma move is how a delta-neutral book gets liquidated on a green day.
    """
    window = [b for b in prices if b.ts <= ts][-168:]
    if len(window) < 20:
        # Too little history to estimate. Fall back to the floor rather than
        # zero: a zero margin fraction switches the liquidation check off
        # silently, and "no liquidations" would then mean "never looked".
        return cfg.min_margin_fraction
    rets = [
        math.log(b.close / a.close)
        for a, b in zip(window, window[1:])
        if a.close > 0 and b.close > 0
    ]
    if len(rets) < 2:
        return cfg.min_margin_fraction
    mean = sum(rets) / len(rets)
    sd = math.sqrt(sum((r - mean) ** 2 for r in rets) / (len(rets) - 1))
    estimated = cfg.margin_multiple * sd * math.sqrt(24.0)     # one day of exposure
    # Floor it. A quiet stretch measures near-zero vol, and a zero margin
    # fraction would silently switch the liquidation check off entirely — the
    # failure mode being modelled is precisely a spike out of a quiet stretch.
    return max(estimated, cfg.min_margin_fraction)


# ------------------------------------------------------------------ sleeve
class CarrySleeve(SleeveBase):
    name = "carry"
    eligible_regimes = {1, 2, 3, 4, 5, 6}     # regime-agnostic; richest in 1 and 2
    eligible_markets = {"crypto"}
    min_timeframe = "1h"
    tier = 1                                   # two legs, two venues: Python only
    description = "Long spot, short perp, collect funding. Delta-neutral, not risk-neutral."

    def __init__(self, cfg: CarryConfig | None = None) -> None:
        self.cfg = cfg or CarryConfig()
        self.open_symbols: dict[str, CarryTrade] = {}
        self._next_id = 1

    def signals(self, ctx: MarketContext) -> list[OrderIntent]:
        """Two legs per entry: long spot, short perp, equal notional."""
        if not self.eligible(ctx):
            return []
        snapshot = ctx.extras.get("funding_snapshot")
        if not isinstance(snapshot, FundingSnapshot):
            return []

        intents: list[OrderIntent] = []
        for symbol, annualized in screen(snapshot, self.cfg):
            if symbol in self.open_symbols:
                continue
            price = snapshot.prices.get(symbol)
            if not price or price <= 0:
                continue
            qty = self.cfg.notional / price
            trade_id = self._next_id
            self._next_id += 1
            self.open_symbols[symbol] = CarryTrade(
                symbol=symbol, entry_ts=ctx.ts, entry_index=0, entry_premium=0.0,
                entry_carry=annualized, notional=self.cfg.notional,
            )
            for leg, direction in ((0, Direction.LONG), (1, Direction.SHORT)):
                intents.append(
                    OrderIntent(
                        kind=IntentKind.PLACE_LIMIT, ts=ctx.ts, trade_id=trade_id,
                        leg_index=leg, direction=direction, price=price, qty=qty,
                        reason=f"carry {symbol} {'spot' if leg == 0 else 'perp'} "
                               f"@{annualized:.1%} annualized",
                    )
                )
        return intents

    def manage(self, ctx: MarketContext, position: object = None) -> list[OrderIntent]:
        return []

    def risk_units(self, ctx: MarketContext) -> float:
        """Delta-neutral, so directional risk units are near zero.

        The exposure that matters is margin on the short leg, not delta — do not
        read a low number here as "this position is safe".
        """
        if ctx.equity <= 0:
            return 0.0
        margin = sum(
            t.notional * self.cfg.margin_multiple * 0.02 for t in self.open_symbols.values()
        )
        return margin / ctx.equity


register(CarrySleeve())
