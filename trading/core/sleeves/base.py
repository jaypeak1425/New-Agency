"""The sleeve contract.

Every strategy implements the same interface so the portfolio layer can treat
them uniformly — that uniformity is the whole point of the multi-sleeve
architecture. Diversification across *uncorrelated sleeves* is the only free
lunch on offer here, and you cannot allocate across things that do not share a
shape.

A sleeve declares what it needs and what it is for; it does not decide how much
capital it gets. That is the portfolio layer's call, and keeping the decision
out of the sleeve is what stops six strategies each quietly sizing themselves
to the full book.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol, runtime_checkable

from breakout.orders.intents import OrderIntent
from breakout.types import Bar

# Timeframes in seconds, for the latency and eligibility checks.
TIMEFRAME_SECONDS = {
    "1m": 60, "3m": 180, "5m": 300, "15m": 900, "30m": 1800,
    "1h": 3600, "2h": 7200, "4h": 14400, "8h": 28800, "12h": 43200,
    "1d": 86400,
}

MARKETS = ("crypto", "futures", "equities")


@dataclass
class MarketContext:
    """What a sleeve is shown on each closed bar.

    Deliberately narrow. A sleeve that needs something not in here is telling
    you it belongs in Tier 1, or that the context needs a considered addition
    rather than a reach into global state.
    """

    symbol: str
    asset_class: str
    timeframe: str
    bar: Bar
    equity: float
    # Regime posteriors, not a hard label: sleeve weight scales continuously with
    # P(regime) so transitions do not whipsaw the book. Empty until the regime
    # engine exists, which every sleeve here must tolerate.
    regime_posterior: dict[int, float] = field(default_factory=dict)
    size_multiplier: float = 1.0        # handed down by the risk governor
    extras: dict = field(default_factory=dict)

    @property
    def ts(self) -> datetime:
        return self.bar.ts

    @property
    def bar_seconds(self) -> int:
        return TIMEFRAME_SECONDS.get(self.timeframe, 3600)


@runtime_checkable
class Sleeve(Protocol):
    name: str
    eligible_regimes: set[int]
    eligible_markets: set[str]
    min_timeframe: str

    def signals(self, ctx: MarketContext) -> list[OrderIntent]:
        """New intents from this bar's close."""

    def manage(self, ctx: MarketContext, position: object) -> list[OrderIntent]:
        """In-trade adjustment: trails, scale-outs, invalidation."""

    def risk_units(self, ctx: MarketContext) -> float:
        """Open risk as a fraction of equity, for portfolio sizing."""


class SleeveBase:
    """Shared eligibility logic. Sleeves may inherit it or reimplement it."""

    name: str = "unnamed"
    eligible_regimes: set[int] = set()
    eligible_markets: set[str] = set(MARKETS)
    min_timeframe: str = "1h"
    tier: int = 2                    # 2 = Pine-eligible, 1 = Python only
    description: str = ""

    def timeframe_ok(self, timeframe: str) -> bool:
        want = TIMEFRAME_SECONDS.get(self.min_timeframe)
        have = TIMEFRAME_SECONDS.get(timeframe)
        return want is not None and have is not None and have >= want

    def market_ok(self, asset_class: str) -> bool:
        return asset_class in self.eligible_markets

    def regime_weight(self, posterior: dict[int, float]) -> float:
        """Total posterior mass sitting in this sleeve's regimes.

        No posterior at all means 1.0, not 0.0: an unbuilt regime engine must
        not silently switch every sleeve off, and a silently-flat system is the
        hardest kind of bug to notice.
        """
        if not posterior:
            return 1.0
        if not self.eligible_regimes:
            return 1.0
        return sum(p for state, p in posterior.items() if state in self.eligible_regimes)

    def eligible(self, ctx: MarketContext) -> bool:
        return self.timeframe_ok(ctx.timeframe) and self.market_ok(ctx.asset_class)

    def why_ineligible(self, ctx: MarketContext) -> str | None:
        if not self.market_ok(ctx.asset_class):
            return f"{self.name}: {ctx.asset_class} not in {sorted(self.eligible_markets)}"
        if not self.timeframe_ok(ctx.timeframe):
            return f"{self.name}: {ctx.timeframe} is faster than the {self.min_timeframe} minimum"
        return None


_REGISTRY: dict[str, SleeveBase] = {}


def register(sleeve: SleeveBase) -> SleeveBase:
    if sleeve.name in _REGISTRY:
        raise ValueError(f"a sleeve named {sleeve.name!r} is already registered")
    _REGISTRY[sleeve.name] = sleeve
    return sleeve


def registry() -> dict[str, SleeveBase]:
    return dict(_REGISTRY)


def clear_registry() -> None:
    _REGISTRY.clear()
