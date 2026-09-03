"""The cost model, and the latency term in particular."""

from __future__ import annotations

import math

import pytest

from breakout.backtest import run_backtest
from breakout.config import Config
from breakout.types import Direction
from core.costs import (
    TRADINGVIEW_LATENCY_SECONDS,
    CostModel,
    entry_exposure,
    latency_report,
)

FREE = CostModel(commission_bps=0.0, half_spread_bps=0.0, slippage_bps=0.0,
                 slippage_vol_coef=0.0, latency_seconds=0.0)


# --------------------------------------------------------------- the pieces
def test_commission_is_charged_on_notional():
    assert CostModel(commission_bps=2.0).commission(100.0, 50.0) == pytest.approx(1.0)


def test_a_resting_limit_pays_none_of_it():
    """Passive fills do not cross the spread, do not pay impact, and a
    late-placed limit is still the same limit when price comes back to it."""
    costs = CostModel.tradingview()
    assert costs.fill_price(100.0, Direction.LONG, aggressive=False, atr=2.0) == 100.0


def test_aggressive_exits_are_filled_adversely_in_both_directions():
    costs = CostModel(commission_bps=0.0, half_spread_bps=5.0, slippage_bps=5.0,
                      slippage_vol_coef=0.0, latency_seconds=0.0)
    long_exit = costs.fill_price(100.0, Direction.LONG, aggressive=True, is_exit=True)
    short_exit = costs.fill_price(100.0, Direction.SHORT, aggressive=True, is_exit=True)
    assert long_exit == pytest.approx(99.9)    # selling out of a long: filled lower
    assert short_exit == pytest.approx(100.1)  # buying back a short: filled higher


def test_slippage_scales_with_volatility():
    quiet = CostModel(slippage_vol_coef=50.0, half_spread_bps=0.0, slippage_bps=0.0,
                      commission_bps=0.0)
    calm = quiet.fill_price(100.0, Direction.LONG, aggressive=True, atr=0.5)
    wild = quiet.fill_price(100.0, Direction.LONG, aggressive=True, atr=5.0)
    assert wild < calm < 100.0


# ------------------------------------------------------------------ latency
def test_latency_cost_follows_the_square_root_of_time():
    """Diffusion scaling: four times the delay costs twice as much."""
    base = CostModel.tradingview(latency_seconds=10.0, bar_seconds=3600.0)
    quad = CostModel.tradingview(latency_seconds=40.0, bar_seconds=3600.0)
    assert quad.latency_move(1.0) == pytest.approx(2.0 * base.latency_move(1.0), rel=1e-9)


def test_the_same_delay_costs_more_on_a_faster_bar():
    slow = latency_report(CostModel.tradingview(bar_seconds=3600.0))
    fast = latency_report(CostModel.tradingview(bar_seconds=60.0))
    assert fast.cost_in_atr > slow.cost_in_atr
    assert fast.cost_in_atr / slow.cost_in_atr == pytest.approx(math.sqrt(60.0), rel=1e-9)


def test_one_hour_bars_survive_the_webhook_and_one_minute_bars_do_not():
    """The architectural claim, asserted rather than assumed: this sleeve is
    viable through a TradingView bridge and a fast mean-reversion one is not."""
    hourly = latency_report(CostModel.tradingview(bar_seconds=3600.0))
    five_min = latency_report(CostModel.tradingview(bar_seconds=300.0))
    assert "DISQUALIFYING" not in hourly.verdict
    assert "DISQUALIFYING" in five_min.verdict


def test_latency_is_zero_cost_when_there_is_no_latency_or_no_atr():
    assert CostModel.tradingview(latency_seconds=0.0).latency_move(2.0) == 0.0
    assert CostModel.tradingview().latency_move(None) == 0.0
    assert CostModel.tradingview().latency_move(0.0) == 0.0


def test_entry_exposure_is_the_share_of_a_bar_the_limit_is_not_yet_resting():
    costs = CostModel.tradingview(bar_seconds=3600.0)
    assert entry_exposure(costs) == pytest.approx(TRADINGVIEW_LATENCY_SECONDS / 3600.0)
    assert entry_exposure(CostModel.tradingview(bar_seconds=10.0)) == 1.0


# ------------------------------------------------------------------ holding
def test_funding_is_always_a_cost_never_a_credit():
    costs = CostModel(funding_bps_per_day=5.0)
    for direction in (Direction.LONG, Direction.SHORT):
        assert costs.holding_cost(10_000.0, 3.0, direction) > 0


def test_funding_scales_with_days_held():
    costs = CostModel(funding_bps_per_day=5.0)
    one = costs.holding_cost(10_000.0, 1.0, Direction.LONG)
    three = costs.holding_cost(10_000.0, 3.0, Direction.LONG)
    assert three == pytest.approx(3.0 * one)
    assert costs.holding_cost(10_000.0, 0.0, Direction.LONG) == 0.0


def test_shorts_additionally_pay_borrow():
    costs = CostModel(funding_bps_per_day=5.0, borrow_bps_per_day=4.0)
    long_cost = costs.holding_cost(10_000.0, 2.0, Direction.LONG)
    short_cost = costs.holding_cost(10_000.0, 2.0, Direction.SHORT)
    assert short_cost > long_cost


# -------------------------------------------------------------- integration
def test_the_default_model_reproduces_the_flat_config_behaviour(synthetic):
    """Passing no cost model must change nothing, or every existing backtest
    silently moves the day this file was added."""
    cfg = Config()
    equivalent = CostModel(
        commission_bps=cfg.commission_bps, half_spread_bps=0.0,
        slippage_bps=cfg.slippage_bps, slippage_vol_coef=0.0, latency_seconds=0.0,
    )
    a = run_backtest(synthetic, cfg).metrics
    b = run_backtest(synthetic, cfg, costs=equivalent).metrics
    assert a.net_pnl == pytest.approx(b.net_pnl)
    assert a.trade_count == b.trade_count


def test_costs_only_ever_reduce_the_result(synthetic):
    cfg = Config()
    free = run_backtest(synthetic, cfg, costs=FREE).metrics
    tv = run_backtest(synthetic, cfg, costs=CostModel.tradingview()).metrics
    stressed = run_backtest(
        synthetic, cfg,
        costs=CostModel.tradingview(half_spread_bps=4.0, slippage_bps=4.0, latency_seconds=70.0),
    ).metrics
    assert free.net_pnl > tv.net_pnl > stressed.net_pnl


def test_perp_funding_shows_up_as_a_real_drag(synthetic):
    cfg = Config()
    dry = run_backtest(synthetic, cfg, costs=CostModel.tradingview()).metrics
    funded = run_backtest(synthetic, cfg, costs=CostModel.tradingview(funding_bps_per_day=3.0)).metrics
    assert funded.commission > dry.commission
    assert funded.net_pnl < dry.net_pnl
