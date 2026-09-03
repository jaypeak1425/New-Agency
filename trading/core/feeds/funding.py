"""Funding-rate history and live snapshots — the input to Sleeve 7.

**Hyperliquid pays funding every hour**, not every eight. Binance and most
centralised venues pay 8-hourly. Annualizing with the wrong interval is an 8x
error (24x365 against 3x365) in the same direction every time, and it makes a
carry book look wildly better or worse than it is — so the interval is a required
field here rather than a default anyone can quietly get wrong.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

# Funding intervals per year, by venue convention.
HOURLY = 24 * 365          # Hyperliquid
EIGHT_HOURLY = 3 * 365     # Binance, Bybit, OKX, most CEX perps


@dataclass(frozen=True)
class FundingPoint:
    """One funding observation.

    ``rate`` is per interval, not annualized. ``premium`` is the perp's premium
    over the index as a fraction — the basis the carry trade is actually long.
    """

    symbol: str
    ts: datetime
    rate: float
    premium: float = 0.0

    def annualized(self, intervals_per_year: float = HOURLY) -> float:
        return self.rate * intervals_per_year


def parse_funding_history(
    payload,
    symbol: str,
    tz: str = "UTC",
) -> list[FundingPoint]:
    """Parse Hyperliquid `fundingHistory` rows.

        {"coin": "BTC", "fundingRate": "0.0000125", "premium": "0.0001",
         "time": 1700000000000}
    """
    zone = ZoneInfo(tz)
    rows = payload if isinstance(payload, list) else []
    out: list[FundingPoint] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        stamp = row.get("time")
        rate = row.get("fundingRate")
        if stamp is None or rate is None:
            continue
        try:
            out.append(
                FundingPoint(
                    symbol=str(row.get("coin") or symbol).upper(),
                    ts=datetime.fromtimestamp(int(stamp) / 1000.0, tz=timezone.utc).astimezone(zone),
                    rate=float(rate),
                    premium=float(row.get("premium") or 0.0),
                )
            )
        except (TypeError, ValueError, OverflowError, OSError):
            continue

    out.sort(key=lambda p: p.ts)
    deduped: list[FundingPoint] = []
    for point in out:
        if deduped and deduped[-1].ts == point.ts:
            deduped[-1] = point
        else:
            deduped.append(point)
    return deduped


@dataclass(frozen=True)
class FundingSnapshot:
    """A live cross-sectional read: every symbol's funding right now."""

    ts: datetime
    rates: dict[str, float]
    prices: dict[str, float]
    open_interest: dict[str, float]
    intervals_per_year: float = HOURLY

    def annualized(self) -> dict[str, float]:
        return {k: v * self.intervals_per_year for k, v in self.rates.items()}

    def ranked(self, top: int = 20) -> list[tuple[str, float]]:
        """Richest funding first — the screen Sleeve 7 runs on."""
        return sorted(self.annualized().items(), key=lambda kv: kv[1], reverse=True)[:top]


def _floats(raw) -> dict[str, float]:
    out: dict[str, float] = {}
    if isinstance(raw, dict):
        for k, v in raw.items():
            try:
                out[str(k).upper()] = float(v)
            except (TypeError, ValueError):
                continue
    return out


def parse_prices_snapshot(payload, intervals_per_year: float = HOURLY) -> FundingSnapshot:
    """Parse the Moon Dev `/api/prices` payload (prices + funding + OI)."""
    data = payload if isinstance(payload, dict) else {}
    stamp = data.get("timestamp")
    try:
        ts = (
            datetime.fromtimestamp(float(stamp) / 1000.0, tz=timezone.utc)
            if isinstance(stamp, (int, float)) or (isinstance(stamp, str) and stamp.isdigit())
            else datetime.now(timezone.utc)
        )
    except (ValueError, OverflowError, OSError):
        ts = datetime.now(timezone.utc)

    return FundingSnapshot(
        ts=ts,
        rates=_floats(data.get("funding_rates")),
        prices=_floats(data.get("prices")),
        open_interest=_floats(data.get("open_interest")),
        intervals_per_year=intervals_per_year,
    )
