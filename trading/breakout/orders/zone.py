"""Retest zone construction.

The zone is the span between the level that was just broken and the price at
which the break was confirmed. The premise of the whole system lives here: the
close beyond the level is information, but it is a bad price; the span
underneath it is a better one.

Bounds are named ``far``/``near`` rather than upper/lower so the short mirror
is the same arithmetic:

    long   far = breakout close (above)   near = level (below)
    short  far = breakdown close (below)  near = level (above)
"""

from __future__ import annotations

from dataclasses import dataclass

from ..config import Config
from ..signals.breakout import BreakoutSignal
from ..types import Direction


@dataclass(frozen=True)
class Zone:
    level_id: int
    direction: Direction
    far_bound: float      # the breakout price — the bad entry
    near_bound: float     # the level itself — the reference for being wrong
    entries: tuple[float, ...]
    atr: float

    @property
    def depth(self) -> float:
        return abs(self.far_bound - self.near_bound)

    @property
    def upper(self) -> float:
        return max(self.far_bound, self.near_bound)

    @property
    def lower(self) -> float:
        return min(self.far_bound, self.near_bound)

    def contains(self, price: float) -> bool:
        return self.lower <= price <= self.upper


def build_zone(signal: BreakoutSignal, cfg: Config) -> Zone | None:
    """Construct the zone and its entry ladder, or None if the zone is degenerate.

    A zone thinner than ``min_zone_depth_atr`` ATR is not tradeable: the entries
    collapse onto the breakout price and, in ``structure`` stop mode, the risk
    per share is nearly all buffer.
    """
    far = signal.breakout_close if cfg.zone_upper == "breakout_close" else signal.breakout_high
    near = signal.level_price
    depth = abs(far - near)
    if signal.atr <= 0 or depth < cfg.min_zone_depth_atr * signal.atr:
        return None

    sign = cfg.direction.sign
    entries = tuple(far - sign * frac * depth for frac in cfg.entry_fractions)
    return Zone(
        level_id=signal.level_id,
        direction=cfg.direction,
        far_bound=far,
        near_bound=near,
        entries=entries,
        atr=signal.atr,
    )
