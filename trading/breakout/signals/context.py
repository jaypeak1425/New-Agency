"""Rolling intraday state the signal layer needs.

The context is updated once per closed 1H bar and deliberately exposes both
"as of this bar" values (ATR, used to size the trade at the breakout bar) and
"as of the previous bar" values (the volume benchmark and the compression
rank), so a bar can never be measured against a benchmark it helped create.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..config import Config
from ..indicators import PercentileRank, RealizedVol, RollingMean, WilderATR
from ..types import Bar


@dataclass(frozen=True)
class BarContext:
    bar: Bar
    index: int
    prev_bar: Bar | None
    atr: float | None            # ATR including this bar
    avg_volume: float | None     # mean volume over the bars *before* this one
    vol_rank_before: float | None  # percentile rank of realized vol as of prev bar


class IntradayContext:
    """Owns the 1H indicator set and produces a ``BarContext`` per closed bar."""

    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self._atr = WilderATR(cfg.atr_period)
        self._volume = RollingMean(cfg.vol_lookback)
        self._rvol = RealizedVol(cfg.compression_lookback)
        self._rank = PercentileRank(cfg.compression_history_bars)
        self._index = -1
        self._prev_bar: Bar | None = None
        self._prev_rank: float | None = None

    def update(self, bar: Bar) -> BarContext:
        self._index += 1

        # Snapshot benchmarks formed strictly before this bar.
        avg_volume = self._volume.value
        vol_rank_before = self._prev_rank
        prev_bar = self._prev_bar

        atr = self._atr.update(bar)
        self._volume.update(bar.volume)
        rv = self._rvol.update(bar.close)
        if rv is not None:
            self._prev_rank = self._rank.update(rv)
        self._prev_bar = bar

        return BarContext(
            bar=bar,
            index=self._index,
            prev_bar=prev_bar,
            atr=atr,
            avg_volume=avg_volume,
            vol_rank_before=vol_rank_before,
        )
