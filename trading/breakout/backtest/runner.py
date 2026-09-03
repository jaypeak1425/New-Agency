"""Run the engine over a dataset and package everything it learned."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..config import Config
from ..data.loaders import MarketData
from ..engine.loop import Engine, EquityPoint
from ..engine.state import Trade
from ..orders.intents import OrderIntent
from . import metrics as metrics_mod
from .postmortem import (
    FailedBreakOutcome,
    RejectionOutcome,
    enrich_failed_breaks,
    enrich_rejections,
    summarise_failed_breaks,
    summarise_rejections,
)


@dataclass
class BacktestResult:
    config: Config
    trades: list[Trade]
    equity_curve: list[EquityPoint]
    metrics: metrics_mod.Metrics
    rejections: list[RejectionOutcome]
    failed_breaks: list[FailedBreakOutcome]
    intents: list[OrderIntent]

    @property
    def rejection_summary(self) -> dict:
        return summarise_rejections(self.rejections)

    @property
    def failed_break_summary(self) -> dict:
        return summarise_failed_breaks(self.failed_breaks)

    def report(self, title: str = "backtest") -> str:
        parts = [metrics_mod.format_report(self.metrics, title)]
        rej = self.rejection_summary
        if rej:
            parts.append("rejected signals (what the filters gave up):")
            for name, stats in rej.items():
                parts.append(f"  {name:<14} {stats}")
        fb = self.failed_break_summary
        if fb.get("count"):
            parts.append(f"failed breaks (fade candidates): {fb}")
        return "\n".join(parts)


def run_backtest(
    data: MarketData,
    cfg: Config,
    active_from: datetime | None = None,
    costs=None,
) -> BacktestResult:
    engine = Engine(cfg, active_from=active_from, costs=costs)
    engine.run(data)
    hourly = list(data.hourly)
    return BacktestResult(
        config=cfg,
        trades=engine.trades,
        equity_curve=engine.equity_curve,
        metrics=metrics_mod.compute(engine.trades, engine.equity_curve, cfg.initial_equity),
        rejections=enrich_rejections(engine.rejected, hourly, cfg),
        failed_breaks=enrich_failed_breaks(engine.failed_breaks, hourly, cfg),
        intents=list(engine.broker.intents),
    )
