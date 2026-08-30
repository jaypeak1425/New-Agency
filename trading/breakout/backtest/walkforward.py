"""Walk-forward evaluation.

Parameters are chosen on a training window and judged on the window that
follows it, repeatedly, moving forward in time. On top of that sits a holdout
that the walk-forward machinery physically cannot reach: ``walk_forward``
refuses to look at or past ``holdout_start``, and the only way to touch that
data is to call ``evaluate_holdout`` deliberately, once, when you are done.

The objective deliberately punishes small samples. Without that, a grid search
reliably picks the parameter set that found six lucky trades.
"""

from __future__ import annotations

import itertools
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Callable, Iterable, Sequence

from ..config import Config
from ..data.loaders import MarketData
from ..engine.loop import EquityPoint
from ..engine.state import Trade
from . import metrics as metrics_mod
from .runner import BacktestResult, run_backtest

Objective = Callable[[metrics_mod.Metrics], float]


def expand_grid(**axes: Sequence) -> list[dict]:
    """Cartesian product of parameter axes -> list of ``Config.with_`` kwargs."""
    if not axes:
        return [{}]
    keys = list(axes)
    return [dict(zip(keys, combo)) for combo in itertools.product(*(axes[k] for k in keys))]


def sample_penalised_expectancy(min_trades: int = 20) -> Objective:
    """Expectancy scaled by sqrt(n), zeroed below a credible sample size."""

    def objective(m: metrics_mod.Metrics) -> float:
        if m.trade_count < min_trades:
            return float("-inf")
        return m.expectancy_r * math.sqrt(m.trade_count)

    return objective


def equity_curve_from_trades(trades: list[Trade], initial_equity: float) -> list[EquityPoint]:
    """A trade-sequence equity curve, for pooling folds that ran separately."""
    ordered = sorted(
        (t for t in trades if t.ever_filled and t.closed_ts is not None),
        key=lambda t: t.closed_ts,
    )
    equity = initial_equity
    curve = [EquityPoint(ordered[0].armed_ts, 0, equity)] if ordered else []
    for i, trade in enumerate(ordered, start=1):
        equity += trade.net_pnl
        curve.append(EquityPoint(trade.closed_ts, i, equity))
    return curve


@dataclass
class Fold:
    index: int
    train_start: datetime
    train_end: datetime
    test_end: datetime
    best_params: dict
    train_metrics: metrics_mod.Metrics
    test_metrics: metrics_mod.Metrics
    test_trades: list[Trade] = field(default_factory=list)
    candidates: list[tuple[dict, float]] = field(default_factory=list)


@dataclass
class WalkForwardResult:
    folds: list[Fold]
    pooled_metrics: metrics_mod.Metrics
    holdout_start: datetime | None

    def report(self) -> str:
        lines = ["--- walk-forward ---"]
        for f in self.folds:
            lines.append(
                f"fold {f.index}  train {f.train_start:%Y-%m-%d}->{f.train_end:%Y-%m-%d} "
                f"test ->{f.test_end:%Y-%m-%d}  params={f.best_params}  "
                f"IS n={f.train_metrics.trade_count} exp={f.train_metrics.expectancy_r:+.3f}R  "
                f"OOS n={f.test_metrics.trade_count} exp={f.test_metrics.expectancy_r:+.3f}R"
            )
        lines.append("")
        lines.append(metrics_mod.format_report(self.pooled_metrics, "pooled out-of-sample"))
        if self.holdout_start is not None:
            lines.append(
                f"holdout from {self.holdout_start:%Y-%m-%d} was NOT touched by this run."
            )
        return "\n".join(lines)


def walk_forward(
    data: MarketData,
    base: Config,
    grid: Iterable[dict] | None = None,
    train_days: int = 365,
    test_days: int = 90,
    step_days: int | None = None,
    holdout_start: datetime | None = None,
    objective: Objective | None = None,
) -> WalkForwardResult:
    grid = list(grid) if grid is not None else [{}]
    objective = objective or sample_penalised_expectancy()
    step = timedelta(days=step_days if step_days is not None else test_days)
    train_span = timedelta(days=train_days)
    test_span = timedelta(days=test_days)

    if not data.hourly:
        return WalkForwardResult([], metrics_mod.Metrics(), holdout_start)

    first = data.hourly[0].ts
    last = data.hourly[-1].ts
    limit = min(last, holdout_start) if holdout_start is not None else last

    folds: list[Fold] = []
    train_start = first
    index = 0
    while train_start + train_span + test_span <= limit:
        train_end = train_start + train_span
        test_end = min(train_end + test_span, limit)

        train_data = data.slice(end=train_end)
        scored: list[tuple[dict, float, BacktestResult]] = []
        for params in grid:
            result = run_backtest(train_data, base.with_(**params), active_from=train_start)
            scored.append((params, objective(result.metrics), result))
        scored.sort(key=lambda row: row[1], reverse=True)
        best_params, best_score, best_result = scored[0]

        test_data = data.slice(end=test_end)
        test_result = run_backtest(test_data, base.with_(**best_params), active_from=train_end)

        folds.append(
            Fold(
                index=index,
                train_start=train_start,
                train_end=train_end,
                test_end=test_end,
                best_params=best_params,
                train_metrics=best_result.metrics,
                test_metrics=test_result.metrics,
                test_trades=test_result.trades,
                candidates=[(p, s) for p, s, _ in scored],
            )
        )
        index += 1
        train_start = train_start + step

    pooled_trades = [t for f in folds for t in f.test_trades]
    pooled = metrics_mod.compute(
        pooled_trades,
        equity_curve_from_trades(pooled_trades, base.initial_equity),
        base.initial_equity,
    )
    return WalkForwardResult(folds=folds, pooled_metrics=pooled, holdout_start=holdout_start)


def evaluate_holdout(data: MarketData, cfg: Config, holdout_start: datetime) -> BacktestResult:
    """Run once, on data nothing has been fitted to. Spending it twice spends it."""
    return run_backtest(data, cfg, active_from=holdout_start)
