"""Loading and aligning the two timeframes.

Both series live in one timezone and every bar is stamped with the time it
closed. A daily bar's timestamp *is* its session close, so "when did this
become known" is the same question as "what is its timestamp" for both
timeframes — which is what lets the engine merge them into a single causal
event stream without a special case.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Iterable, Iterator, Sequence
from zoneinfo import ZoneInfo

from ..types import Bar

_TS_FORMATS = (
    "%Y-%m-%d %H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d",
)


def parse_ts(raw: str, tz: ZoneInfo) -> datetime:
    """Parse a timestamp, attaching ``tz`` when the string carries no offset."""
    raw = raw.strip()
    for fmt in _TS_FORMATS:
        try:
            dt = datetime.strptime(raw, fmt)
        except ValueError:
            continue
        return dt.replace(tzinfo=tz) if dt.tzinfo is None else dt.astimezone(tz)
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError as exc:  # pragma: no cover - defensive
        raise ValueError(f"unparseable timestamp: {raw!r}") from exc
    return dt.replace(tzinfo=tz) if dt.tzinfo is None else dt.astimezone(tz)


def parse_session_close(session_close: str) -> time:
    hh, _, mm = session_close.partition(":")
    return time(int(hh), int(mm or 0))


def session_close_dt(ts: datetime, tz: ZoneInfo, session_close: time) -> datetime:
    """The close timestamp of the session that ``ts`` belongs to.

    Sessions are keyed by their close instant rather than a date label, which
    keeps 24h markets (close 00:00) and overnight sessions (close 17:00)
    unambiguous without a special case.
    """
    local = ts.astimezone(tz)
    candidate = datetime.combine(local.date(), session_close, tzinfo=tz)
    if local <= candidate:
        return candidate
    return datetime.combine(local.date() + timedelta(days=1), session_close, tzinfo=tz)


def load_bars_csv(
    path: str,
    tz: str = "America/New_York",
    ts_col: str = "timestamp",
    columns: Sequence[str] = ("open", "high", "low", "close", "volume"),
) -> list[Bar]:
    """Load OHLCV bars from a CSV with a header row. Timestamps are close times."""
    zone = ZoneInfo(tz)
    o_c, h_c, l_c, c_c, v_c = columns
    bars: list[Bar] = []
    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            bars.append(
                Bar(
                    ts=parse_ts(row[ts_col], zone),
                    open=float(row[o_c]),
                    high=float(row[h_c]),
                    low=float(row[l_c]),
                    close=float(row[c_c]),
                    volume=float(row.get(v_c) or 0.0),
                )
            )
    bars.sort(key=lambda b: b.ts)
    return bars


def daily_from_hourly(
    hourly: Iterable[Bar],
    tz: str = "America/New_York",
    session_close: str = "16:00",
) -> list[Bar]:
    """Aggregate intraday bars into daily bars stamped at their session close.

    This is the safe way to build the daily series: it guarantees the daily bar
    is complete at exactly the moment the engine is first allowed to see it.
    """
    zone = ZoneInfo(tz)
    close_t = parse_session_close(session_close)
    buckets: dict[datetime, list[Bar]] = {}
    for bar in hourly:
        buckets.setdefault(session_close_dt(bar.ts, zone, close_t), []).append(bar)

    out: list[Bar] = []
    for close_ts in sorted(buckets):
        group = sorted(buckets[close_ts], key=lambda b: b.ts)
        out.append(
            Bar(
                ts=close_ts,
                open=group[0].open,
                high=max(b.high for b in group),
                low=min(b.low for b in group),
                close=group[-1].close,
                volume=sum(b.volume for b in group),
            )
        )
    return out


@dataclass(frozen=True)
class MarketData:
    """Daily + intraday bars in one timezone, merged into a causal event stream."""

    hourly: tuple[Bar, ...]
    daily: tuple[Bar, ...]
    tz: str = "America/New_York"
    session_close: str = "16:00"

    @classmethod
    def build(
        cls,
        hourly: Sequence[Bar],
        daily: Sequence[Bar] | None = None,
        tz: str = "America/New_York",
        session_close: str = "16:00",
    ) -> "MarketData":
        h = tuple(sorted(hourly, key=lambda b: b.ts))
        if daily is None:
            d = tuple(daily_from_hourly(h, tz, session_close))
        else:
            d = tuple(sorted(daily, key=lambda b: b.ts))
        return cls(hourly=h, daily=d, tz=tz, session_close=session_close)

    def events(self) -> Iterator[tuple[str, Bar]]:
        """Yield ``("daily"|"hourly", bar)`` in the order they became known.

        On a tie the daily bar goes first: it closed on the same instant as the
        session's last intraday bar, so both are complete, and the level book
        should reflect the finished day before that bar's breakout is judged.
        """
        i = j = 0
        while i < len(self.daily) or j < len(self.hourly):
            if j >= len(self.hourly):
                yield "daily", self.daily[i]
                i += 1
            elif i >= len(self.daily):
                yield "hourly", self.hourly[j]
                j += 1
            elif self.daily[i].ts <= self.hourly[j].ts:
                yield "daily", self.daily[i]
                i += 1
            else:
                yield "hourly", self.hourly[j]
                j += 1

    def truncate(self, cutoff: datetime) -> "MarketData":
        """Everything known at or before ``cutoff``. Used by the lookahead audit."""
        return MarketData(
            hourly=tuple(b for b in self.hourly if b.ts <= cutoff),
            daily=tuple(b for b in self.daily if b.ts <= cutoff),
            tz=self.tz,
            session_close=self.session_close,
        )

    def slice(self, start: datetime | None = None, end: datetime | None = None) -> "MarketData":
        def keep(b: Bar) -> bool:
            return (start is None or b.ts >= start) and (end is None or b.ts <= end)

        return MarketData(
            hourly=tuple(b for b in self.hourly if keep(b)),
            daily=tuple(b for b in self.daily if keep(b)),
            tz=self.tz,
            session_close=self.session_close,
        )
