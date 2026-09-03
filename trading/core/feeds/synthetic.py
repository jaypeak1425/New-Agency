"""Deterministic synthetic funding, for exercising the carry sleeve.

A fixture, not a market model. It produces the shape carry trades on — funding
that mean-reverts around a positive level, with stretches of richness and
occasional flips negative — so the backtest and its tests have something with
known properties to run against.

Premium tracks funding because on most venues that is the mechanical
relationship: funding is computed *from* the premium. Generating them
independently would make the basis leg behave in a way it cannot in reality.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from ..feeds.funding import FundingPoint


@dataclass(frozen=True)
class FundingSpec:
    symbol: str = "BTC"
    hours: int = 24 * 365
    mean_rate: float = 0.0000125        # ~11% annualized at hourly intervals
    reversion: float = 0.02             # OU pull per hour
    noise: float = 0.000012
    regime_hours: int = 24 * 21         # cadence of rich / lean stretches
    regime_amplitude: float = 1.6
    premium_coef: float = 8.0           # premium ~ this many x the funding rate
    premium_noise: float = 0.00004
    seed: int = 17
    start: datetime | None = None


def make_funding(spec: FundingSpec | None = None) -> list[FundingPoint]:
    spec = spec or FundingSpec()
    rng = random.Random(spec.seed)
    start = spec.start or datetime(2024, 1, 1, tzinfo=timezone.utc)

    out: list[FundingPoint] = []
    rate = spec.mean_rate
    for i in range(spec.hours):
        # Slow regime cycle: leverage crowds in and out over weeks.
        cycle = math.sin(2.0 * math.pi * i / spec.regime_hours)
        target = spec.mean_rate * (1.0 + spec.regime_amplitude * cycle)
        rate += spec.reversion * (target - rate) + rng.gauss(0.0, spec.noise)
        premium = spec.premium_coef * rate + rng.gauss(0.0, spec.premium_noise)
        out.append(
            FundingPoint(
                symbol=spec.symbol,
                ts=start + timedelta(hours=i),
                rate=rate,
                premium=premium,
            )
        )
    return out
