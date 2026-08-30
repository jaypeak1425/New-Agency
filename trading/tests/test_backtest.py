"""Accounting integrity, metrics, post-mortem logs and walk-forward."""

from __future__ import annotations

from datetime import timedelta

import pytest

from breakout.backtest import (
    evaluate_holdout,
    expand_grid,
    run_backtest,
    summarise_failed_breaks,
    summarise_rejections,
    to_rows,
    walk_forward,
    write_csv,
)
from breakout.backtest.metrics import max_drawdown
from breakout.backtest.walkforward import sample_penalised_expectancy
from breakout.config import Config
from breakout.engine.loop import EquityPoint
from breakout.types import Direction


# ------------------------------------------------------------- accounting
def test_equity_curve_reconciles_with_the_trade_log(synthetic):
    result = run_backtest(synthetic, Config())
    assert result.metrics.trade_count > 0
    ledger = sum(t.net_pnl for t in result.trades)
    assert result.metrics.net_pnl == pytest.approx(ledger, abs=0.01)
    assert result.equity_curve[-1].equity == pytest.approx(
        Config().initial_equity + ledger, abs=0.01
    )


def test_every_zone_ends_closed_and_flat(synthetic):
    from breakout.engine.state import TradeStatus

    result = run_backtest(synthetic, Config())
    assert all(t.status is TradeStatus.CLOSED for t in result.trades)
    assert all(t.open_qty == 0 for t in result.trades)
    assert all(t.close_reason is not None for t in result.trades)


def test_r_multiples_agree_with_dollars_and_risk(synthetic):
    result = run_backtest(synthetic, Config())
    for trade in result.trades:
        if trade.r_multiple is None:
            continue
        assert trade.r_multiple == pytest.approx(trade.net_pnl / trade.risk_dollars, rel=1e-9)


def test_risk_taken_per_trade_tracks_the_budget(synthetic):
    """Each filled ladder should risk about `risk_per_trade` of the equity it
    was armed against — exactly in ATR mode, at most that in structure mode."""
    cfg = Config(max_position_pct=1.0)
    for trade in run_backtest(synthetic, cfg).trades:
        if not trade.ever_filled or any(lg.size_capped for lg in trade.legs):
            continue
        budget = trade.equity_at_arm * cfg.risk_per_trade
        filled_share = sum(cfg.weights[lg.index] for lg in trade.filled_legs)
        assert trade.risk_dollars == pytest.approx(budget * filled_share, rel=1e-6)


def test_shorts_run_the_same_machinery(synthetic):
    result = run_backtest(synthetic, Config(direction=Direction.SHORT))
    assert result.metrics.armed_zones > 0
    for trade in result.trades:
        assert trade.zone.lower < trade.level_price or trade.zone.upper == trade.level_price
        for leg in trade.legs:
            assert leg.planned_stop > leg.limit_price


# ---------------------------------------------------------------- metrics
def test_max_drawdown_measures_peak_to_trough():
    from conftest import START

    curve = [
        EquityPoint(START + timedelta(hours=i), i, e)
        for i, e in enumerate([100.0, 120.0, 90.0, 130.0, 110.0])
    ]
    dollars, fraction = max_drawdown(curve)
    assert dollars == pytest.approx(30.0)
    assert fraction == pytest.approx(0.25)


def test_fill_rate_counts_armed_zones_not_just_trades(synthetic):
    result = run_backtest(synthetic, Config())
    m = result.metrics
    assert m.armed_zones >= m.trade_count
    assert m.fill_rate == pytest.approx(m.trade_count / m.armed_zones, abs=1e-4)


def test_report_leads_with_trade_count_and_warns_on_small_samples(synthetic):
    report = run_backtest(synthetic, Config()).report()
    assert "trades (filled)" in report.splitlines()[1]
    assert "small sample" in report


def test_empty_run_produces_empty_metrics_not_a_crash(synthetic):
    thin = synthetic.slice(end=synthetic.hourly[30].ts)
    result = run_backtest(thin, Config())
    assert result.metrics.trade_count == 0
    assert result.metrics.fill_rate == 0.0
    assert "trades (filled)      0" in result.report()


# ------------------------------------------------------------- postmortem
def test_rejected_signals_record_the_filter_and_what_happened_next(synthetic):
    cfg = Config(require_body=True, min_body_frac=0.85)
    result = run_backtest(synthetic, cfg)
    assert result.rejections, "no signals were rejected; the test proves nothing"
    for outcome in result.rejections:
        assert outcome.filter_name in {"body", "zone_depth", "capacity"}
        assert outcome.path is not None
    summary = summarise_rejections(result.rejections)
    assert "body" in summary
    assert summary["body"]["count"] > 0
    assert "mean_mfe_atr" in summary["body"]


def test_failed_breaks_are_measured_from_the_fade_side(synthetic):
    result = run_backtest(synthetic, Config())
    assert result.failed_breaks, "fixture produced no failed breaks"
    summary = summarise_failed_breaks(result.failed_breaks)
    assert summary["count"] == len(result.failed_breaks)
    for outcome in result.failed_breaks:
        if outcome.fade is None or outcome.continuation is None:
            continue
        # The fade's favourable excursion is the continuation's adverse one.
        assert outcome.fade.mfe_atr == pytest.approx(-outcome.continuation.mae_atr, abs=1e-6)


def test_trade_log_keeps_unfilled_zones(synthetic, tmp_path):
    result = run_backtest(synthetic, Config())
    rows = to_rows(result.trades)
    assert len(rows) == result.metrics.armed_zones
    assert any(r["filled"] == 0 for r in rows) or result.metrics.fill_rate == 1.0
    path = tmp_path / "trades.csv"
    write_csv(str(path), rows)
    assert path.read_text().splitlines()[0].startswith("trade_id,")


# ----------------------------------------------------------- walk-forward
def test_expand_grid_is_a_cartesian_product():
    grid = expand_grid(atr_mult=[2.0, 3.0], stop_mode=["atr", "structure"])
    assert len(grid) == 4
    assert {"atr_mult": 2.0, "stop_mode": "structure"} in grid


def test_objective_refuses_to_reward_tiny_samples():
    from breakout.backtest.metrics import Metrics

    objective = sample_penalised_expectancy(min_trades=20)
    assert objective(Metrics(trade_count=5, expectancy_r=10.0)) == float("-inf")
    assert objective(Metrics(trade_count=25, expectancy_r=0.1)) > 0


def test_walk_forward_selects_per_fold_and_never_touches_the_holdout(synthetic):
    holdout_start = synthetic.hourly[-1].ts - timedelta(days=120)
    grid = expand_grid(stop_mode=["atr", "structure"])
    result = walk_forward(
        synthetic,
        Config(),
        grid=grid,
        train_days=200,
        test_days=100,
        holdout_start=holdout_start,
        objective=lambda m: m.expectancy_r * m.trade_count,
    )
    assert result.folds, "no folds were produced"
    for fold in result.folds:
        assert fold.best_params in grid
        assert fold.test_end <= holdout_start
        assert len(fold.candidates) == len(grid)
        for trade in fold.test_trades:
            assert trade.armed_ts >= fold.train_end
            assert trade.armed_ts < holdout_start
    assert "was NOT touched" in result.report()


def test_holdout_is_a_separate_deliberate_call(synthetic):
    holdout_start = synthetic.hourly[-1].ts - timedelta(days=120)
    result = evaluate_holdout(synthetic, Config(), holdout_start)
    assert all(t.armed_ts >= holdout_start for t in result.trades)
