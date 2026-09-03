"""Moon Dev Hyperliquid Data Layer — candles feed.

    https://github.com/moondevonyt/hyperliquid-data-layer-api

Auth is the `X-API-Key` header, and the key is read from the `MOONDEV_API_KEY`
environment variable. Never pass a literal. (The API also accepts `?api_key=`,
which is worse: query strings land in proxy logs, browser history and shell
history. Use the header.)

-------------------------------------------------------------------------------
TWO THINGS ABOUT THIS FEED THAT DECIDE WHETHER IT CAN BACKTEST YOUR STRATEGY
-------------------------------------------------------------------------------
1. **Retention is ~60 days** (30 for the HIP-3 tick DB), per the API's own docs.
   Bars are aggregated server-side from stored ticks, so bar history cannot be
   deeper than tick retention. Sixty days is roughly 60 daily bars: enough for a
   handful of confirmed pivots, nowhere near enough for a 180-day level horizon,
   a 365-day walk-forward window, or the 100-trade promotion gate. This feed is
   for live and recent data. For backtest history, use `hyperliquid.py`, which
   reads the exchange's own candle archive.

2. **Volume is frequently `0`.** The docs are explicit: OHLC is valid across the
   full stored history, but `v` is only populated for ticks collected after the
   trade-stream rollout; older bars carry `v = 0` with a valid `n` (number of
   price updates). `volume_from_tick_count=True` substitutes `n`, which is a
   *activity* proxy and not traded volume. Either way, do not run the breakout
   volume filter (`require_volume`) on this feed without checking
   `CandleParseReport.volume_is_usable` first — a filter comparing zeros to
   zeros silently rejects everything, or silently passes everything.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from breakout.data.loaders import MarketData
from breakout.types import Bar

from .candles import CandleParseReport, parse_candles
from .http import FeedError, HttpClient

BASE_URL = "https://api.moondev.com"
API_KEY_ENV = "MOONDEV_API_KEY"
INTERVALS = ("1m", "5m", "15m", "1h", "4h", "1d")
DOCUMENTED_RETENTION_DAYS = 60


@dataclass
class MoonDevFeed:
    api_key: str | None = None
    base_url: str = BASE_URL
    timeout: float = 30.0
    tz: str = "UTC"

    def __post_init__(self) -> None:
        key = self.api_key or os.environ.get(API_KEY_ENV)
        if not key:
            raise FeedError(
                f"no API key: set {API_KEY_ENV} in the environment (or a .env you do "
                f"not commit). Get one at https://moondev.com"
            )
        self._http = HttpClient(
            base_url=self.base_url,
            headers={"X-API-Key": key},
            timeout=self.timeout,
        )

    # ------------------------------------------------------------- discovery
    def health(self) -> dict:
        """Unauthenticated liveness check — use it to separate 'key is wrong'
        from 'service is down' before you go debugging your own code."""
        return HttpClient(base_url=self.base_url, timeout=self.timeout).get("/health")

    def symbols(self) -> list[str]:
        payload = self._http.get("/api/candles/symbols")
        if isinstance(payload, dict):
            found = payload.get("symbols")
            if isinstance(found, list):
                return [str(s) for s in found]
        return []

    # ----------------------------------------------------------------- bars
    def candles(
        self,
        symbol: str,
        interval: str = "1h",
        start: datetime | None = None,
        end: datetime | None = None,
        volume_from_tick_count: bool = False,
    ) -> tuple[list[Bar], CandleParseReport]:
        if interval not in INTERVALS:
            raise FeedError(f"interval must be one of {INTERVALS}, got {interval!r}")
        payload = self._http.get(
            f"/api/candles/{symbol.upper()}",
            {
                "interval": interval,
                "startTime": _ms(start),
                "endTime": _ms(end),
            },
        )
        return parse_candles(payload, tz=self.tz, volume_from_tick_count=volume_from_tick_count)

    def bars_endpoint(
        self,
        symbol: str,
        interval: str = "1h",
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int | None = None,
    ) -> tuple[list[Bar], CandleParseReport]:
        """The `/api/bars/{symbol}` variant. Same shape, different aggregation path."""
        payload = self._http.get(
            f"/api/bars/{symbol.upper()}",
            {"interval": interval, "startTime": _ms(start), "endTime": _ms(end), "limit": limit},
        )
        return parse_candles(payload, tz=self.tz)

    def market_data(
        self,
        symbol: str,
        days: int = DOCUMENTED_RETENTION_DAYS,
        interval: str = "1h",
        volume_from_tick_count: bool = False,
        session_close: str = "00:00",
    ) -> tuple[MarketData, CandleParseReport]:
        """Everything the feed will give us, as engine-ready ``MarketData``.

        Daily bars are derived from the intraday series rather than fetched, so
        each daily bar is complete at exactly the moment the engine may first
        see it. Crypto trades 24/7, hence the 00:00 UTC session close.
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        bars, report = self.candles(symbol, interval, start, end, volume_from_tick_count)
        data = MarketData.build(bars, tz=self.tz, session_close=session_close)
        return data, report


def _ms(dt: datetime | None) -> int | None:
    return None if dt is None else int(dt.timestamp() * 1000)
