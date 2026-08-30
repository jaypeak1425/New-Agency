"""The config is the only place a number is allowed to live."""

from __future__ import annotations

import pytest

from breakout.config import Config


def test_defaults_match_the_specification_table():
    cfg = Config()
    assert (cfg.pivot_lookback, cfg.cluster_tol_atr, cfg.min_touches) == (5, 0.5, 2)
    assert (cfg.max_level_age_days, cfg.max_level_distance_atr) == (180, 10.0)
    assert (cfg.break_buffer_pct, cfg.vol_mult, cfg.compression_pctile) == (0.001, 1.5, 25.0)
    assert (cfg.min_body_frac, cfg.n_entries, cfg.entry_fractions) == (0.5, 2, (0.33, 0.66))
    assert (cfg.stop_mode, cfg.atr_mult, cfg.structure_buffer_atr) == ("atr", 2.5, 0.5)
    assert (cfg.atr_period, cfg.zone_expiry_bars) == (14, 12)
    assert (cfg.risk_per_trade, cfg.max_position_pct) == (0.005, 0.15)
    assert (cfg.trail_atr_mult, cfg.trail_activate_r, cfg.max_hold_bars) == (3.0, 1.0, 120)


def test_entry_weights_default_to_equal_and_are_normalised():
    assert Config().weights == (0.5, 0.5)
    cfg = Config(n_entries=3, entry_fractions=(0.2, 0.5, 0.8), entry_weights=(2, 1, 1))
    assert cfg.weights == (0.5, 0.25, 0.25)
    assert sum(cfg.weights) == pytest.approx(1.0)


def test_with_returns_a_copy_and_leaves_the_original_alone():
    base = Config()
    other = base.with_(atr_mult=9.0)
    assert other.atr_mult == 9.0 and base.atr_mult == 2.5
    assert other.weights == base.weights


@pytest.mark.parametrize(
    "kwargs",
    [
        {"n_entries": 3},                              # mismatched fractions
        {"entry_fractions": (0.0, 0.5)},               # not strictly inside
        {"entry_fractions": (0.5, 1.0)},
        {"stop_mode": "vibes"},
        {"zone_upper": "somewhere"},
        {"first_close_reference": "elsewhere"},
        {"risk_per_trade": 0.0},
        {"max_position_pct": 1.5},
        {"compression_pctile": 0.0},
        {"target_r": -1.0},
        {"pivot_lookback": 0},
        {"max_arms_per_level": 0},
        {"max_open_trades": 0},
        {"entry_weights": (1.0, 0.0)},
        {"zone_expiry_bars": 0},
    ],
)
def test_invalid_configuration_is_refused_at_construction(kwargs):
    with pytest.raises(ValueError):
        Config(**kwargs)
