"""The lookahead audit.

Run the backtest, then re-run it with all future data truncated at each
decision point. The decisions must be identical. If anything in the system
peeks at a bar it has not been shown, the two runs diverge.
"""

from __future__ import annotations

import pytest

from breakout.backtest import lookahead_audit, run_backtest
from breakout.backtest.audit import decision_points, fingerprint
from breakout.config import Config
from breakout.data import MarketData
from breakout.data.synthetic import SyntheticSpec, make_hourly

CONFIGS = {
    "default": Config(),
    "structure_stops": Config(stop_mode="structure"),
    "high_bound": Config(zone_upper="breakout_high"),
    # Loosened thresholds: the strict defaults admit nothing on this fixture,
    # and an audit that runs zero checkpoints proves zero things.
    "all_filters": Config(require_volume=True, require_compression=True, require_body=True,
                          vol_mult=0.8, compression_pctile=70.0, min_body_frac=0.2,
                          compression_history_bars=200),
    "target_and_trail": Config(target_r=2.0, trail_activate_r=0.5),
}


@pytest.mark.parametrize("name", sorted(CONFIGS))
def test_no_decision_uses_data_it_has_not_been_shown(small_synthetic, name):
    result = lookahead_audit(small_synthetic, CONFIGS[name], limit=20)
    assert result.clean, result.report()
    assert result.checkpoints, "audit ran no checkpoints — it proved nothing"


def test_the_audit_actually_catches_a_planted_leak(small_synthetic, monkeypatch):
    """An audit that can only pass proves nothing. Plant a real leak — a level
    book pre-loaded with the whole daily series, so every level is known before
    it has printed — and confirm the audit fails."""
    from types import SimpleNamespace

    from breakout.backtest import audit as audit_mod
    from breakout.engine.loop import Engine

    cfg = Config()
    assert lookahead_audit(small_synthetic, cfg, limit=10).clean, "baseline must be clean"

    def leaky_run(data, config, active_from=None):
        engine = Engine(config, active_from=active_from)
        for daily_bar in data.daily:          # <-- the leak
            engine.book.on_daily_bar(daily_bar)
        for kind, b in data.events():
            if kind == "hourly":
                engine.on_hourly_bar(b)
        engine.finalize()
        return SimpleNamespace(intents=list(engine.broker.intents))

    monkeypatch.setattr(audit_mod, "run_backtest", leaky_run)
    leaked = lookahead_audit(small_synthetic, cfg, limit=10)
    assert leaked.checkpoints, "the leaky run produced no decisions to compare"
    assert not leaked.clean, "the audit failed to notice a level book that sees the future"


def test_truncated_run_is_a_prefix_of_the_full_run(small_synthetic):
    cfg = Config()
    full = [fingerprint(i) for i in run_backtest(small_synthetic, cfg).intents]
    assert full, "fixture produced no orders"
    for cutoff in decision_points(small_synthetic, cfg, limit=8):
        partial = [fingerprint(i) for i in run_backtest(small_synthetic.truncate(cutoff), cfg).intents]
        assert partial == full[: len(partial)]


def test_indicators_never_see_the_bar_they_benchmark(small_synthetic):
    """The volume benchmark and the compression rank must be formed from bars
    strictly before the bar being judged."""
    from breakout.signals import IntradayContext

    cfg = Config(vol_lookback=3, compression_lookback=3, compression_history_bars=20)
    ctxs = IntradayContext(cfg)
    seen: list[float] = []
    for b in small_synthetic.hourly[:60]:
        ctx = ctxs.update(b)
        if ctx.avg_volume is not None:
            # The average must exclude this bar's own volume.
            expected = sum(seen[-cfg.vol_lookback:]) / cfg.vol_lookback
            assert ctx.avg_volume == pytest.approx(expected)
        seen.append(b.volume)


def test_a_zone_never_fills_on_the_bar_that_armed_it(synthetic):
    result = run_backtest(synthetic, Config())
    filled = [t for t in result.trades if t.ever_filled]
    assert filled, "fixture produced no fills"
    assert all(t.first_fill_index > t.armed_index for t in filled)


def test_a_level_is_never_used_before_it_is_confirmed():
    data = MarketData.build(make_hourly(SyntheticSpec(days=260, seed=3)))
    cfg = Config()
    result = run_backtest(data, cfg)
    assert result.trades, "fixture produced no zones"
    for trade in result.trades:
        assert trade.armed_ts >= data.hourly[0].ts
        # armed_index is a 1H index; the level's birth is a daily close that must
        # already have happened when the zone armed.
        assert trade.armed_ts > data.daily[cfg.pivot_lookback].ts
