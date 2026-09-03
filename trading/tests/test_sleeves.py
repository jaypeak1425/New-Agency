"""The sleeve contract, the breakout adapter, and the allocation layer."""

from __future__ import annotations

import pytest

from breakout.config import Config
from breakout.data import MarketData
from breakout.data.synthetic import SyntheticSpec, make_hourly
from breakout.orders.intents import IntentKind
from core.portfolio import (
    Allocation,
    RegimeGate,
    allocate,
    correlation_penalty,
    ewma_covariance,
    normalised_weights,
    performance_multiplier,
    portfolio_volatility,
    shrink_to_constant_correlation,
    vol_target_scalar,
)
from core.sleeves import BreakoutRetestSleeve, MarketContext, Sleeve, registry


def ctx_for(bar, equity=100_000.0, timeframe="1h", asset_class="crypto", posterior=None):
    return MarketContext(
        symbol="BTC", asset_class=asset_class, timeframe=timeframe,
        bar=bar, equity=equity, regime_posterior=posterior or {},
    )


# ------------------------------------------------------------- the contract
def test_the_breakout_sleeve_satisfies_the_protocol():
    assert isinstance(BreakoutRetestSleeve(), Sleeve)


def test_the_sleeve_registers_itself():
    assert "breakout_retest" in registry()


def test_timeframes_below_the_minimum_are_refused():
    """Latency, not preference: below 15m the webhook cost eats the edge."""
    s = BreakoutRetestSleeve()
    assert s.timeframe_ok("1h") and s.timeframe_ok("4h") and s.timeframe_ok("15m")
    assert not s.timeframe_ok("5m") and not s.timeframe_ok("1m")


def test_an_ineligible_context_produces_no_signals_and_says_why():
    s = BreakoutRetestSleeve()
    bar = make_hourly(SyntheticSpec(days=3))[0]
    fast = ctx_for(bar, timeframe="1m")
    assert s.signals(fast) == []
    assert "faster than" in s.why_ineligible(fast)


def test_an_absent_regime_engine_does_not_silently_switch_the_sleeve_off():
    """A flat system is the hardest bug to notice, so no posterior means 1.0."""
    s = BreakoutRetestSleeve()
    assert s.regime_weight({}) == 1.0
    assert s.arming_weight({}) == 1.0


def test_regime_weight_sums_only_the_sleeve_s_own_states():
    s = BreakoutRetestSleeve()
    posterior = {1: 0.3, 2: 0.1, 3: 0.2, 4: 0.3, 5: 0.1}
    assert s.regime_weight(posterior) == pytest.approx(0.5)      # states 1,2,5
    assert s.arming_weight(posterior) == pytest.approx(0.1)      # state 5 only


# -------------------------------------------------------------- the adapter
def test_the_adapter_emits_the_engine_s_intents_bar_by_bar():
    data = MarketData.build(make_hourly(SyntheticSpec(days=420)))
    sleeve = BreakoutRetestSleeve(Config())
    collected = []
    for kind, bar in data.events():
        if kind == "daily":
            sleeve.on_daily_bar(bar)
        else:
            collected.extend(sleeve.signals(ctx_for(bar)))

    assert collected, "the adapter produced no intents at all"
    assert any(i.kind is IntentKind.PLACE_LIMIT for i in collected)
    # One copy of the logic: the adapter's output is exactly the engine's.
    assert len(collected) == len(sleeve.engine.broker.intents)


def test_risk_units_report_open_risk_as_a_fraction_of_equity():
    data = MarketData.build(make_hourly(SyntheticSpec(days=420)))
    sleeve = BreakoutRetestSleeve(Config())
    seen_open = False
    for kind, bar in data.events():
        if kind == "daily":
            sleeve.on_daily_bar(bar)
            continue
        c = ctx_for(bar)
        sleeve.signals(c)
        units = sleeve.risk_units(c)
        assert 0.0 <= units < 0.5
        seen_open = seen_open or units > 0
    assert seen_open, "no position was ever open, so risk_units proved nothing"


def test_risk_units_are_zero_on_a_zero_equity_context():
    sleeve = BreakoutRetestSleeve()
    bar = make_hourly(SyntheticSpec(days=3))[0]
    assert sleeve.risk_units(ctx_for(bar, equity=0.0)) == 0.0


# ------------------------------------------------------------- regime gate
def test_the_gate_needs_confirmation_before_entering_a_regime():
    gate = RegimeGate(enter_above=0.65, leave_below=0.40, confirm_bars=3)
    assert gate.update({1: 0.9, 2: 0.1}) is None      # 1 bar
    assert gate.update({1: 0.9, 2: 0.1}) is None      # 2 bars
    assert gate.update({1: 0.9, 2: 0.1}) == 1         # confirmed


def test_a_single_flicker_does_not_move_the_gate():
    """The whole point: flickering regimes destroy Sharpe through turnover."""
    gate = RegimeGate(confirm_bars=3)
    for _ in range(3):
        gate.update({1: 0.9})
    assert gate.current == 1

    gate.update({2: 0.95, 1: 0.05})       # one loud contrary bar
    assert gate.current == 1
    gate.update({1: 0.9})                 # and back
    assert gate.current == 1


def test_leaving_requires_the_current_regime_to_fall_below_the_exit_threshold():
    gate = RegimeGate(enter_above=0.65, leave_below=0.40, confirm_bars=2)
    for _ in range(2):
        gate.update({1: 0.9})
    assert gate.current == 1

    # Ambiguous: 1 has weakened but not below 0.40, and nothing else is strong.
    for _ in range(5):
        gate.update({1: 0.5, 2: 0.5})
    assert gate.current == 1

    for _ in range(2):
        gate.update({1: 0.05, 2: 0.95})
    assert gate.current == 2


def test_every_transition_is_logged_with_the_posterior_that_caused_it():
    gate = RegimeGate(confirm_bars=1)
    gate.update({4: 0.9}, ts="t0")
    assert len(gate.transitions) == 1
    ts, previous, new, posterior = gate.transitions[0]
    assert (ts, previous, new) == ("t0", None, 4)
    assert posterior == {4: 0.9}


def test_an_empty_posterior_leaves_the_gate_where_it_was():
    gate = RegimeGate(confirm_bars=1)
    gate.update({1: 0.9})
    assert gate.update({}) == 1


# -------------------------------------------------------------- allocation
def test_the_weight_formula_multiplies_its_four_factors():
    a = Allocation("s", base=0.4, regime=0.5, performance=1.2, correlation=0.8)
    assert a.raw == pytest.approx(0.4 * 0.5 * 1.2 * 0.8)


def test_performance_multiplier_is_bounded_both_ways():
    """Mild adaptation, not a momentum bet on your own sleeves."""
    assert performance_multiplier([0.05] * 50) <= 1.5
    assert performance_multiplier([-0.05] * 50) >= 0.5
    assert performance_multiplier([]) == 1.0
    assert performance_multiplier([0.01, 0.01]) == 1.0        # too few to judge


def test_correlated_sleeves_are_penalised_and_independent_ones_are_not():
    trend = [0.01, -0.02, 0.03, -0.01, 0.02, 0.01, -0.03]
    duplicate = [x * 1.01 for x in trend]
    independent = [-0.02, 0.03, -0.01, 0.02, -0.03, 0.01, 0.02]

    twins = correlation_penalty("a", {"a": trend, "b": duplicate})
    mixed = correlation_penalty("a", {"a": trend, "b": independent})
    assert twins < mixed <= 1.0
    assert twins == pytest.approx(0.5, abs=0.02)              # perfectly duplicated
    assert correlation_penalty("a", {"a": trend}) == 1.0      # nothing to duplicate


def test_allocate_exposes_the_factors_not_just_the_product():
    allocations = allocate(
        {"trend": 0.4, "carry": 0.6},
        regime_weights={"trend": 0.5, "carry": 1.0},
    )
    assert allocations["trend"].regime == 0.5
    assert allocations["trend"].raw == pytest.approx(0.4 * 0.5)
    weights = normalised_weights(allocations)
    assert sum(weights.values()) == pytest.approx(1.0)
    assert weights["carry"] > weights["trend"]


def test_normalised_weights_survive_everything_being_switched_off():
    off = allocate({"a": 1.0}, regime_weights={"a": 0.0})
    assert normalised_weights(off) == {"a": 0.0}


# --------------------------------------------------------- vol targeting
def test_portfolio_vol_accounts_for_correlation_not_just_the_parts():
    """Two anticorrelated sleeves are calmer together than either alone —
    which the weighted sum of individual vols cannot express."""
    cov_hedged = [[0.0004, -0.00039], [-0.00039, 0.0004]]
    cov_same = [[0.0004, 0.0004], [0.0004, 0.0004]]
    w = [0.5, 0.5]
    assert portfolio_volatility(w, cov_hedged) < portfolio_volatility(w, cov_same)


def test_ewma_covariance_weights_recent_observations_more():
    calm_then_wild = {"a": [0.001] * 100 + [0.05, -0.05] * 20}
    names, cov = ewma_covariance(calm_then_wild, halflife=10.0)
    _, slow = ewma_covariance(calm_then_wild, halflife=200.0)
    assert names == ["a"]
    assert cov[0][0] > slow[0][0]


def test_shrinkage_pulls_the_off_diagonals_toward_the_average_correlation():
    cov = [[0.04, 0.039, 0.0], [0.039, 0.04, 0.0], [0.0, 0.0, 0.04]]
    shrunk = shrink_to_constant_correlation(cov, intensity=0.5)
    assert shrunk[0][1] < cov[0][1]        # the extreme pair is pulled in
    assert shrunk[0][2] > cov[0][2]        # the zero pair is pulled up
    assert shrunk[0][0] == pytest.approx(cov[0][0])   # variances untouched


def test_shrinkage_at_zero_and_one_are_the_two_endpoints():
    cov = [[0.04, 0.02], [0.02, 0.09]]
    assert shrink_to_constant_correlation(cov, 0.0) == cov
    full = shrink_to_constant_correlation(cov, 1.0)
    assert full[0][0] == pytest.approx(0.04)


def test_the_vol_scalar_never_demands_extreme_leverage():
    assert vol_target_scalar(0.10, 0.10) == pytest.approx(1.0)
    assert vol_target_scalar(0.10, 0.20) == pytest.approx(0.5)
    assert vol_target_scalar(0.10, 0.001) == 2.0      # clipped, not 100x
    assert vol_target_scalar(0.10, 10.0) == 0.25      # clipped, not ~0
    assert vol_target_scalar(0.10, 0.0) == 0.25       # no forecast, minimum size
