"""Stop placement.

Two modes, both first-class:

``atr``        stop a fixed volatility distance from the fill. Risk per trade is
               consistent; what the stop *means* varies with the zone.
``structure``  stop just past the level. Wrong is defined as price re-entering
               the old range, not as a fixed distance. Risk per share varies
               with where in the zone you filled.

They disagree most when the zone is wide, which is exactly when it matters —
so the backtest runs both rather than picking one.
"""

from __future__ import annotations

from ..config import Config
from ..types import Direction, beyond
from .zone import Zone


def stop_price(entry: float, zone: Zone, cfg: Config, atr: float) -> float:
    sign = cfg.direction.sign
    if cfg.stop_mode == "atr":
        return entry - sign * cfg.atr_mult * atr
    if cfg.stop_mode == "structure":
        return zone.near_bound - sign * cfg.structure_buffer_atr * atr
    raise ValueError(f"unknown stop_mode: {cfg.stop_mode}")  # pragma: no cover


def target_price(entry: float, stop: float, cfg: Config) -> float | None:
    if cfg.target_r is None:
        return None
    risk_per_share = abs(entry - stop)
    return entry + cfg.direction.sign * cfg.target_r * risk_per_share


def trail_stop_price(anchor: float, cfg: Config, atr: float) -> float:
    """Trailing stop, ``trail_atr_mult`` ATR back from the best price so far."""
    return anchor - cfg.direction.sign * cfg.trail_atr_mult * atr


def tighten(current: float, candidate: float, direction: Direction) -> float:
    """A stop only ever moves in the trade's favour."""
    return candidate if beyond(candidate, current, direction) else current
