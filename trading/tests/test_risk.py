"""The risk layer and the operational guards."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from breakout.types import Direction
from core.monitor import Heartbeat, IdempotencyGuard, Reconciliation, StaleDataGuard
from core.risk import (
    Action,
    HaltReason,
    Position,
    ProposedOrder,
    RiskGovernor,
    RiskLimits,
    average_pairwise_correlation,
)

T0 = datetime(2026, 3, 2, 9, 0, tzinfo=timezone.utc)
EQUITY = 100_000.0


def gov(**kw) -> RiskGovernor:
    g = RiskGovernor(RiskLimits(**kw), EQUITY)
    g.observe(EQUITY, T0)
    return g


def order(qty=100.0, price=100.0, stop=95.0, symbol="BTC", asset_class="crypto") -> ProposedOrder:
    return ProposedOrder(symbol, asset_class, Direction.LONG, qty, price, stop)


# ------------------------------------------------------------- basic checks
def test_a_well_sized_order_is_allowed_untouched():
    d = gov().check(order(qty=100.0, price=100.0, stop=95.0))   # risk 500 = 0.5%
    assert d.action is Action.ALLOW and d.qty == pytest.approx(100.0)


def test_risk_per_trade_shrinks_an_oversized_order():
    d = gov().check(order(qty=1000.0, price=100.0, stop=95.0))  # would risk 5%
    assert d.action is Action.REDUCE
    assert d.qty * 5.0 == pytest.approx(EQUITY * 0.005)
    assert any("risk per trade" in r for r in d.reasons)


def test_an_undefined_stop_is_refused_outright():
    d = gov().check(order(stop=100.0))
    assert d.action is Action.REJECT and "undefined risk" in d.reasons[0]


def test_portfolio_heat_caps_the_book_not_just_the_trade():
    g = gov()
    # 11 positions x 520 = 5,720 of open risk against a 6,000 budget: 280 left.
    # Priced low so the notional caps stay slack and heat is what actually binds.
    positions = {f"S{i}": Position(f"S{i}", "crypto", 1_000.0, 520.0) for i in range(11)}
    d = g.check(order(symbol="NEW", qty=1_000.0, price=10.0, stop=9.0), positions)
    assert d.action is Action.REDUCE
    assert d.qty * 1.0 == pytest.approx(280.0)      # heat binds below the 500 risk-per-trade cap

    full = {f"S{i}": Position(f"S{i}", "crypto", 1_000.0, 520.0) for i in range(12)}
    rejected = g.check(order(symbol="NEW", qty=1_000.0, price=10.0, stop=9.0), full)
    assert rejected.action is Action.REJECT
    assert any("heat" in r for r in rejected.reasons)


def test_per_instrument_notional_cap_binds():
    g = gov()
    existing = {"BTC": Position("BTC", "crypto", 14_000.0, 100.0)}
    d = g.check(order(qty=100.0, price=100.0, stop=99.5), existing)   # wants 10k notional
    assert d.action is Action.REDUCE
    assert d.qty * 100.0 == pytest.approx(1_000.0)                    # only 1k of room


def test_asset_class_cap_binds_across_different_symbols():
    g = gov()
    # 38k of crypto against a 40k class limit leaves 2k, even though no single
    # instrument is near its own 15k cap.
    book = {f"C{i}": Position(f"C{i}", "crypto", 9_500.0, 100.0) for i in range(4)}
    d = g.check(order(symbol="NEW", qty=100.0, price=100.0, stop=99.5), book)
    assert d.action is Action.REDUCE
    assert d.qty * 100.0 == pytest.approx(2_000.0)
    assert g.check(order(symbol="NEW", asset_class="equities", qty=10.0,
                         price=100.0, stop=99.5), book).action is Action.ALLOW


def test_gross_leverage_cap_is_per_asset_class():
    g = gov()
    book = {f"C{i}": Position(f"C{i}", "crypto", 100_000.0, 100.0) for i in range(3)}
    assert g.check(order(symbol="NEW"), book).action is Action.REJECT


# ------------------------------------------------------- drawdown governor
def bleed(g: RiskGovernor, days: int, daily: float = 0.02) -> float:
    """Lose `daily` per day for `days` days — slowly enough that the daily kill
    switch never fires, which is the only way to reach the drawdown governor."""
    equity = g.equity
    for d in range(1, days + 1):
        g.observe(equity, T0 + timedelta(days=d))              # day opens here
        equity *= 1.0 - daily
        g.observe(equity, T0 + timedelta(days=d, hours=6))     # and drifts down
    return equity


def test_a_slow_bleed_past_ten_percent_halves_the_size():
    g = gov()
    equity = bleed(g, days=6)                                   # ~11.4% total
    assert g.drawdown > 0.10
    assert not g.halted                                         # no single day breached 3%
    assert g.size_multiplier == 0.5

    d = g.check(order(qty=100.0, price=100.0, stop=95.0))
    # The multiplier and the risk budget both shrink, and the budget is measured
    # against *current* equity — so the halving compounds rather than capping at 50.
    assert d.qty == pytest.approx(equity * 0.005 * 0.5 / 5.0)
    assert d.qty < 50.0
    assert any("halved" in r for r in d.reasons)


def test_a_fast_drop_trips_the_daily_kill_switch_before_the_governor():
    """The two mechanisms cover different failure shapes and the fast one wins:
    an 11% day is a kill-switch event, not a resize-to-half event."""
    g = gov()
    g.observe(89_000.0, T0 + timedelta(hours=1))
    assert g.drawdown == pytest.approx(0.11)
    assert g.halt_reason is HaltReason.DAILY_LOSS
    assert g.size_multiplier == 0.0
    assert g.check(order()).action is Action.REJECT


def test_eighteen_percent_drawdown_halts_and_only_a_human_restarts_it():
    g = gov()
    g.observe(80_000.0, T0 + timedelta(hours=1))
    assert g.halt_reason is HaltReason.DRAWDOWN
    assert g.size_multiplier == 0.0
    assert g.check(order()).action is Action.REJECT

    # Time passing does not clear it. That is the point.
    g.observe(81_000.0, T0 + timedelta(days=30))
    assert g.halted

    g.resume(T0 + timedelta(days=30), "reviewed and restarted")
    assert not g.halted
    resumed = g.check(order())
    assert resumed.allowed
    assert resumed.qty == pytest.approx(81_000.0 * 0.005 / 5.0)   # sized off the smaller book


def test_resume_reanchors_the_peak_so_the_halt_does_not_instantly_refire():
    g = gov()
    g.observe(80_000.0, T0 + timedelta(hours=1))
    g.resume(T0 + timedelta(hours=2))
    assert g.peak_equity == pytest.approx(80_000.0)
    assert g.drawdown == 0.0


# --------------------------------------------------------- daily kill switch
def test_three_percent_daily_loss_halts_for_a_day_then_releases():
    g = gov()
    g.observe(96_500.0, T0 + timedelta(hours=2))
    assert g.halt_reason is HaltReason.DAILY_LOSS
    assert g.check(order()).action is Action.REJECT

    g.observe(96_500.0, T0 + timedelta(hours=10))     # still inside the halt window
    assert g.halted

    g.observe(96_500.0, T0 + timedelta(hours=26))     # window expired
    assert not g.halted


def test_the_daily_loss_is_measured_from_the_day_start_not_the_peak():
    g = gov()
    g.observe(120_000.0, T0)
    g.observe(118_000.0, T0 + timedelta(days=1))      # new day: baseline resets
    assert g.day_start_equity == pytest.approx(118_000.0)
    g.observe(116_000.0, T0 + timedelta(days=1, hours=3))
    assert g.day_loss == pytest.approx(2_000.0 / 118_000.0)
    assert not g.halted


# ------------------------------------------------------ correlation override
def test_correlation_override_sizes_the_whole_book_as_one_position():
    g = gov()
    book = {
        "BTC": Position("BTC", "crypto", 8_000.0, 100.0),
        "ETH": Position("ETH", "crypto", 6_000.0, 100.0),
    }
    calm = g.check(order(symbol="SOL", qty=100.0, price=100.0, stop=99.5), book)
    g.set_correlation(0.85)
    panic = g.check(order(symbol="SOL", qty=100.0, price=100.0, stop=99.5), book)

    assert g.correlation_override
    assert panic.qty < calm.qty
    assert panic.qty * 100.0 == pytest.approx(1_000.0)   # 15k cap minus the 14k book
    assert any("single position" in r for r in panic.reasons)


def test_average_pairwise_correlation():
    same = [0.01, -0.02, 0.03, -0.01, 0.02]
    assert average_pairwise_correlation({"a": same, "b": same}) == pytest.approx(1.0)
    assert average_pairwise_correlation({"a": same, "b": [-x for x in same]}) == pytest.approx(-1.0)
    assert average_pairwise_correlation({"a": same}) == 0.0


# ------------------------------------------------------------ operational
def test_heartbeat_alarms_on_silence():
    hb = Heartbeat("tv-bridge", max_silence=timedelta(minutes=5))
    assert hb.check(T0) is not None                    # never seen counts as stale
    hb.ping(T0)
    assert hb.check(T0 + timedelta(minutes=4)) is None
    assert "silent" in hb.check(T0 + timedelta(minutes=6))


def test_stale_data_guard_refuses_an_old_bar():
    guard = StaleDataGuard(timeframe=timedelta(hours=1))
    assert guard.check(T0, T0 + timedelta(minutes=90)) is None
    assert "stale data" in guard.check(T0, T0 + timedelta(hours=3))


def test_duplicate_alerts_are_rejected_once_seen():
    guard = IdempotencyGuard()
    assert guard.accept("BTC-1730390400000", T0)
    assert not guard.accept("BTC-1730390400000", T0)      # TradingView fired twice
    assert guard.accept("BTC-1730394000000", T0)


def test_an_alert_with_no_id_is_refused_rather_than_guessed_at():
    with pytest.raises(ValueError):
        IdempotencyGuard().accept("", T0)


def test_idempotency_horizon_bounds_memory():
    guard = IdempotencyGuard(horizon=3)
    for i in range(5):
        guard.accept(f"id-{i}", T0)
    assert len(guard) == 3
    assert guard.accept("id-0", T0)      # aged out, seen as new


def test_reconciliation_finds_the_dropped_message():
    rec = Reconciliation()
    breaks = rec.compare({"BTC": 1.5, "ETH": 0.0}, {"BTC": 1.5, "ETH": 2.0}, now=T0)
    assert len(breaks) == 1
    assert breaks[0].symbol == "ETH" and breaks[0].delta == pytest.approx(2.0)
    assert "HALT AND INVESTIGATE" in Reconciliation.report(breaks)
    assert Reconciliation.report([]) == "reconciliation: clean"


def test_reconciliation_runs_on_a_timer():
    rec = Reconciliation(every=timedelta(minutes=15))
    assert rec.due(T0)
    rec.compare({}, {}, now=T0)
    assert not rec.due(T0 + timedelta(minutes=5))
    assert rec.due(T0 + timedelta(minutes=20))
