"""Shared primitives.

Everything downstream is direction-agnostic: logic is written in terms of
``Direction`` and its ``sign``, so the short mirror (daily support -> 1H
breakdown -> retest of the zone from below) is the same code path with
``Direction.SHORT``.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class Direction(Enum):
    """Trade direction. ``sign`` is +1 long / -1 short."""

    LONG = 1
    SHORT = -1

    @property
    def sign(self) -> int:
        return self.value

    @property
    def opposite(self) -> "Direction":
        return Direction.SHORT if self is Direction.LONG else Direction.LONG


def beyond(price: float, ref: float, direction: Direction) -> bool:
    """True when ``price`` is strictly past ``ref`` in the trade's favour."""
    return direction.sign * (price - ref) > 0


def at_or_beyond(price: float, ref: float, direction: Direction) -> bool:
    return direction.sign * (price - ref) >= 0


def better_of(a: float, b: float, direction: Direction) -> float:
    """The more favourable of two prices for ``direction`` (higher if long)."""
    return a if direction.sign * (a - b) > 0 else b


def worse_of(a: float, b: float, direction: Direction) -> float:
    return a if direction.sign * (a - b) < 0 else b


@dataclass(frozen=True)
class Bar:
    """A single OHLCV bar, stamped with the time it *closed*.

    ``ts`` is the close timestamp and must be timezone-aware. The engine only
    ever sees a bar once ``ts`` has passed, which is what makes bar-close-only
    decision making structural rather than a convention.
    """

    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0

    def __post_init__(self) -> None:
        if self.ts.tzinfo is None:
            raise ValueError("Bar.ts must be timezone-aware")
        if not (self.low <= self.open <= self.high):
            raise ValueError(f"open outside range at {self.ts}")
        if not (self.low <= self.close <= self.high):
            raise ValueError(f"close outside range at {self.ts}")

    @property
    def range(self) -> float:
        return self.high - self.low

    @property
    def body(self) -> float:
        return abs(self.close - self.open)

    @property
    def body_frac(self) -> float:
        """Body as a fraction of full range. A zero-range bar has no wick, so 1.0."""
        return 1.0 if self.range <= 0 else self.body / self.range

    def extreme(self, direction: Direction, favourable: bool) -> float:
        """High/low picked by direction.

        ``favourable=True`` returns the extreme in the trade's favour (high for
        a long); ``False`` returns the adverse extreme (low for a long).
        """
        if direction is Direction.LONG:
            return self.high if favourable else self.low
        return self.low if favourable else self.high
