"""Hyperliquid-format candle parsing, shared by every feed that speaks it.

Both the MoonDev data layer and Hyperliquid's own `/info` endpoint return the
same object, so one parser serves both:

    {"t": open_ms, "T": close_ms, "s": "BTC", "i": "1h",
     "o": "...", "h": "...", "l": "...", "c": "...", "v": "...", "n": 239}
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from breakout.types import Bar

# Bars are stamped with the time they CLOSED, because that is when the engine is
# allowed to see them. Feeds return an open time in "t" and a close time in "T";
# using "t" here would hand the engine a bar an interval before it existed.
VOLUME_FIELD = "v"
TICKCOUNT_FIELD = "n"


@dataclass(frozen=True)
class CandleParseReport:
    parsed: int
    skipped: int
    zero_volume: int
    used_tick_count: bool

    @property
    def volume_is_usable(self) -> bool:
        return self.parsed > 0 and self.zero_volume / self.parsed < 0.5


def _num(value, default: float | None = None) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def extract_list(payload) -> list[dict]:
    """Unwrap the several shapes these APIs use for 'a list of candles'."""
    if isinstance(payload, list):
        return [c for c in payload if isinstance(c, dict)]
    if isinstance(payload, dict):
        for key in ("candles", "bars", "data", "result"):
            value = payload.get(key)
            if isinstance(value, list):
                return [c for c in value if isinstance(c, dict)]
    return []


def parse_candles(
    payload,
    tz: str = "UTC",
    volume_from_tick_count: bool = False,
) -> tuple[list[Bar], CandleParseReport]:
    """Parse a candle payload into close-stamped ``Bar``s.

    ``volume_from_tick_count`` substitutes ``n`` (number of price updates) for
    ``v`` when the feed's traded volume is not populated. That is a *proxy*, not
    volume — see the warning in ``moondev.py``.
    """
    zone = ZoneInfo(tz)
    bars: list[Bar] = []
    skipped = 0
    zero_volume = 0

    for row in extract_list(payload):
        close_ms = row.get("T")
        open_ms = row.get("t")
        stamp = close_ms if close_ms is not None else open_ms
        o, h, l, c = (_num(row.get(k)) for k in ("o", "h", "l", "c"))
        if stamp is None or None in (o, h, l, c):
            skipped += 1
            continue

        vol = _num(row.get(VOLUME_FIELD), 0.0) or 0.0
        if vol == 0.0:
            zero_volume += 1
            if volume_from_tick_count:
                vol = _num(row.get(TICKCOUNT_FIELD), 0.0) or 0.0

        try:
            # Feeds are inconsistent about inclusive close stamps: some report the
            # last millisecond of the interval (...59999), some the boundary. Nudge
            # the inclusive form up by 1ms so every bar lands on an interval edge.
            ms = int(stamp)
            if ms % 1000 == 999:
                ms += 1
            ts = datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc).astimezone(zone)
            bars.append(
                Bar(
                    ts=ts,
                    open=o,
                    high=max(h, o, c),
                    low=min(l, o, c),
                    close=c,
                    volume=vol,
                )
            )
        except (ValueError, OverflowError, OSError):
            skipped += 1

    bars.sort(key=lambda b: b.ts)
    deduped: list[Bar] = []
    for bar in bars:
        if deduped and deduped[-1].ts == bar.ts:
            deduped[-1] = bar          # a later page supersedes an earlier partial
        else:
            deduped.append(bar)

    return deduped, CandleParseReport(
        parsed=len(deduped),
        skipped=skipped,
        zero_volume=zero_volume,
        used_tick_count=volume_from_tick_count,
    )
