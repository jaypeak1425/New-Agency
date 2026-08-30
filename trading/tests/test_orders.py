"""Zone geometry, stop placement and sizing."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from breakout.config import Config
from breakout.orders import build_zone, size_position, stop_price, target_price, trail_stop_price
from breakout.signals import BreakoutSignal
from breakout.types import Direction

TS = datetime(2024, 1, 2, 12, 0, tzinfo=timezone.utc)


def signal(level=100.0, close=103.0, high=104.0, atr=1.0) -> BreakoutSignal:
    return BreakoutSignal(
        level_id=1, level_price=level, ts=TS, bar_index=10,
        breakout_close=close, breakout_high=high, atr=atr,
    )


# ------------------------------------------------------------------- zone
def test_zone_bounds_are_ordered_and_entries_sit_strictly_inside():
    zone = build_zone(signal(), Config())
    assert zone.lower == 100.0 and zone.upper == 103.0
    assert zone.depth == pytest.approx(3.0)
    for entry in zone.entries:
        assert zone.lower < entry < zone.upper


def test_entries_land_at_the_configured_fractions_of_depth():
    zone = build_zone(signal(), Config(n_entries=2, entry_fractions=(0.25, 0.75)))
    assert zone.entries == pytest.approx((103.0 - 0.75, 103.0 - 2.25))


def test_upper_bound_mode_changes_the_zone():
    close_zone = build_zone(signal(), Config())
    high_zone = build_zone(signal(), Config(zone_upper="breakout_high"))
    assert close_zone.far_bound == 103.0
    assert high_zone.far_bound == 104.0
    assert high_zone.depth > close_zone.depth
    # Measuring depth down from a higher top puts every entry *higher*, which is
    # why breakout_high fills more often — and enters worse. This is the §9
    # trade-off, so it is asserted rather than assumed.
    assert all(h > c for h, c in zip(high_zone.entries, close_zone.entries))


def test_degenerate_zone_is_refused():
    assert build_zone(signal(close=100.01), Config(min_zone_depth_atr=0.05)) is None
    assert build_zone(signal(close=100.01), Config(min_zone_depth_atr=0.0)) is not None


def test_short_zone_mirrors_the_long_one():
    cfg = Config(direction=Direction.SHORT)
    zone = build_zone(signal(level=100.0, close=97.0, high=96.0), cfg)
    assert zone.far_bound == 97.0 and zone.near_bound == 100.0
    assert zone.lower == 97.0 and zone.upper == 100.0
    for entry in zone.entries:
        assert zone.lower < entry < zone.upper


# ------------------------------------------------------------------- stops
def test_structure_stop_sits_strictly_beyond_the_near_bound():
    cfg = Config(stop_mode="structure", structure_buffer_atr=0.5)
    zone = build_zone(signal(), cfg)
    for entry in zone.entries:
        stop = stop_price(entry, zone, cfg, atr=1.0)
        assert stop < zone.lower
        assert stop == pytest.approx(99.5)


def test_structure_stop_is_identical_for_every_entry_atr_stop_is_not():
    zone = build_zone(signal(), Config())
    structure = Config(stop_mode="structure")
    atr_mode = Config(stop_mode="atr")
    struct_stops = {stop_price(e, zone, structure, 1.0) for e in zone.entries}
    atr_stops = {stop_price(e, zone, atr_mode, 1.0) for e in zone.entries}
    assert len(struct_stops) == 1
    assert len(atr_stops) == len(zone.entries)


def test_atr_stop_is_a_fixed_distance_from_the_entry():
    zone = build_zone(signal(), Config())
    cfg = Config(atr_mult=2.5)
    for entry in zone.entries:
        assert stop_price(entry, zone, cfg, 2.0) == pytest.approx(entry - 5.0)


def test_short_stops_sit_above():
    cfg = Config(direction=Direction.SHORT, stop_mode="structure")
    zone = build_zone(signal(level=100.0, close=97.0, high=96.0), cfg)
    for entry in zone.entries:
        stop = stop_price(entry, zone, cfg, 1.0)
        assert stop > zone.upper == 100.0
    atr_cfg = Config(direction=Direction.SHORT, atr_mult=2.0)
    assert stop_price(98.0, zone, atr_cfg, 1.0) == pytest.approx(100.0)


def test_target_is_r_multiples_from_the_entry():
    cfg = Config(target_r=2.0)
    assert target_price(102.0, 100.0, cfg) == pytest.approx(106.0)
    assert target_price(102.0, 100.0, Config()) is None


def test_trailing_stop_hangs_off_the_anchor():
    assert trail_stop_price(110.0, Config(trail_atr_mult=3.0), 2.0) == pytest.approx(104.0)
    short = Config(direction=Direction.SHORT, trail_atr_mult=3.0)
    assert trail_stop_price(90.0, short, 2.0) == pytest.approx(96.0)


# ------------------------------------------------------------------ sizing
@pytest.mark.parametrize("stop_distance", [0.25, 0.5, 1.0, 2.5, 7.0])
def test_dollar_risk_is_constant_across_stop_distances(stop_distance):
    """The point of volatility targeting: the stop distance changes the share
    count, never the money at risk."""
    cfg = Config(risk_per_trade=0.005, max_position_pct=1.0, n_entries=1,
                 entry_fractions=(0.5,))
    equity = 100_000.0
    entry = 10.0   # low enough that the notional cap never binds
    sizing = size_position(equity, entry, entry - stop_distance, cfg)
    assert sizing.risk_dollars == pytest.approx(equity * cfg.risk_per_trade)
    assert sizing.qty == pytest.approx(500.0 / stop_distance)
    assert not sizing.capped


def test_ladder_weights_split_one_risk_budget_not_multiply_it():
    cfg = Config(max_position_pct=1.0, n_entries=2, entry_fractions=(0.33, 0.66))
    equity = 100_000.0
    total = sum(
        size_position(equity, 10.0, 9.7, cfg, w).risk_dollars for w in cfg.weights
    )
    assert total == pytest.approx(equity * cfg.risk_per_trade)


def test_position_cap_binds_and_is_reported():
    cfg = Config(risk_per_trade=0.05, max_position_pct=0.10, n_entries=1,
                 entry_fractions=(0.5,))
    sizing = size_position(100_000.0, 100.0, 99.0, cfg)
    assert sizing.capped
    assert sizing.qty * 100.0 == pytest.approx(10_000.0)
    assert sizing.risk_dollars < sizing.planned_risk


def test_zero_stop_distance_sizes_to_nothing():
    assert size_position(100_000.0, 100.0, 100.0, Config()).qty == 0.0


def test_whole_unit_sizing_rounds_down():
    cfg = Config(allow_fractional_qty=False, max_position_pct=1.0, n_entries=1,
                 entry_fractions=(0.5,))
    sizing = size_position(100_000.0, 100.0, 96.7, cfg)
    assert sizing.qty == float(int(sizing.qty))
    assert sizing.risk_dollars <= sizing.planned_risk
