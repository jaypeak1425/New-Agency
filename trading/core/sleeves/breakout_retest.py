"""Sleeve 5 — breakout-retest, wrapped in the common contract.

The engine underneath is the full implementation in `breakout/`. This adapter
does not reimplement it; it feeds it bars and hands back the order intents it
emitted, so there is exactly one copy of the trading logic and the Pine script
has exactly one thing to be reconciled against.

Regimes: arms in compression (5, 6) and fires into the trends that follow
(1, 2). That split is why `arming_regimes` exists separately — the sleeve wants
a quiet market to place the order and a moving one to profit from it, and
collapsing those into a single eligibility set loses the distinction.
"""

from __future__ import annotations

from breakout.config import Config
from breakout.data.loaders import MarketData
from breakout.engine.loop import Engine
from breakout.orders.intents import OrderIntent

from .base import MarketContext, SleeveBase, register


class BreakoutRetestSleeve(SleeveBase):
    name = "breakout_retest"
    eligible_regimes = {1, 2, 5, 6}
    arming_regimes = {5, 6}
    eligible_markets = {"crypto", "futures", "equities"}
    # 15m is the floor a TradingView webhook can carry; see core/costs.py, where
    # the latency term stops being tolerable somewhere below it.
    min_timeframe = "15m"
    tier = 2
    description = "Daily resistance -> intraday close through -> limit entries in the retest zone"

    def __init__(self, cfg: Config | None = None, costs=None) -> None:
        self.cfg = cfg or Config()
        self.engine = Engine(self.cfg, costs=costs)

    # ---------------------------------------------------------------- feed
    def prime(self, data: MarketData) -> None:
        """Warm the level book and indicators without arming anything.

        A cold sleeve cannot trade for the length of its longest lookback, and
        that dead period is easy to mistake for 'the strategy found nothing'.
        """
        for kind, bar in data.events():
            if kind == "daily":
                self.engine.book.on_daily_bar(bar)

    def on_daily_bar(self, bar) -> None:
        self.engine.book.on_daily_bar(bar)

    # ------------------------------------------------------------ contract
    def signals(self, ctx: MarketContext) -> list[OrderIntent]:
        """Advance the engine by one closed bar and return what it decided."""
        if not self.eligible(ctx):
            return []
        before = len(self.engine.broker.intents)
        self.engine.on_hourly_bar(ctx.bar)
        return list(self.engine.broker.intents[before:])

    def manage(self, ctx: MarketContext, position: object = None) -> list[OrderIntent]:
        """No-op by design.

        The engine manages trails, invalidation and time stops inside the same
        bar step as `signals`, so splitting them here would mean advancing the
        clock twice per bar. Kept to satisfy the contract, and kept honest
        about why it does nothing.
        """
        return []

    def risk_units(self, ctx: MarketContext) -> float:
        open_risk = sum(
            leg.risk_at_fill
            for trade in self.engine.trades
            for leg in trade.open_legs
        )
        return open_risk / ctx.equity if ctx.equity > 0 else 0.0

    # ------------------------------------------------------------- extras
    def arming_weight(self, posterior: dict[int, float]) -> float:
        """Posterior mass in the compression states the zone wants to arm in."""
        if not posterior:
            return 1.0
        return sum(p for state, p in posterior.items() if state in self.arming_regimes)

    @property
    def trades(self):
        return self.engine.trades


register(BreakoutRetestSleeve())
