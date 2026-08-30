"""Clustering and level lifecycle."""

from __future__ import annotations

from breakout.config import Config
from breakout.levels import LevelBook, LevelStatus
from breakout.types import Direction

from conftest import bar


def daily(highs: list[float], closes: list[float] | None = None) -> list:
    closes = closes if closes is not None else [h - 1.0 for h in highs]
    return [
        bar(i, min(h - 1.0, c), h, min(h - 2.0, c) - 0.5, c, unit="days")
        for i, (h, c) in enumerate(zip(highs, closes))
    ]


def feed(cfg: Config, bars: list) -> LevelBook:
    book = LevelBook(cfg)
    for b in bars:
        book.on_daily_bar(b)
    return book


def test_two_pivots_within_tolerance_collapse_to_one_level():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, cluster_tol_atr=0.5, min_touches=1,
                 count_retest_touches=False)
    # Two pivot highs at 100.0 and 100.1, far apart in time, both surrounded by lower bars.
    highs = [90, 91, 100.0, 91, 90, 89, 90, 91, 100.1, 91, 90, 89, 88]
    book = feed(cfg, daily(highs))
    live = [lv for lv in book.levels if lv.status is LevelStatus.LIVE]
    assert len(book.levels) == 1, [lv.price for lv in book.levels]
    level = book.levels[0]
    assert level.touch_count == 2
    assert level.price == (100.0 + 100.1) / 2
    assert level.member_prices == [100.0, 100.1]
    assert live == [level]


def test_pivots_outside_tolerance_stay_separate():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, cluster_tol_atr=0.05, min_touches=1,
                 count_retest_touches=False)
    highs = [90, 91, 100.0, 91, 90, 89, 90, 91, 108.0, 91, 90, 89, 88]
    book = feed(cfg, daily(highs))
    assert len(book.levels) == 2
    assert sorted(round(lv.price, 2) for lv in book.levels) == [100.0, 108.0]


def test_level_retires_once_a_daily_bar_closes_decisively_through():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=1, break_confirm_atr=0.25,
                 count_retest_touches=False)
    highs = [90, 91, 100.0, 91, 90, 89, 88, 120, 121]
    closes = [89, 90, 99.0, 90, 89, 88, 87, 119, 120]
    book = feed(cfg, daily(highs, closes))
    level = book.levels[0]
    assert level.status is LevelStatus.BROKEN
    assert level.retired_at is not None
    assert book.live_levels(120.0) == []


def test_a_close_just_past_the_level_is_not_a_break():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=1, break_confirm_atr=5.0,
                 count_retest_touches=False)
    highs = [90, 91, 100.0, 91, 90, 89, 88, 100.5, 99]
    closes = [89, 90, 99.0, 90, 89, 88, 87, 100.2, 98]
    book = feed(cfg, daily(highs, closes))
    assert book.levels[0].status is LevelStatus.LIVE


def test_min_touches_gates_usability_not_existence():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=2, count_retest_touches=False)
    highs = [90, 91, 100.0, 91, 90, 89, 88, 87, 86]
    book = feed(cfg, daily(highs))
    assert len(book.levels) == 1
    assert book.levels[0].touch_count == 1
    assert book.live_levels(95.0) == []   # exists, but not usable


def test_levels_expire_with_age():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=1, max_level_age_days=5,
                 count_retest_touches=False)
    highs = [90, 91, 100.0, 91, 90] + [80 - i * 0.1 for i in range(12)]
    book = feed(cfg, daily(highs))
    assert book.levels[0].status is LevelStatus.EXPIRED


def test_distance_filter_hides_far_away_levels():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=1, max_level_distance_atr=1.0,
                 count_retest_touches=False)
    highs = [90, 91, 100.0, 91, 90, 89, 88, 87, 86]
    book = feed(cfg, daily(highs))
    assert book.live_levels(99.9) != []
    assert book.live_levels(10.0) == []


def test_replay_counts_touches_from_the_confirmation_window():
    """A level is born `lookback` bars late, so the bars that confirmed it are
    already history. They are replayed on admission, otherwise a level that was
    retested twice while it was still invisible would arrive claiming one touch.

    (A *break* cannot hide in that window: for a pivot high, closing through the
    level requires a high through it, which would have disqualified the pivot.)
    """
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=1,
                 count_retest_touches=True, touch_tol_atr=1.0, touch_cooldown_bars=1)
    highs = [90, 91, 100.0, 99.6, 99.5, 89, 88, 87]
    closes = [89, 90, 99.0, 98.8, 98.7, 88, 87, 86]
    book = feed(cfg, daily(highs, closes))
    level = book.levels[0]
    assert level.status is LevelStatus.LIVE
    assert level.touch_count == 3   # the pivot itself, plus the two replayed bars


def test_break_immediately_after_confirmation_retires_the_level():
    cfg = Config(pivot_lookback=2, atr_period_daily=3, min_touches=1, break_confirm_atr=0.1,
                 count_retest_touches=False)
    highs = [90, 91, 100.0, 95, 94, 130, 131]
    closes = [89, 90, 99.0, 94, 93, 129, 130]
    book = feed(cfg, daily(highs, closes))
    assert book.levels[0].status is LevelStatus.BROKEN


def test_short_book_tracks_support():
    cfg = Config(direction=Direction.SHORT, pivot_lookback=2, atr_period_daily=3, min_touches=1,
                 count_retest_touches=False)
    lows = [110, 109, 100.0, 109, 110, 111, 112, 113, 114]
    bars = [bar(i, l + 2, l + 3, l, l + 1, unit="days") for i, l in enumerate(lows)]
    book = feed(cfg, bars)
    assert len(book.levels) == 1 and book.levels[0].price == 100.0
