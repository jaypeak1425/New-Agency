"""The §7 fill model: pessimism where the data is ambiguous."""

from __future__ import annotations

import pytest

from breakout.config import Config
from breakout.engine.broker import FillKind, SimBroker
from breakout.orders.intents import IntentKind, OrderIntent
from breakout.types import Direction

from conftest import bar


def place(broker: SimBroker, limit: float, ts, stop=None, target=None, qty=100.0,
          direction=Direction.LONG) -> None:
    broker.submit(
        OrderIntent(
            kind=IntentKind.PLACE_LIMIT, ts=ts, trade_id=1, leg_index=0,
            direction=direction, price=limit, qty=qty,
            attached_stop=stop, attached_target=target,
        )
    )


def test_limit_needs_the_bar_to_trade_through_it():
    cfg = Config(optimistic_fills=False, commission_bps=0.0)
    broker = SimBroker(cfg)
    touch = bar(0, 103, 103.5, 102.0, 103)   # low is exactly the limit
    place(broker, 102.0, touch.ts)
    assert broker.on_bar(touch, 0) == []

    through = bar(1, 103, 103.5, 101.99, 103)
    assert [f.kind for f in broker.on_bar(through, 1)] == [FillKind.ENTRY]


def test_optimistic_fills_accept_the_touch():
    cfg = Config(optimistic_fills=True, commission_bps=0.0)
    broker = SimBroker(cfg)
    touch = bar(0, 103, 103.5, 102.0, 103)
    place(broker, 102.0, touch.ts)
    fills = broker.on_bar(touch, 0)
    assert [f.kind for f in fills] == [FillKind.ENTRY]
    assert fills[0].price == 102.0


def test_a_gap_through_the_limit_fills_at_the_open_not_the_limit():
    broker = SimBroker(Config(commission_bps=0.0))
    gap = bar(0, 101.0, 101.5, 100.5, 101.2)   # opened below a 102 limit
    place(broker, 102.0, gap.ts)
    fill = broker.on_bar(gap, 0)[0]
    assert fill.price == 101.0


def test_entry_and_stop_in_one_bar_resolves_as_stopped():
    """The bar's low reaches both the limit and the stop. We cannot know the
    order, so we assume the worst: filled, then stopped."""
    cfg = Config(commission_bps=0.0, slippage_bps=0.0)
    broker = SimBroker(cfg)
    b = bar(0, 103, 103.2, 99.0, 100.0)
    place(broker, 102.0, b.ts, stop=99.5)
    kinds = [f.kind for f in broker.on_bar(b, 0)]
    assert kinds == [FillKind.ENTRY, FillKind.STOP]


def test_stop_and_target_in_one_bar_resolves_as_stopped():
    cfg = Config(commission_bps=0.0, slippage_bps=0.0)
    broker = SimBroker(cfg)
    entry_bar = bar(0, 103, 103.2, 101.5, 102.5)
    place(broker, 102.0, entry_bar.ts, stop=99.5, target=110.0)
    assert [f.kind for f in broker.on_bar(entry_bar, 0)] == [FillKind.ENTRY]

    both = bar(1, 102.5, 111.0, 99.0, 105.0)   # hits target AND stop
    fills = broker.on_bar(both, 1)
    assert [f.kind for f in fills] == [FillKind.STOP]


def test_target_alone_fills_at_the_target():
    cfg = Config(commission_bps=0.0, slippage_bps=0.0)
    broker = SimBroker(cfg)
    entry_bar = bar(0, 103, 103.2, 101.5, 102.5)
    place(broker, 102.0, entry_bar.ts, stop=99.5, target=110.0)
    broker.on_bar(entry_bar, 0)
    fills = broker.on_bar(bar(1, 103, 110.5, 102.5, 110.2), 1)
    assert [f.kind for f in fills] == [FillKind.TARGET]
    assert fills[0].price == 110.0


def test_stop_fill_takes_adverse_slippage_and_gap_risk():
    cfg = Config(commission_bps=0.0, slippage_bps=10.0)
    broker = SimBroker(cfg)
    entry_bar = bar(0, 103, 103.2, 101.5, 102.5)
    place(broker, 102.0, entry_bar.ts, stop=99.5)
    broker.on_bar(entry_bar, 0)
    gapped = bar(1, 97.0, 98.0, 96.0, 97.5)     # opened below the stop
    fill = broker.on_bar(gapped, 1)[0]
    assert fill.price == pytest.approx(97.0 * (1 - 10.0 / 10_000))


def test_market_exit_executes_at_the_next_open_not_the_decided_close():
    cfg = Config(commission_bps=0.0, slippage_bps=0.0)
    broker = SimBroker(cfg)
    entry_bar = bar(0, 103, 103.2, 101.5, 102.5)
    place(broker, 102.0, entry_bar.ts, stop=90.0)
    broker.on_bar(entry_bar, 0)

    broker.submit(OrderIntent(kind=IntentKind.EXIT_MARKET, ts=entry_bar.ts, trade_id=1,
                              leg_index=0, direction=Direction.LONG, reason="invalidation"))
    nxt = bar(1, 99.0, 99.5, 98.0, 98.5)
    fills = broker.on_bar(nxt, 1)
    assert [f.kind for f in fills] == [FillKind.MARKET]
    assert fills[0].price == 99.0     # the open, not 102.5 and not 98.5


def test_cancel_removes_a_resting_entry():
    broker = SimBroker(Config())
    b = bar(0, 103, 103.5, 100.0, 103)
    place(broker, 102.0, b.ts)
    broker.submit(OrderIntent(kind=IntentKind.CANCEL, ts=b.ts, trade_id=1, leg_index=0,
                              direction=Direction.LONG))
    assert broker.on_bar(b, 0) == []


def test_replace_stop_moves_the_resting_stop():
    cfg = Config(commission_bps=0.0, slippage_bps=0.0)
    broker = SimBroker(cfg)
    entry_bar = bar(0, 103, 103.2, 101.5, 102.5)
    place(broker, 102.0, entry_bar.ts, stop=95.0)
    broker.on_bar(entry_bar, 0)
    broker.submit(OrderIntent(kind=IntentKind.REPLACE_STOP, ts=entry_bar.ts, trade_id=1,
                              leg_index=0, direction=Direction.LONG, price=101.0))
    fills = broker.on_bar(bar(1, 102.5, 103.0, 100.5, 101.5), 1)
    assert [f.kind for f in fills] == [FillKind.STOP]
    assert fills[0].price == 101.0


def test_short_entry_needs_the_bar_to_trade_up_through_the_limit():
    cfg = Config(direction=Direction.SHORT, commission_bps=0.0)
    broker = SimBroker(cfg)
    touch = bar(0, 97, 98.0, 96.5, 97.5)
    place(broker, 98.0, touch.ts, direction=Direction.SHORT)
    assert broker.on_bar(touch, 0) == []
    assert [f.kind for f in broker.on_bar(bar(1, 97, 98.01, 96.5, 97.5), 1)] == [FillKind.ENTRY]


def test_commission_is_charged_on_notional():
    cfg = Config(commission_bps=2.0)
    broker = SimBroker(cfg)
    b = bar(0, 103, 103.5, 101.0, 103)
    place(broker, 102.0, b.ts, qty=50.0)
    fill = broker.on_bar(b, 0)[0]
    assert fill.commission == pytest.approx(102.0 * 50.0 * 2.0 / 10_000)
