"""Pivot detection, and the lookahead trap it exists to avoid."""

from __future__ import annotations

import pytest

from breakout.levels import PivotDetector, find_pivots
from breakout.types import Direction

from conftest import bar


def series(highs: list[float]) -> list:
    return [bar(i, h - 1, h, h - 2, h - 1, unit="days") for i, h in enumerate(highs)]


def test_finds_the_known_pivot():
    bars = series([10, 11, 12, 13, 14, 20, 14, 13, 12, 11, 10])
    pivots = find_pivots(bars, lookback=3, direction=Direction.LONG)
    assert [p.index for p in pivots] == [5]
    assert pivots[0].price == 20


def test_confirmation_lags_the_pivot_by_exactly_lookback():
    bars = series([10, 11, 12, 13, 14, 20, 14, 13, 12, 11, 10])
    lookback = 3
    pivot = find_pivots(bars, lookback, Direction.LONG)[0]
    assert pivot.confirmed_index == pivot.index + lookback
    assert pivot.confirmed_ts == bars[pivot.index + lookback].ts


@pytest.mark.parametrize("lookback", [1, 2, 3, 4, 5])
def test_nothing_is_confirmed_before_its_window_closes(lookback):
    """The core lookahead assertion: feeding bars one at a time, a pivot may
    never be reported until `lookback` bars after it have closed."""
    bars = series([10, 12, 11, 14, 9, 20, 13, 8, 16, 11, 10, 15, 9, 21, 12, 11, 10, 9, 8, 7])
    detector = PivotDetector(lookback, Direction.LONG)
    for i, b in enumerate(bars):
        pivot = detector.update(b)
        if pivot is not None:
            assert pivot.confirmed_index == i
            assert i - pivot.index == lookback
            assert pivot.index + lookback <= i


def test_truncated_feed_never_reports_more_than_the_full_feed():
    bars = series([10, 12, 11, 14, 9, 20, 13, 8, 16, 11, 10, 15, 9, 21, 12, 11, 10])
    full = find_pivots(bars, 3, Direction.LONG)
    for cut in range(1, len(bars) + 1):
        partial = find_pivots(bars[:cut], 3, Direction.LONG)
        assert partial == full[: len(partial)]


def test_exact_double_top_confirms_neither_bar():
    bars = series([10, 11, 20, 12, 20, 11, 10, 9, 8])
    assert find_pivots(bars, 2, Direction.LONG) == []


def test_short_mirror_finds_pivot_lows():
    bars = [bar(i, l + 2, l + 3, l, l + 1, unit="days") for i, l in enumerate([20, 18, 16, 10, 16, 18, 20])]
    pivots = find_pivots(bars, 3, Direction.SHORT)
    assert [(p.index, p.price) for p in pivots] == [(3, 10)]
