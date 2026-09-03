"""Does this data source have enough history to backtest the strategy?

Answering that with numbers, before you spend a week on a backtest that was
never going to have a sample, is the whole point of this module. It is the
first thing to run against any new feed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta

from breakout.config import Config
from breakout.data.loaders import MarketData

from .candles import CandleParseReport

# Rough hours-per-day by market. Crypto is the only 24/7 one.
HOURS_PER_DAY = {"crypto": 24.0, "futures": 23.0, "equities": 6.5}


@dataclass(frozen=True)
class Verdict:
    requirement: str
    needed: float
    have: float
    unit: str
    blocking: bool

    @property
    def ok(self) -> bool:
        return self.have >= self.needed

    def __str__(self) -> str:
        mark = "ok  " if self.ok else ("FAIL" if self.blocking else "warn")
        return f"[{mark}] {self.requirement:<44} need {self.needed:>8,.0f}  have {self.have:>8,.0f} {self.unit}"


@dataclass
class Coverage:
    source: str
    symbol: str
    interval: str
    hourly_bars: int
    daily_bars: int
    first_ts: object = None
    last_ts: object = None
    span_days: float = 0.0
    missing_bars: int = 0
    largest_gap_bars: int = 0
    volume_usable: bool = False
    zero_volume_bars: int = 0
    verdicts: list[Verdict] = field(default_factory=list)

    @property
    def blocking_failures(self) -> list[Verdict]:
        return [v for v in self.verdicts if v.blocking and not v.ok]

    def report(self) -> str:
        lines = [
            f"--- data coverage: {self.symbol} {self.interval} via {self.source} ---",
            f"bars            {self.hourly_bars:,} intraday / {self.daily_bars:,} daily",
            f"range           {self.first_ts} -> {self.last_ts}  ({self.span_days:.1f} days)",
            f"gaps            {self.missing_bars:,} missing bars, largest run {self.largest_gap_bars}"
            f"   (counted against a continuous series; for a non-24/7 market most of"
            f" these are session breaks, not holes)",
            f"volume          {'usable' if self.volume_usable else 'NOT USABLE'} "
            f"({self.zero_volume_bars:,} bars report zero)",
            "",
        ]
        lines += [str(v) for v in self.verdicts]
        lines.append("")
        failures = self.blocking_failures
        if failures:
            lines.append(
                f"VERDICT: this feed cannot backtest the strategy as configured — "
                f"{len(failures)} blocking shortfall(s) above."
            )
        else:
            lines.append("VERDICT: enough history to run the backtest. Sample size is a separate question.")
        if not self.volume_usable:
            lines.append(
                "NOTE: leave require_volume=False. A volume filter on a feed that "
                "reports zeros rejects everything or passes everything — neither is a filter."
            )
        return "\n".join(lines)


def measure_gaps(data: MarketData, interval_minutes: int) -> tuple[int, int]:
    """Count missing intraday bars, and the longest consecutive run of them."""
    bars = data.hourly
    if len(bars) < 2:
        return 0, 0
    step = timedelta(minutes=interval_minutes)
    missing = 0
    largest = 0
    for prev, cur in zip(bars, bars[1:]):
        gap = int((cur.ts - prev.ts) / step) - 1
        if gap > 0:
            missing += gap
            largest = max(largest, gap)
    return missing, largest


def assess(
    data: MarketData,
    cfg: Config,
    source: str,
    symbol: str,
    interval: str = "1h",
    interval_minutes: int = 60,
    parse_report: CandleParseReport | None = None,
    market: str = "crypto",
    train_days: int = 365,
    test_days: int = 90,
    holdout_pct: float = 0.20,
) -> Coverage:
    """Measure what arrived and judge it against what the strategy needs."""
    hourly, daily = data.hourly, data.daily
    span_days = (hourly[-1].ts - hourly[0].ts).total_seconds() / 86400.0 if len(hourly) > 1 else 0.0
    missing, largest = measure_gaps(data, interval_minutes)

    volume_usable = bool(parse_report.volume_is_usable) if parse_report else any(b.volume > 0 for b in hourly)
    zero_volume = parse_report.zero_volume if parse_report else sum(1 for b in hourly if b.volume <= 0)

    bars_per_day = HOURS_PER_DAY.get(market, 24.0) * 60.0 / interval_minutes
    walkforward_days = (train_days + test_days) / (1.0 - holdout_pct)

    verdicts = [
        Verdict("daily bars to confirm one pivot",
                2 * cfg.pivot_lookback + 1, len(daily), "bars", blocking=True),
        Verdict("daily bars for a usable level book",
                8 * cfg.pivot_lookback, len(daily), "bars", blocking=True),
        Verdict("intraday bars to warm the ATR",
                cfg.atr_period + 2, len(hourly), "bars", blocking=True),
        Verdict("days for the level age horizon to bind",
                cfg.max_level_age_days, span_days, "days", blocking=False),
        Verdict("days for one walk-forward fold + holdout",
                walkforward_days, span_days, "days", blocking=False),
        Verdict("intraday bars for the compression percentile",
                cfg.compression_history_bars, len(hourly), "bars",
                blocking=cfg.require_compression),
        Verdict("intraday bars for the volume benchmark",
                cfg.vol_lookback + 1, len(hourly), "bars", blocking=cfg.require_volume),
    ]

    return Coverage(
        source=source,
        symbol=symbol,
        interval=interval,
        hourly_bars=len(hourly),
        daily_bars=len(daily),
        first_ts=hourly[0].ts.isoformat() if hourly else None,
        last_ts=hourly[-1].ts.isoformat() if hourly else None,
        span_days=span_days,
        missing_bars=missing,
        largest_gap_bars=largest,
        volume_usable=volume_usable,
        zero_volume_bars=zero_volume,
        verdicts=verdicts,
    )
