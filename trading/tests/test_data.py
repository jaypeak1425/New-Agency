"""Loading, session handling and the merged event stream."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from breakout.data import MarketData, daily_from_hourly, load_bars_csv, session_close_dt
from breakout.data.loaders import parse_session_close
from breakout.types import Bar

NY = ZoneInfo("America/New_York")
UTC = ZoneInfo("UTC")


def test_session_is_keyed_by_its_close_instant():
    close = parse_session_close("16:00")
    assert session_close_dt(datetime(2024, 3, 5, 15, 0, tzinfo=NY), NY, close) == datetime(
        2024, 3, 5, 16, 0, tzinfo=NY
    )
    assert session_close_dt(datetime(2024, 3, 5, 16, 0, tzinfo=NY), NY, close) == datetime(
        2024, 3, 5, 16, 0, tzinfo=NY
    )
    # After the close, the bar belongs to the next session.
    assert session_close_dt(datetime(2024, 3, 5, 17, 0, tzinfo=NY), NY, close) == datetime(
        2024, 3, 6, 16, 0, tzinfo=NY
    )


def test_a_midnight_close_handles_a_24h_market():
    close = parse_session_close("00:00")
    assert session_close_dt(datetime(2024, 3, 5, 13, 0, tzinfo=UTC), UTC, close) == datetime(
        2024, 3, 6, 0, 0, tzinfo=UTC
    )


def test_daily_bars_aggregate_their_session_and_are_stamped_at_its_close():
    start = datetime(2024, 3, 5, 10, 0, tzinfo=NY)
    hourly = [
        Bar(start + timedelta(hours=i), 100 + i, 101 + i, 99 + i, 100.5 + i, 1000)
        for i in range(7)
    ]
    daily = daily_from_hourly(hourly, tz="America/New_York", session_close="16:00")
    assert len(daily) == 1
    d = daily[0]
    assert d.ts == datetime(2024, 3, 5, 16, 0, tzinfo=NY)
    assert d.open == hourly[0].open and d.close == hourly[-1].close
    assert d.high == max(b.high for b in hourly)
    assert d.low == min(b.low for b in hourly)
    assert d.volume == pytest.approx(7000)


def test_events_are_causal_and_put_the_daily_bar_first_on_a_tie():
    start = datetime(2024, 3, 5, 10, 0, tzinfo=NY)
    hourly = [
        Bar(start + timedelta(hours=i), 100, 101, 99, 100, 1000) for i in range(14)
    ]
    data = MarketData.build(hourly)
    events = list(data.events())
    stamps = [b.ts for _, b in events]
    assert stamps == sorted(stamps)
    # The daily bar closes on the same instant as the session's last 1H bar.
    tie = [k for k, b in events if b.ts == datetime(2024, 3, 5, 16, 0, tzinfo=NY)]
    assert tie == ["daily", "hourly"]


def test_truncate_keeps_only_what_was_known():
    start = datetime(2024, 3, 5, 10, 0, tzinfo=NY)
    hourly = [Bar(start + timedelta(hours=i), 100, 101, 99, 100, 1000) for i in range(21)]
    data = MarketData.build(hourly)
    cutoff = start + timedelta(hours=8)
    cut = data.truncate(cutoff)
    assert all(b.ts <= cutoff for b in cut.hourly)
    assert all(b.ts <= cutoff for b in cut.daily)
    assert len(cut.hourly) < len(data.hourly)


def test_csv_round_trip(tmp_path):
    path = tmp_path / "bars.csv"
    path.write_text(
        "timestamp,open,high,low,close,volume\n"
        "2024-03-05 10:00:00,100,101,99,100.5,1234\n"
        "2024-03-05 11:00:00,100.5,102,100,101.5,2345\n"
    )
    bars = load_bars_csv(str(path), tz="America/New_York")
    assert len(bars) == 2
    assert bars[0].ts == datetime(2024, 3, 5, 10, 0, tzinfo=NY)
    assert bars[1].close == 101.5
    assert bars[0].volume == 1234


def test_a_malformed_bar_is_rejected_at_construction():
    with pytest.raises(ValueError):
        Bar(datetime(2024, 3, 5, 10, 0, tzinfo=NY), 100, 99, 98, 98.5)   # open above high
    with pytest.raises(ValueError):
        Bar(datetime(2024, 3, 5, 10, 0), 100, 101, 99, 100)              # naive timestamp
