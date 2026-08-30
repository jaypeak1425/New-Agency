"""Pivot detection on the daily series.

A pivot high is a bar whose high strictly exceeds the highs of
``lookback`` bars on each side. The right-hand side is the lookahead trap: the
pivot is not *knowable* until ``lookback`` bars after it have closed. The
detector is therefore incremental — it is fed bars one at a time and emits a
pivot only on the bar that completes its right-hand window, stamped with both
the pivot's own time and the time it became usable.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..types import Bar, Direction


@dataclass(frozen=True)
class Pivot:
    index: int              # index of the pivot bar in the daily series
    price: float            # pivot high (long) / pivot low (short)
    ts: datetime            # close time of the pivot bar
    confirmed_index: int    # index of the bar that completed the right window
    confirmed_ts: datetime  # close time of that bar — the level's birth time


class PivotDetector:
    """Streaming pivot detector. Feed closed daily bars; collect confirmations."""

    def __init__(self, lookback: int, direction: Direction) -> None:
        if lookback < 1:
            raise ValueError("lookback must be >= 1")
        self.lookback = lookback
        self.direction = direction
        self._bars: list[Bar] = []

    def _pivot_price(self, bar: Bar) -> float:
        return bar.high if self.direction is Direction.LONG else bar.low

    def _dominates(self, candidate: float, other: float) -> bool:
        # Strict on both sides: an exact double top confirms neither bar.
        return (candidate > other) if self.direction is Direction.LONG else (candidate < other)

    def update(self, bar: Bar) -> Pivot | None:
        """Feed one closed daily bar; return a pivot if this bar confirms one."""
        self._bars.append(bar)
        n = self.lookback
        centre = len(self._bars) - 1 - n
        if centre < n:
            return None  # not enough bars on the left yet

        candidate = self._pivot_price(self._bars[centre])
        for i in range(centre - n, centre + n + 1):
            if i == centre:
                continue
            if not self._dominates(candidate, self._pivot_price(self._bars[i])):
                return None
        return Pivot(
            index=centre,
            price=candidate,
            ts=self._bars[centre].ts,
            confirmed_index=len(self._bars) - 1,
            confirmed_ts=bar.ts,
        )


def find_pivots(bars: list[Bar], lookback: int, direction: Direction) -> list[Pivot]:
    """Batch convenience wrapper. Uses the same incremental path, so it cannot
    report a pivot the streaming engine would not also have seen."""
    det = PivotDetector(lookback, direction)
    out: list[Pivot] = []
    for bar in bars:
        p = det.update(bar)
        if p is not None:
            out.append(p)
    return out
