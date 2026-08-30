"""Level construction and lifecycle.

Confirmed pivots are clustered into levels; levels accumulate touches, age,
and are retired once a daily bar closes decisively through them. The book is
fed one closed daily bar at a time and answers exactly one question for the
signal layer: *which levels are live and usable right now*.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from ..config import Config
from ..indicators import WilderATR
from ..types import Bar, beyond
from .pivots import Pivot, PivotDetector


class LevelStatus(Enum):
    LIVE = "live"
    BROKEN = "broken"    # a daily bar closed decisively through it
    EXPIRED = "expired"  # aged out


@dataclass
class Level:
    id: int
    price: float
    created_at: datetime           # when it became usable (pivot confirmation)
    pivot_ts: datetime             # when the originating pivot printed
    member_prices: list[float] = field(default_factory=list)
    touch_count: int = 0
    status: LevelStatus = LevelStatus.LIVE
    retired_at: datetime | None = None
    last_touch_index: int = -10**9

    @property
    def is_live(self) -> bool:
        return self.status is LevelStatus.LIVE

    def add_member(self, price: float) -> None:
        self.member_prices.append(price)
        self.price = sum(self.member_prices) / len(self.member_prices)
        self.touch_count += 1


class LevelBook:
    """Maintains the set of daily levels for one instrument, causally."""

    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self.direction = cfg.direction
        self._detector = PivotDetector(cfg.pivot_lookback, cfg.direction)
        self._atr = WilderATR(cfg.atr_period_daily)
        self._bars: list[Bar] = []
        self._levels: list[Level] = []
        self._next_id = 1
        self.now: datetime | None = None

    # ------------------------------------------------------------------ state
    @property
    def daily_atr(self) -> float | None:
        return self._atr.value

    @property
    def levels(self) -> list[Level]:
        return list(self._levels)

    # ----------------------------------------------------------------- ingest
    def on_daily_bar(self, bar: Bar) -> Level | None:
        """Process one closed daily bar. Returns a level if one was born."""
        self._bars.append(bar)
        self.now = bar.ts
        self._atr.update(bar)

        born: Level | None = None
        pivot = self._detector.update(bar)
        if pivot is not None:
            born = self._admit(pivot)

        # Existing levels react to the bar that just closed.
        for level in self._levels:
            if level is born:
                continue  # already caught up during admission
            if level.is_live:
                self._apply_bar(level, bar, len(self._bars) - 1)
        self._expire_stale(bar.ts)
        return born

    # ------------------------------------------------------------- internals
    def _tol(self, mult: float) -> float | None:
        atr = self._atr.value
        return None if atr is None else mult * atr

    def _admit(self, pivot: Pivot) -> Level | None:
        """Cluster a freshly confirmed pivot into an existing level, or create one."""
        tol = self._tol(self.cfg.cluster_tol_atr)
        if tol is not None:
            for level in self._levels:
                if level.is_live and abs(level.price - pivot.price) <= tol:
                    level.add_member(pivot.price)
                    return None  # merged, no new level

        level = Level(
            id=self._next_id,
            price=pivot.price,
            created_at=pivot.confirmed_ts,
            pivot_ts=pivot.ts,
            member_prices=[pivot.price],
            touch_count=1,
            last_touch_index=pivot.index,
        )
        self._next_id += 1
        self._levels.append(level)

        # The level is born `lookback` bars late. Bars between the pivot and now
        # are all closed and known, so replay them: price may already have
        # broken or retested the level before we were allowed to see it.
        for idx in range(pivot.index + 1, len(self._bars)):
            if not level.is_live:
                break
            self._apply_bar(level, self._bars[idx], idx)
        return level

    def _apply_bar(self, level: Level, bar: Bar, index: int) -> None:
        """Touch accounting and break confirmation for one closed daily bar."""
        break_tol = self._tol(self.cfg.break_confirm_atr) or 0.0
        break_price = level.price + self.direction.sign * break_tol
        if beyond(bar.close, break_price, self.direction):
            level.status = LevelStatus.BROKEN
            level.retired_at = bar.ts
            return

        if not self.cfg.count_retest_touches:
            return
        touch_tol = self._tol(self.cfg.touch_tol_atr)
        if touch_tol is None:
            return
        # A touch is an approach into the band that fails to close through.
        reach = bar.extreme(self.direction, favourable=True)
        if abs(reach - level.price) <= touch_tol and not beyond(bar.close, level.price, self.direction):
            if index - level.last_touch_index >= self.cfg.touch_cooldown_bars:
                level.touch_count += 1
                level.last_touch_index = index

    def _expire_stale(self, now: datetime) -> None:
        horizon = timedelta(days=self.cfg.max_level_age_days)
        for level in self._levels:
            if level.is_live and now - level.pivot_ts > horizon:
                level.status = LevelStatus.EXPIRED
                level.retired_at = now

    # ------------------------------------------------------------------ query
    def live_levels(self, ref_price: float) -> list[Level]:
        """Levels usable for arming right now, nearest to ``ref_price`` first."""
        atr = self._atr.value
        max_dist = None if atr is None else self.cfg.max_level_distance_atr * atr
        out = []
        for level in self._levels:
            if not level.is_live:
                continue
            if level.touch_count < self.cfg.min_touches:
                continue
            if max_dist is not None and abs(level.price - ref_price) > max_dist:
                continue
            out.append(level)
        out.sort(key=lambda lv: abs(lv.price - ref_price))
        return out
