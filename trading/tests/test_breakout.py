"""1H breakout detection: it must fire on the first close through, once."""

from __future__ import annotations

from breakout.config import Config
from breakout.levels.lifecycle import Level, LevelStatus
from breakout.signals import IntradayContext, detect, trigger_price
from breakout.types import Direction

from conftest import bar, ohlc_series


def level(price: float = 100.0, touches: int = 2) -> Level:
    from conftest import START

    return Level(
        id=1,
        price=price,
        created_at=START,
        pivot_ts=START,
        member_prices=[price],
        touch_count=touches,
        status=LevelStatus.LIVE,
    )


def run(closes: list[float], cfg: Config, levels=None, eligible=None):
    """Feed a close-series and collect (fired, rejected) per bar index."""
    lv = levels if levels is not None else [level()]
    ctxs = IntradayContext(cfg)
    fired: list[int] = []
    rejected: list[tuple[int, str]] = []
    used = {"n": 0}

    def is_eligible(_level_id: int) -> bool:
        if eligible is not None:
            return eligible(used["n"])
        return used["n"] < cfg.max_arms_per_level

    for b in ohlc_series(closes):
        ctx = ctxs.update(b)
        sigs, rejs = detect(ctx, lv, cfg, is_eligible)
        for _ in sigs:
            fired.append(ctx.index)
            used["n"] += 1
        rejected.extend((ctx.index, r.filter_name) for r in rejs)
    return fired, rejected


def cfg_for(**kw) -> Config:
    defaults = {"atr_period": 2, "vol_lookback": 2}
    defaults.update(kw)
    return Config(**defaults)


def test_fires_on_the_first_close_through_and_not_again():
    closes = [99, 99.5, 101, 102, 103, 104]
    fired, _ = run(closes, cfg_for(max_arms_per_level=5))
    assert fired == [2]


def test_does_not_fire_while_the_prior_bar_was_already_above():
    closes = [101, 102, 103, 104]
    fired, _ = run(closes, cfg_for(max_arms_per_level=5))
    assert fired == []


def test_refires_only_after_price_closes_back_under_the_level():
    closes = [99, 101, 102, 98, 99, 101.5, 102]
    fired, _ = run(closes, cfg_for(max_arms_per_level=5))
    assert fired == [1, 5]


def test_arm_budget_stops_the_refire():
    closes = [99, 101, 102, 98, 99, 101.5, 102]
    fired, _ = run(closes, cfg_for(max_arms_per_level=1))
    assert fired == [1]


def test_break_buffer_must_be_cleared():
    cfg = cfg_for(break_buffer_pct=0.02)          # needs a close above 102.0
    assert trigger_price(100.0, cfg) == 102.0
    assert run([99, 99.5, 101.9], cfg)[0] == []
    assert run([99, 99.5, 102.5], cfg)[0] == [2]


def test_a_close_inside_the_buffer_band_spends_the_first_close_through():
    """Documented consequence of §3: the prior-bar test is against the level,
    so closing between the level and the trigger disarms the next bar."""
    cfg = cfg_for(break_buffer_pct=0.02)
    assert run([99, 101.0, 102.5], cfg)[0] == []
    lenient = cfg_for(break_buffer_pct=0.02, first_close_reference="trigger")
    assert run([99, 101.0, 102.5], lenient)[0] == [2]


def test_body_filter_rejects_and_records_why():
    cfg = cfg_for(require_body=True, min_body_frac=0.9)
    from breakout.signals import IntradayContext

    ctxs = IntradayContext(cfg)
    bars = [bar(0, 99, 99.2, 98.8, 99), bar(1, 99, 106, 98.9, 101)]  # huge upper wick
    out = None
    for b in bars:
        ctx = ctxs.update(b)
        out = detect(ctx, [level()], cfg, lambda _l: True)
    sigs, rejs = out
    assert sigs == []
    assert [r.filter_name for r in rejs] == ["body"]
    assert "body_frac" in rejs[0].detail


def test_volume_filter_uses_the_average_of_prior_bars_only():
    cfg = cfg_for(require_volume=True, vol_mult=1.5, vol_lookback=2)
    from breakout.signals import IntradayContext

    ctxs = IntradayContext(cfg)
    bars = [bar(0, 99, 99.2, 98.8, 99, 1000), bar(1, 99, 99.3, 98.7, 99, 1000)]
    bars.append(bar(2, 99, 101.5, 98.9, 101, 4000))   # 4x the trailing average
    out = None
    for b in bars:
        ctx = ctxs.update(b)
        out = detect(ctx, [level()], cfg, lambda _l: True)
    sigs, rejs = out
    assert len(sigs) == 1 and rejs == []


def test_short_mirror_fires_on_a_close_below_support():
    cfg = cfg_for(direction=Direction.SHORT, max_arms_per_level=5)
    fired, _ = run([101, 100.5, 99, 98], cfg)
    assert fired == [2]
    assert trigger_price(100.0, cfg) == 100.0 * (1 - cfg.break_buffer_pct)


def test_no_signal_before_atr_is_available():
    cfg = cfg_for(atr_period=10, max_arms_per_level=5)
    fired, _ = run([99, 101, 102], cfg)
    assert fired == []
