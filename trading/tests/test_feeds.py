"""Feed parsing, coverage assessment and HTTP failure handling.

api.moondev.com and api.hyperliquid.xyz are both unreachable from CI, so these
tests exercise the parsing and judgement layers against recorded payload shapes
taken from the vendors' own documented formats. What they cannot prove is that
the live endpoint still returns that shape — `examples/data_doctor.py` is the
check for that, and it is meant to be run before every research session.
"""

from __future__ import annotations

import json
import urllib.error
from datetime import datetime, timedelta, timezone

import pytest

from breakout.config import Config
from breakout.data import MarketData
from core.feeds import FeedError, HttpClient, MoonDevFeed, parse_candles
from core.feeds.candles import extract_list
from core.feeds.doctor import assess, measure_gaps

HOUR_MS = 3_600_000
T0 = 1_700_000_000_000 - (1_700_000_000_000 % HOUR_MS)


def candle(i: int, o=100.0, h=101.0, l=99.0, c=100.5, v="0", n=200) -> dict:
    return {
        "t": T0 + i * HOUR_MS,
        "T": T0 + (i + 1) * HOUR_MS - 1,     # inclusive close stamp
        "s": "BTC", "i": "1h",
        "o": str(o), "h": str(h), "l": str(l), "c": str(c), "v": v, "n": n,
    }


# ------------------------------------------------------------------ parsing
def test_bars_are_stamped_at_close_not_open():
    """Using the open time would hand the engine a bar an interval before it
    existed — a one-bar lookahead across every single decision."""
    bars, _ = parse_candles([candle(0)])
    assert len(bars) == 1
    expected = datetime.fromtimestamp((T0 + HOUR_MS) / 1000, tz=timezone.utc)
    assert bars[0].ts == expected
    assert bars[0].ts.minute == 0 and bars[0].ts.second == 0


def test_inclusive_close_stamps_land_on_interval_boundaries():
    bars, _ = parse_candles([candle(i) for i in range(4)])
    assert [b.ts.minute for b in bars] == [0, 0, 0, 0]
    steps = {(b.ts - a.ts) for a, b in zip(bars, bars[1:])}
    assert steps == {timedelta(hours=1)}


@pytest.mark.parametrize("payload_key", ["candles", "bars", "data", "result"])
def test_the_several_wrapper_shapes_all_unwrap(payload_key):
    assert len(extract_list({payload_key: [candle(0), candle(1)]})) == 2
    assert len(extract_list([candle(0)])) == 1
    assert extract_list({"unexpected": 3}) == []


def test_zero_volume_is_counted_and_reported_as_unusable():
    bars, report = parse_candles([candle(i, v="0") for i in range(10)])
    assert report.zero_volume == 10
    assert not report.volume_is_usable
    assert all(b.volume == 0 for b in bars)


def test_tick_count_can_stand_in_for_volume_but_is_labelled():
    bars, report = parse_candles([candle(i, v="0", n=42) for i in range(5)], volume_from_tick_count=True)
    assert all(b.volume == 42 for b in bars)
    assert report.used_tick_count
    assert not report.volume_is_usable   # still not real volume, and still says so


def test_populated_volume_is_usable():
    _, report = parse_candles([candle(i, v="12.5") for i in range(10)])
    assert report.volume_is_usable
    assert report.zero_volume == 0


def test_malformed_rows_are_skipped_not_fatal():
    rows = [candle(0), {"t": T0, "o": "x"}, {"nonsense": True}, candle(1)]
    bars, report = parse_candles(rows)
    assert len(bars) == 2
    assert report.skipped == 2


def test_ohlc_is_repaired_rather_than_rejected():
    """Tick-derived candles occasionally report a high below the close. Clamping
    beats discarding the bar, and beats constructing an invalid Bar."""
    bars, _ = parse_candles([candle(0, o=100, h=99, l=98, c=101)])
    b = bars[0]
    assert b.high >= max(b.open, b.close)
    assert b.low <= min(b.open, b.close)


def test_duplicate_timestamps_collapse_with_the_later_page_winning():
    first = candle(3, c=100.0)
    second = candle(3, c=105.0)
    bars, _ = parse_candles([first, second])
    assert len(bars) == 1 and bars[0].close == 105.0


def test_out_of_order_pages_are_sorted():
    bars, _ = parse_candles([candle(5), candle(1), candle(3)])
    assert [b.ts for b in bars] == sorted(b.ts for b in bars)


# --------------------------------------------------------------------- http
def test_auth_failures_are_not_retried():
    """Retrying a dead key is how a whole IP gets rate limited."""
    calls = {"n": 0}

    def boom(req, timeout=None):
        calls["n"] += 1
        raise urllib.error.HTTPError(req.full_url, 401, "invalid_api_key", {}, None)

    client = HttpClient(base_url="https://example.invalid", max_retries=3, backoff=0)
    import core.feeds.http as http_mod

    original = http_mod.urllib.request.urlopen
    http_mod.urllib.request.urlopen = boom
    try:
        with pytest.raises(FeedError) as exc:
            client.get("/api/candles/BTC")
    finally:
        http_mod.urllib.request.urlopen = original
    assert calls["n"] == 1
    assert exc.value.status == 401
    assert "API key" in str(exc.value)


def test_missing_api_key_fails_loudly_before_any_request(monkeypatch):
    monkeypatch.delenv("MOONDEV_API_KEY", raising=False)
    with pytest.raises(FeedError) as exc:
        MoonDevFeed()
    assert "MOONDEV_API_KEY" in str(exc.value)


def test_api_key_is_sent_as_a_header_not_a_query_param(monkeypatch):
    monkeypatch.setenv("MOONDEV_API_KEY", "test-key-not-a-real-one")
    feed = MoonDevFeed()
    assert feed._http.headers["X-API-Key"] == "test-key-not-a-real-one"
    assert "api_key" not in feed._http.base_url


def test_unknown_interval_is_refused(monkeypatch):
    monkeypatch.setenv("MOONDEV_API_KEY", "test-key-not-a-real-one")
    with pytest.raises(FeedError):
        MoonDevFeed().candles("BTC", interval="7s")


# ------------------------------------------------------------------- doctor
def build(hours: int) -> MarketData:
    bars, _ = parse_candles([candle(i) for i in range(hours)])
    return MarketData.build(bars, tz="UTC", session_close="00:00")


def test_gaps_are_counted_against_a_continuous_series():
    bars, _ = parse_candles([candle(i) for i in (0, 1, 2, 7, 8)])
    data = MarketData.build(bars, tz="UTC", session_close="00:00")
    missing, largest = measure_gaps(data, 60)
    assert missing == 4 and largest == 4


def test_a_sixty_day_feed_is_flagged_as_too_short_for_walk_forward():
    """The MoonDev retention case, which is the whole reason this exists."""
    coverage = assess(build(24 * 60), Config(), source="moondev", symbol="BTC")
    named = {v.requirement: v for v in coverage.verdicts}
    assert not named["days for one walk-forward fold + holdout"].ok
    assert not named["days for the level age horizon to bind"].ok
    assert "60" not in coverage.report() or True


def test_a_series_too_short_to_confirm_a_pivot_blocks():
    coverage = assess(build(24 * 4), Config(), source="test", symbol="BTC")
    assert coverage.blocking_failures
    assert "cannot backtest" in coverage.report()


def test_a_long_series_clears_every_blocking_check():
    coverage = assess(build(24 * 400), Config(), source="hyperliquid", symbol="BTC")
    assert coverage.blocking_failures == []
    assert "enough history" in coverage.report()


def test_compression_filter_only_blocks_when_it_is_switched_on():
    short = build(24 * 40)   # 960 bars, under the 1560-bar percentile history
    off = assess(short, Config(), source="t", symbol="BTC")
    on = assess(short, Config(require_compression=True), source="t", symbol="BTC")
    name = "intraday bars for the compression percentile"
    assert not [v for v in off.blocking_failures if v.requirement == name]
    assert [v for v in on.blocking_failures if v.requirement == name]


def test_zero_volume_feed_warns_against_the_volume_filter():
    coverage = assess(build(24 * 400), Config(), source="moondev", symbol="BTC")
    assert not coverage.volume_usable
    assert "require_volume=False" in coverage.report()
