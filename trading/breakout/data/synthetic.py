"""Deterministic synthetic series.

Not a market model and not a substitute for one — a fixture. It manufactures
the structure the system is built to trade (a ceiling that gets touched several
times, a close through it, a pullback into the zone) so the engine, the fill
model and the tests have something with known shape to run against.

Seeded throughout: the same seed always produces the same bars.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from ..types import Bar


@dataclass(frozen=True)
class SyntheticSpec:
    days: int = 1400
    bars_per_day: int = 7
    first_bar_hour: int = 10
    start_price: float = 100.0
    sigma: float = 0.0035          # per-bar log-return stdev
    drift: float = 0.0
    base_volume: float = 1_000_000.0
    episode_days: int = 30          # cadence of ceiling episodes
    approach_frac: float = 0.72     # share of an episode spent under the ceiling
    ceiling_atr_mult: float = 6.0   # how far the ceiling sits above the range
    breakout_drift: float = 0.004
    pullback_drift: float = -0.0032
    breakout_bars: int = 5
    pullback_bars: int = 7
    tz: str = "America/New_York"
    seed: int = 7


def _session_timestamps(spec: SyntheticSpec) -> list[datetime]:
    zone = ZoneInfo(spec.tz)
    out: list[datetime] = []
    day = datetime(2019, 1, 2, spec.first_bar_hour, 0, tzinfo=zone)
    added = 0
    while added < spec.days:
        if day.weekday() < 5:
            for k in range(spec.bars_per_day):
                out.append(day + timedelta(hours=k))
            added += 1
        day += timedelta(days=1)
    return out


def make_hourly(spec: SyntheticSpec | None = None) -> list[Bar]:
    """Generate an hourly series with recurring resistance-then-break episodes."""
    spec = spec or SyntheticSpec()
    rng = random.Random(spec.seed)
    stamps = _session_timestamps(spec)
    episode_bars = max(spec.episode_days * spec.bars_per_day, 40)
    approach_bars = int(episode_bars * spec.approach_frac)

    bars: list[Bar] = []
    price = spec.start_price
    ceiling: float | None = None

    for i, ts in enumerate(stamps):
        phase = i % episode_bars
        if phase == 0:
            # A new ceiling, set above the current price by a few bars of range.
            ceiling = price * (1.0 + spec.ceiling_atr_mult * spec.sigma)

        drift = spec.drift
        if phase == approach_bars:
            ceiling = None  # release: the break is allowed to happen
        if approach_bars <= phase < approach_bars + spec.breakout_bars:
            drift += spec.breakout_drift
        elif (
            approach_bars + spec.breakout_bars
            <= phase
            < approach_bars + spec.breakout_bars + spec.pullback_bars
        ):
            drift += spec.pullback_drift

        prev = price
        price = prev * math.exp(rng.gauss(drift, spec.sigma))
        if ceiling is not None and price > ceiling:
            # Reflect off the ceiling: this is what puts touches on the level.
            price = ceiling * (1.0 - abs(rng.gauss(0.0, spec.sigma)))

        open_ = prev
        close = price
        wick = abs(rng.gauss(0.0, spec.sigma * 0.8)) * prev
        high = max(open_, close) + wick * rng.random()
        low = min(open_, close) - wick * rng.random()
        if ceiling is not None:
            high = min(high, ceiling * (1.0 + spec.sigma * 0.25))
            close = min(close, high)
            low = min(low, close)

        bars.append(
            Bar(
                ts=ts,
                open=round(open_, 4),
                high=round(max(high, open_, close), 4),
                low=round(min(low, open_, close), 4),
                close=round(close, 4),
                volume=round(spec.base_volume * math.exp(rng.gauss(0.0, 0.35)), 2),
            )
        )
        price = close
    return bars
