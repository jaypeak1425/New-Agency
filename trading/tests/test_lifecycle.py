"""Zone lifecycle: expiry, invalidation, partial fills, trailing, time stop."""

from __future__ import annotations

import pytest

from breakout.config import Config
from breakout.engine.state import CloseReason, ExitReason, TradeStatus

from conftest import armed_engine, bar, flat_bar

# Default zone used throughout: level 100, breakout close 103, ATR 1.0
# => entries at 102.01 (33%) and 101.02 (66%); atr-mode stops 2.5 below each.
BASE = Config(commission_bps=0.0, slippage_bps=0.0, atr_period=2)


def test_zone_arms_with_a_ladder_of_resting_orders():
    engine, trade, _ = armed_engine(BASE)
    assert trade.status is TradeStatus.ARMED
    assert [round(lg.limit_price, 2) for lg in trade.legs] == [102.01, 101.02]
    assert all(lg.resting for lg in trade.legs)
    assert engine.broker.has_resting_entry(trade.id, 0)


def test_expiry_cancels_unfilled_orders_and_closes_the_zone():
    cfg = BASE.with_(zone_expiry_bars=4)
    engine, trade, n = armed_engine(cfg)
    # Price stays above the zone: nothing ever fills.
    for i in range(n, n + 6):
        engine.on_hourly_bar(flat_bar(i, 105.0))
    assert all(lg.cancelled for lg in trade.legs)
    assert trade.status is TradeStatus.CLOSED
    assert trade.close_reason is CloseReason.EXPIRED_UNFILLED
    assert not trade.ever_filled
    assert not engine.broker.has_resting_entry(trade.id, 0)


def test_an_invalidating_bar_fills_the_ladder_on_its_way_down():
    """A bar cannot close back under the level without trading through every
    resting limit in the zone first. So §4's "cancel before any fill" branch is
    unreachable while orders are still resting: by the time the close is judged,
    the ladder has filled. The failed break is still logged — it is just logged
    as a break that filled."""
    engine, trade, n = armed_engine(BASE)
    engine.on_hourly_bar(bar(n, 102.5, 102.6, 99.6, 99.7))
    assert all(lg.filled for lg in trade.legs)
    assert not any(lg.cancelled for lg in trade.legs)
    assert len(engine.failed_breaks) == 1
    assert engine.failed_breaks[0].had_fill is True


def test_the_failed_break_is_logged_once_not_once_per_bar():
    engine, trade, n = armed_engine(BASE)
    for i in range(n, n + 5):
        engine.on_hourly_bar(bar(i, 99.8, 99.9, 99.5, 99.6))
    assert len(engine.failed_breaks) == 1


def test_partial_position_is_exited_when_the_zone_is_invalidated():
    """The reachable partial-fill case: one entry fills, expiry cancels the
    other, and only then does price close back under the level. The half
    position is dumped at market rather than left to its stop."""
    cfg = BASE.with_(zone_expiry_bars=2, max_hold_bars=100)
    engine, trade, n = armed_engine(cfg)

    # Reaches the first entry (102.01) but not the second (101.02).
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 101.5, 102.2))
    assert trade.legs[0].filled and trade.legs[1].resting
    assert trade.status is TradeStatus.OPEN

    engine.on_hourly_bar(flat_bar(n + 1, 102.5))       # zone expires
    assert trade.legs[1].cancelled and not trade.legs[1].filled

    # Closes under the level, with a low that stops short of leg 0's stop (99.51).
    engine.on_hourly_bar(bar(n + 2, 102.0, 102.1, 99.6, 99.7))
    assert trade.legs[0].exit_pending
    assert engine.failed_breaks[0].had_fill is True

    engine.on_hourly_bar(bar(n + 3, 99.8, 100.0, 99.4, 99.5))
    leg = trade.legs[0]
    assert leg.exit_reason is ExitReason.INVALIDATION
    assert leg.exit_price == pytest.approx(99.8)       # the next bar's open
    assert trade.status is TradeStatus.CLOSED
    assert trade.close_reason is CloseReason.COMPLETED


def test_a_fully_filled_zone_is_left_to_its_stops_by_default():
    engine, trade, n = armed_engine(BASE)
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 100.5, 102.0))   # both entries fill
    assert all(lg.filled for lg in trade.legs)
    engine.on_hourly_bar(bar(n + 1, 102.0, 102.1, 99.6, 99.7))  # closes under level
    assert all(lg.open for lg in trade.legs)                    # stops still govern
    assert len(engine.failed_breaks) == 1


def test_exit_full_on_invalidation_can_be_switched_on():
    engine, trade, n = armed_engine(BASE.with_(exit_full_on_invalidation=True))
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 100.5, 102.0))
    engine.on_hourly_bar(bar(n + 1, 102.0, 102.1, 99.6, 99.7))
    assert all(lg.exit_pending for lg in trade.legs)
    engine.on_hourly_bar(bar(n + 2, 99.8, 100.0, 99.4, 99.5))
    assert all(lg.exit_reason is ExitReason.INVALIDATION for lg in trade.legs)


def test_stop_out_closes_the_trade_at_a_loss_of_about_one_r():
    engine, trade, n = armed_engine(BASE)
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 100.5, 102.0))   # both fill
    engine.on_hourly_bar(bar(n + 1, 102.0, 102.2, 98.0, 98.2))  # through both stops
    assert trade.status is TradeStatus.CLOSED
    assert all(lg.exit_reason is ExitReason.STOP for lg in trade.legs)
    assert trade.r_multiple == pytest.approx(-1.0, abs=1e-9)


def test_time_stop_closes_a_trade_that_goes_nowhere():
    cfg = BASE.with_(max_hold_bars=3, zone_expiry_bars=50)
    engine, trade, n = armed_engine(cfg)
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 100.5, 102.0))
    for i in range(n + 1, n + 6):
        engine.on_hourly_bar(flat_bar(i, 102.0))
    assert trade.status is TradeStatus.CLOSED
    assert {lg.exit_reason for lg in trade.legs} == {ExitReason.TIME}
    assert trade.hold_bars == 4


def test_trailing_stop_activates_and_ratchets_but_never_loosens():
    cfg = BASE.with_(trail_activate_r=1.0, trail_atr_mult=1.0, max_hold_bars=100,
                     zone_expiry_bars=100)
    engine, trade, n = armed_engine(cfg)
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 100.5, 102.0))
    leg = trade.legs[0]
    initial_stop = leg.stop_price
    assert not leg.trail_active

    engine.on_hourly_bar(bar(n + 1, 102.0, 106.0, 101.9, 105.5))   # > 1R
    assert leg.trail_active
    raised = leg.stop_price
    assert raised > initial_stop

    engine.on_hourly_bar(bar(n + 2, 105.5, 105.6, 104.0, 104.2))   # pulls back
    # The anchor is the best price *seen*, so it never falls; the stop can only
    # ratchet up (here ATR contracted, which tightens it further).
    assert leg.stop_price >= raised

    tightened = leg.stop_price
    engine.on_hourly_bar(bar(n + 3, 104.2, 110.0, 104.0, 109.8))
    assert leg.stop_price > tightened

    engine.on_hourly_bar(bar(n + 4, 109.8, 109.9, 100.0, 100.5))
    assert leg.exit_reason is ExitReason.TRAIL
    assert trade.r_multiple > 0


def test_orders_armed_on_a_bar_cannot_fill_on_that_same_bar():
    """The zone is armed at the close of the breakout bar, so the bar that
    created it is already spent — even though its low is inside the zone."""
    engine, trade, n = armed_engine(BASE, breakout_close=103.0)
    # The bar that armed the zone had a low of 99.8 (flat_bar at 100), well
    # inside the zone, and must not have filled anything.
    assert not any(lg.filled for lg in trade.legs)


def test_mae_and_mfe_are_recorded_in_r():
    cfg = BASE.with_(max_hold_bars=100, zone_expiry_bars=100)
    engine, trade, n = armed_engine(cfg)
    engine.on_hourly_bar(bar(n, 102.8, 102.9, 100.5, 102.0))
    engine.on_hourly_bar(bar(n + 1, 102.0, 105.0, 101.0, 104.0))
    assert trade.mfe_r > 0
    assert trade.mae_r < 0
    assert trade.mfe_r == pytest.approx(
        (105.0 - trade.avg_entry) / trade.avg_risk_per_share, rel=1e-9
    )


def test_unsizeable_legs_never_rest():
    cfg = BASE.with_(risk_per_trade=1e-12, allow_fractional_qty=False)
    engine, trade, n = armed_engine(cfg)
    assert all(lg.cancelled for lg in trade.legs)
    assert trade.status is TradeStatus.CLOSED
    assert not engine.broker.has_resting_entry(trade.id, 0)
