"""Transaction costs, including the one everybody forgets.

Model these or the results are fiction. The pieces:

* **commission** — per side, on notional.
* **half-spread** — you cross it on every aggressive fill. Resting limits earn
  the spread rather than paying it, so it is charged only on aggressive fills.
* **slippage**, scaled by volatility rather than constant. High-vol regimes cost
  more; a flat bps assumption flatters exactly the regimes that hurt most.
* **latency** — 25-50 seconds from a TradingView alert to a broker fill, and the
  slow part is TradingView's own dispatcher, not your bridge.
* **funding / borrow** — per day of holding, which is the whole economics of a
  leveraged perp position.

-------------------------------------------------------------------------------
HOW LATENCY IS PRICED
-------------------------------------------------------------------------------
You cannot simulate "fill N seconds later" on bar data — the bar has no inside.
So it is priced instead, from the bar's own volatility:

    sigma_bar  = ATR / (2*sqrt(ln 2))            Parkinson: range -> volatility
    sigma_lat  = sigma_bar * sqrt(t_lat / t_bar) diffusion: vol scales with sqrt(t)
    E|move|    = sigma_lat * sqrt(2/pi)          half-normal expected |displacement|

and charged **adversely**. That asymmetry is deliberate, and it is not a
random walk assumption being violated by accident: a stop fires *because* price
is moving against you, and it tends to keep moving for the seconds it takes your
order to arrive. Adverse selection on delayed exits is real. Entries are the
opposite case and are treated as such — see `latency_report`.

The practical consequence, which is the point of measuring it: at 1H bars a
30-second delay costs ~0.5% of one ATR and this sleeve barely notices. At 1m
bars the same delay costs ~12% of an ATR on every aggressive fill, which is more
than most mean-reversion edges are worth. That is how a sleeve gets disqualified
before it ever sees money.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from breakout.types import Direction

PARKINSON = 1.0 / (2.0 * math.sqrt(math.log(2.0)))   # range -> sigma, ~0.6006
HALF_NORMAL = math.sqrt(2.0 / math.pi)               # sigma -> E|x|, ~0.7979

# Measured end-to-end alert->fill latency for TradingView-routed orders.
TRADINGVIEW_LATENCY_SECONDS = 35.0


@dataclass(frozen=True)
class CostModel:
    commission_bps: float = 0.5          # per side, on notional
    half_spread_bps: float = 0.0         # crossing cost, aggressive fills only
    slippage_bps: float = 1.0            # base impact, aggressive fills only
    slippage_vol_coef: float = 0.0       # extra bps per 1.0 of (ATR / price)
    latency_seconds: float = 0.0         # signal -> fill, aggressive fills only
    bar_seconds: float = 3600.0          # the execution timeframe
    funding_bps_per_day: float = 0.0     # perp funding on the position
    borrow_bps_per_day: float = 0.0      # short borrow

    @classmethod
    def tradingview(cls, bar_seconds: float = 3600.0, **kwargs) -> "CostModel":
        """Defaults for anything routed through a TradingView alert webhook."""
        params = dict(
            commission_bps=0.5,
            half_spread_bps=1.0,
            slippage_bps=1.0,
            slippage_vol_coef=25.0,
            latency_seconds=TRADINGVIEW_LATENCY_SECONDS,
            bar_seconds=bar_seconds,
        )
        params.update(kwargs)
        return cls(**params)

    @classmethod
    def direct_api(cls, bar_seconds: float = 3600.0, **kwargs) -> "CostModel":
        """Tier 1 execution straight to the venue: latency in the low hundreds
        of milliseconds, which rounds to nothing at these timeframes."""
        params = dict(
            commission_bps=2.5,          # taker fees are the real cost here
            half_spread_bps=0.5,
            slippage_bps=0.5,
            slippage_vol_coef=10.0,
            latency_seconds=0.5,
            bar_seconds=bar_seconds,
        )
        params.update(kwargs)
        return cls(**params)

    # --------------------------------------------------------------- pieces
    def commission(self, price: float, qty: float) -> float:
        return abs(price * qty) * self.commission_bps / 10_000.0

    def latency_move(self, atr: float | None) -> float:
        """Expected adverse price displacement over the latency window."""
        if not atr or atr <= 0 or self.latency_seconds <= 0 or self.bar_seconds <= 0:
            return 0.0
        sigma_bar = atr * PARKINSON
        sigma_lat = sigma_bar * math.sqrt(self.latency_seconds / self.bar_seconds)
        return sigma_lat * HALF_NORMAL

    def spread_and_slippage_bps(self, price: float, atr: float | None) -> float:
        bps = self.half_spread_bps + self.slippage_bps
        if atr and atr > 0 and price > 0 and self.slippage_vol_coef:
            bps += self.slippage_vol_coef * (atr / price)
        return bps

    def holding_cost(self, notional: float, days: float, direction: Direction) -> float:
        """Funding plus borrow, in currency. Always a cost, never a credit — a
        model that pays you to hold is a model you will over-trust."""
        if days <= 0 or notional <= 0:
            return 0.0
        rate = self.funding_bps_per_day
        if direction is Direction.SHORT:
            rate += self.borrow_bps_per_day
        return abs(notional) * (rate / 10_000.0) * days

    # ------------------------------------------------------------ the fill
    def fill_price(
        self,
        quoted: float,
        direction: Direction,
        aggressive: bool,
        atr: float | None = None,
        is_exit: bool = True,
    ) -> float:
        """Adjust a quoted price for everything that makes it not the price.

        ``aggressive=False`` (a resting limit) pays none of this: it does not
        cross the spread, does not pay impact, and a late-placed limit is still
        the same limit when price comes back to it.
        """
        if not aggressive:
            return quoted
        bps = self.spread_and_slippage_bps(quoted, atr)
        adverse = quoted * bps / 10_000.0 + self.latency_move(atr)
        # An adverse move is *down* when you are selling out of a long, and *up*
        # when you are buying back a short.
        sign = direction.sign if is_exit else -direction.sign
        return quoted - sign * adverse


@dataclass(frozen=True)
class LatencyReport:
    latency_seconds: float
    bar_seconds: float
    bar_fraction: float          # share of a bar spent waiting
    cost_in_atr: float           # adverse move per aggressive fill, in ATR units
    verdict: str

    def __str__(self) -> str:
        return (
            f"latency {self.latency_seconds:.0f}s on {self.bar_seconds / 60:.0f}m bars: "
            f"{self.bar_fraction:.2%} of a bar, {self.cost_in_atr:.3f} ATR per aggressive fill\n"
            f"  {self.verdict}"
        )


def latency_report(costs: CostModel) -> LatencyReport:
    """Is this sleeve viable on this execution path?

    Judged against the adverse move per aggressive fill, in ATR units, because
    that is the unit the stop is denominated in: a cost of 0.10 ATR against a
    2.5-ATR stop is 4% of the risk budget per exit, and that is roughly where
    an edge starts dying.
    """
    fraction = costs.latency_seconds / costs.bar_seconds if costs.bar_seconds else 1.0
    cost_atr = costs.latency_move(1.0)          # ATR = 1.0 -> answer is in ATR units

    if cost_atr < 0.02:
        verdict = "negligible — the timeframe absorbs it"
    elif cost_atr < 0.06:
        verdict = "tolerable, but model it; do not assume it away"
    elif cost_atr < 0.15:
        verdict = (
            "material — this eats a real share of the edge. Only run it if the "
            "backtest still clears its gates with this cost applied"
        )
    else:
        verdict = (
            "DISQUALIFYING for a webhook-routed sleeve. Move it to Tier 1 with "
            "direct API access, slow the timeframe down, or drop it"
        )
    return LatencyReport(costs.latency_seconds, costs.bar_seconds, fraction, cost_atr, verdict)


def entry_exposure(costs: CostModel) -> float:
    """Fraction of the next bar during which a newly-placed limit is not yet live.

    This is the *entry* side of latency, and it is a different animal from the
    exit side: a resting limit does not pay the delay, it only risks missing a
    fill that happens inside the first few seconds of the bar. For a retest
    system, whose entries wait bars rather than seconds, this rounds to nothing.
    """
    return min(1.0, costs.latency_seconds / costs.bar_seconds) if costs.bar_seconds else 1.0
