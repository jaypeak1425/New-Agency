"""Hyperliquid `/info` candle archive — the deep-history feed.

Public, unauthenticated, and it reaches back far enough to actually backtest a
daily-level system. Use this for research; use `moondev.py` for the live and
derived data it is good at (liquidations, funding, order flow, whale positions).

The endpoint caps each response at roughly 5000 candles, so deep history is
paged forward in windows. Paging is the whole reason this module exists rather
than being three lines at a call site.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from breakout.data.loaders import MarketData
from breakout.types import Bar

from .candles import CandleParseReport, parse_candles
from .funding import FundingPoint, parse_funding_history
from .http import FeedError, HttpClient

BASE_URL = "https://api.hyperliquid.xyz"
PAGE_LIMIT = 5000
INTERVAL_MINUTES = {
    "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30,
    "1h": 60, "2h": 120, "4h": 240, "8h": 480, "12h": 720,
    "1d": 1440, "3d": 4320, "1w": 10080,
}


@dataclass
class HyperliquidFeed:
    base_url: str = BASE_URL
    timeout: float = 30.0
    tz: str = "UTC"
    max_pages: int = 200

    def __post_init__(self) -> None:
        self._http = HttpClient(base_url=self.base_url, timeout=self.timeout)

    def candles(
        self,
        symbol: str,
        interval: str = "1h",
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> tuple[list[Bar], CandleParseReport]:
        if interval not in INTERVAL_MINUTES:
            raise FeedError(f"unknown interval {interval!r}; expected one of {sorted(INTERVAL_MINUTES)}")
        end = end or datetime.now(timezone.utc)
        start = start or (end - timedelta(days=365))
        step = timedelta(minutes=INTERVAL_MINUTES[interval]) * PAGE_LIMIT

        collected: list[dict] = []
        cursor = start
        pages = 0
        while cursor < end and pages < self.max_pages:
            window_end = min(cursor + step, end)
            payload = self._http.post_json(
                "/info",
                {
                    "type": "candleSnapshot",
                    "req": {
                        "coin": symbol.upper(),
                        "interval": interval,
                        "startTime": int(cursor.timestamp() * 1000),
                        "endTime": int(window_end.timestamp() * 1000),
                    },
                },
            )
            page = payload if isinstance(payload, list) else []
            collected.extend(c for c in page if isinstance(c, dict))
            pages += 1
            if not page:
                # An empty window before the listing date is normal; keep walking
                # forward rather than concluding the symbol has no history.
                cursor = window_end
                continue
            cursor = window_end

        if pages >= self.max_pages:
            raise FeedError(
                f"hit max_pages={self.max_pages} fetching {symbol} {interval}; "
                "narrow the range or raise max_pages rather than silently truncating"
            )
        return parse_candles(collected, tz=self.tz)

    def funding_history(
        self,
        symbol: str,
        start: datetime | None = None,
        end: datetime | None = None,
        window_days: int = 30,
    ) -> list[FundingPoint]:
        """Hourly funding history, paged. Hyperliquid pays every hour, so a
        year is ~8,760 rows and one request will not carry it."""
        end = end or datetime.now(timezone.utc)
        start = start or (end - timedelta(days=365))
        step = timedelta(days=window_days)

        collected: list[dict] = []
        cursor = start
        pages = 0
        while cursor < end and pages < self.max_pages:
            window_end = min(cursor + step, end)
            payload = self._http.post_json(
                "/info",
                {
                    "type": "fundingHistory",
                    "coin": symbol.upper(),
                    "startTime": int(cursor.timestamp() * 1000),
                    "endTime": int(window_end.timestamp() * 1000),
                },
            )
            if isinstance(payload, list):
                collected.extend(r for r in payload if isinstance(r, dict))
            pages += 1
            cursor = window_end

        if pages >= self.max_pages:
            raise FeedError(
                f"hit max_pages={self.max_pages} fetching funding for {symbol}; "
                "narrow the range rather than silently truncating"
            )
        return parse_funding_history(collected, symbol, tz=self.tz)

    def market_data(
        self,
        symbol: str,
        days: int = 730,
        interval: str = "1h",
        session_close: str = "00:00",
        end: datetime | None = None,
    ) -> tuple[MarketData, CandleParseReport]:
        end = end or datetime.now(timezone.utc)
        bars, report = self.candles(symbol, interval, end - timedelta(days=days), end)
        return MarketData.build(bars, tz=self.tz, session_close=session_close), report
