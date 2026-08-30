"""Streaming indicators.

Every indicator here is fed one closed bar at a time and can only ever report
a value derived from bars it has already been shown. That is deliberate: it
makes lookahead a structural impossibility rather than something you have to
remember not to do.
"""

from __future__ import annotations

import math
from collections import deque
from typing import Iterable

from .types import Bar


class WilderATR:
    """Wilder's ATR. ``value`` is None until ``period`` true ranges are seen."""

    def __init__(self, period: int) -> None:
        if period < 1:
            raise ValueError("period must be >= 1")
        self.period = period
        self._prev_close: float | None = None
        self._seed: list[float] = []
        self._value: float | None = None

    @property
    def value(self) -> float | None:
        return self._value

    @staticmethod
    def true_range(bar: Bar, prev_close: float | None) -> float:
        if prev_close is None:
            return bar.high - bar.low
        return max(
            bar.high - bar.low,
            abs(bar.high - prev_close),
            abs(bar.low - prev_close),
        )

    def update(self, bar: Bar) -> float | None:
        tr = self.true_range(bar, self._prev_close)
        self._prev_close = bar.close
        if self._value is None:
            self._seed.append(tr)
            if len(self._seed) == self.period:
                self._value = sum(self._seed) / self.period
        else:
            self._value = (self._value * (self.period - 1) + tr) / self.period
        return self._value


class RollingMean:
    """Simple moving average over the last ``n`` values."""

    def __init__(self, n: int) -> None:
        if n < 1:
            raise ValueError("n must be >= 1")
        self.n = n
        self._buf: deque[float] = deque(maxlen=n)
        self._sum = 0.0

    @property
    def value(self) -> float | None:
        if len(self._buf) < self.n:
            return None
        return self._sum / self.n

    def update(self, x: float) -> float | None:
        if len(self._buf) == self.n:
            self._sum -= self._buf[0]
        self._buf.append(x)
        self._sum += x
        return self.value


class RealizedVol:
    """Sample stdev of log returns over the last ``n`` returns."""

    def __init__(self, n: int) -> None:
        if n < 2:
            raise ValueError("realized vol needs n >= 2")
        self.n = n
        self._rets: deque[float] = deque(maxlen=n)
        self._prev_close: float | None = None

    @property
    def value(self) -> float | None:
        if len(self._rets) < self.n:
            return None
        mean = sum(self._rets) / self.n
        var = sum((r - mean) ** 2 for r in self._rets) / (self.n - 1)
        return math.sqrt(var)

    def update(self, close: float) -> float | None:
        if self._prev_close is not None and self._prev_close > 0 and close > 0:
            self._rets.append(math.log(close / self._prev_close))
        self._prev_close = close
        return self.value


class PercentileRank:
    """Percentile rank of the latest value within a trailing history window.

    ``update`` returns the rank of ``x`` against the history *excluding* ``x``
    itself, then appends it. A rank of 10.0 means "lower than 90% of the
    trailing window".
    """

    def __init__(self, history: int, min_history: int | None = None) -> None:
        if history < 2:
            raise ValueError("history must be >= 2")
        self.history = history
        self.min_history = min_history if min_history is not None else max(2, history // 10)
        self._buf: deque[float] = deque(maxlen=history)

    def rank_of(self, x: float) -> float | None:
        if len(self._buf) < self.min_history:
            return None
        below = sum(1 for v in self._buf if v < x)
        ties = sum(1 for v in self._buf if v == x)
        return 100.0 * (below + 0.5 * ties) / len(self._buf)

    def update(self, x: float) -> float | None:
        rank = self.rank_of(x)
        self._buf.append(x)
        return rank


def percentile(values: Iterable[float], pct: float) -> float:
    """Linear-interpolation percentile, matching numpy's default."""
    xs = sorted(values)
    if not xs:
        raise ValueError("percentile of empty sequence")
    if len(xs) == 1:
        return xs[0]
    pos = (len(xs) - 1) * (pct / 100.0)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return xs[int(pos)]
    return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo)
