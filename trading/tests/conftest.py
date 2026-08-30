"""Shared fixtures and bar-building helpers."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from breakout.config import Config
from breakout.data import MarketData
from breakout.data.synthetic import SyntheticSpec, make_hourly
from breakout.engine.loop import Engine
from breakout.signals.breakout import BreakoutSignal
from breakout.types import Bar

TZ = ZoneInfo("America/New_York")
START = datetime(2020, 1, 2, 10, 0, tzinfo=TZ)


def bar(i: int, o: float, h: float, l: float, c: float, v: float = 1_000_000.0, unit: str = "hours") -> Bar:
    return Bar(ts=START + timedelta(**{unit: i}), open=o, high=h, low=l, close=c, volume=v)


def flat_bar(i: int, price: float, spread: float = 0.2, **kw) -> Bar:
    """A bar that opens and closes at ``price`` with a small symmetric range."""
    return bar(i, price, price + spread, price - spread, price, **kw)


def ohlc_series(closes: list[float], spread: float = 0.2, unit: str = "hours") -> list[Bar]:
    """Bars that walk through ``closes``, opening at the previous close."""
    out: list[Bar] = []
    prev = closes[0]
    for i, c in enumerate(closes):
        out.append(bar(i, prev, max(prev, c) + spread, min(prev, c) - spread, c, unit=unit))
        prev = c
    return out


@pytest.fixture(scope="session")
def synthetic() -> MarketData:
    return MarketData.build(make_hourly(SyntheticSpec(days=420)))


@pytest.fixture(scope="session")
def small_synthetic() -> MarketData:
    return MarketData.build(make_hourly(SyntheticSpec(days=200, seed=11)))


def armed_engine(
    cfg: Config,
    level_price: float = 100.0,
    breakout_close: float = 103.0,
    breakout_high: float | None = None,
    atr: float = 1.0,
    warm_bars: int = 3,
) -> tuple[Engine, object, int]:
    """An engine with one zone armed at a known level, ready to be fed bars.

    Bypasses level detection on purpose: these are lifecycle tests, and the
    level layer has its own.
    """
    engine = Engine(cfg)
    ctx = None
    for i in range(warm_bars):
        ctx = engine.on_hourly_bar(flat_bar(i, level_price))
    signal = BreakoutSignal(
        level_id=1,
        level_price=level_price,
        ts=ctx.bar.ts,
        bar_index=ctx.index,
        breakout_close=breakout_close,
        breakout_high=breakout_high if breakout_high is not None else breakout_close + 0.2,
        atr=atr,
    )
    trade = engine.arm(signal, ctx)
    return engine, trade, warm_bars
