"""Simulated broker — the §7 fill model.

Everything conservative that the spec asks for lives here:

* a limit fills only if the bar *trades through* it (``optimistic_fills``
  relaxes that to a touch);
* when a bar could plausibly have filled the entry and then hit the stop, it
  is assumed to have done both, in that order;
* a stop is a stop-market: it triggers on touch and fills at the stop price,
  or at the open when the bar gapped past it, plus slippage;
* market exits decided at a bar close execute at the *next* bar's open — you
  cannot trade a close you have only just seen.

This is a ``Broker`` adapter like any other. A live adapter implements the same
``submit`` surface against a venue API; nothing above this file changes.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from ..config import Config
from ..orders.intents import IntentKind, OrderIntent
from ..types import Bar, Direction, better_of, worse_of


class FillKind(Enum):
    ENTRY = "entry"
    STOP = "stop"
    TARGET = "target"
    MARKET = "market"


@dataclass(frozen=True)
class Fill:
    trade_id: int
    leg_index: int
    kind: FillKind
    price: float
    qty: float
    ts: datetime
    bar_index: int
    commission: float
    reason: str = ""


@dataclass
class _Entry:
    trade_id: int
    leg_index: int
    direction: Direction
    limit: float
    qty: float
    stop: float | None
    target: float | None


@dataclass
class _Bracket:
    trade_id: int
    leg_index: int
    direction: Direction
    qty: float
    stop: float | None
    target: float | None
    armed_index: int


@dataclass
class _MarketExit:
    trade_id: int
    leg_index: int
    direction: Direction
    qty: float
    reason: str


class SimBroker:
    def __init__(self, cfg: Config, costs=None) -> None:
        self.cfg = cfg
        # A CostModel supersedes the flat bps on Config. Absent one, we build the
        # equivalent flat model so behaviour is byte-identical to not passing one.
        if costs is None:
            from core.costs import CostModel

            costs = CostModel(
                commission_bps=cfg.commission_bps,
                half_spread_bps=0.0,
                slippage_bps=cfg.slippage_bps,
                slippage_vol_coef=0.0,
                latency_seconds=0.0,
            )
        self.costs = costs
        self._atr: float | None = None
        self._entries: dict[tuple[int, int], _Entry] = {}
        self._brackets: dict[tuple[int, int], _Bracket] = {}
        self._pending_exits: list[_MarketExit] = []
        self.intents: list[OrderIntent] = []

    # ------------------------------------------------------------- adapter
    def submit(self, intent: OrderIntent) -> None:
        self.intents.append(intent)
        key = (intent.trade_id, intent.leg_index)
        if intent.kind is IntentKind.PLACE_LIMIT:
            self._entries[key] = _Entry(
                trade_id=intent.trade_id,
                leg_index=intent.leg_index,
                direction=intent.direction,
                limit=float(intent.price),
                qty=float(intent.qty or 0.0),
                stop=intent.attached_stop,
                target=intent.attached_target,
            )
        elif intent.kind is IntentKind.CANCEL:
            self._entries.pop(key, None)
        elif intent.kind in (IntentKind.PLACE_STOP, IntentKind.REPLACE_STOP):
            bracket = self._brackets.get(key)
            if bracket is not None:
                bracket.stop = intent.price
        elif intent.kind is IntentKind.PLACE_TARGET:
            bracket = self._brackets.get(key)
            if bracket is not None:
                bracket.target = intent.price
        elif intent.kind is IntentKind.EXIT_MARKET:
            bracket = self._brackets.pop(key, None)
            if bracket is not None:
                self._pending_exits.append(
                    _MarketExit(
                        trade_id=intent.trade_id,
                        leg_index=intent.leg_index,
                        direction=intent.direction,
                        qty=bracket.qty,
                        reason=intent.reason,
                    )
                )

    # ---------------------------------------------------------- price maths
    def _commission(self, price: float, qty: float) -> float:
        return self.costs.commission(price, qty)

    def _slipped(self, price: float, direction: Direction) -> float:
        """Spread, impact and latency on an aggressive (stop/market) exit."""
        return self.costs.fill_price(
            price, direction, aggressive=True, atr=self._atr, is_exit=True
        )

    def _limit_would_fill(self, limit: float, bar: Bar, direction: Direction) -> bool:
        adverse = bar.extreme(direction, favourable=False)  # low for a long buy
        gap = direction.sign * (limit - adverse)
        return gap >= 0 if self.cfg.optimistic_fills else gap > 0

    def _target_would_fill(self, target: float, bar: Bar, direction: Direction) -> bool:
        favourable = bar.extreme(direction, favourable=True)
        gap = direction.sign * (favourable - target)
        return gap >= 0 if self.cfg.optimistic_fills else gap > 0

    @staticmethod
    def _stop_would_trigger(stop: float, bar: Bar, direction: Direction) -> bool:
        # A resting stop triggers on touch: the market printed there.
        adverse = bar.extreme(direction, favourable=False)
        return direction.sign * (stop - adverse) >= 0

    # --------------------------------------------------------------- engine
    def on_bar(self, bar: Bar, index: int, atr: float | None = None) -> list[Fill]:
        """Resolve everything resting against one closed bar, pessimistically."""
        self._atr = atr
        fills: list[Fill] = []

        # 1. Market exits decided at the previous close hit this bar's open.
        for pending in self._pending_exits:
            price = self._slipped(bar.open, pending.direction)
            fills.append(
                Fill(
                    trade_id=pending.trade_id,
                    leg_index=pending.leg_index,
                    kind=FillKind.MARKET,
                    price=price,
                    qty=pending.qty,
                    ts=bar.ts,
                    bar_index=index,
                    commission=self._commission(price, pending.qty),
                    reason=pending.reason,
                )
            )
        self._pending_exits.clear()

        # 2. Brackets armed before this bar: stop first, then target.
        for key in list(self._brackets):
            bracket = self._brackets[key]
            if bracket.armed_index >= index:
                continue
            fill = self._resolve_bracket(bracket, bar, index)
            if fill is not None:
                fills.append(fill)
                self._brackets.pop(key, None)

        # 3. Resting entries. A leg that fills this bar arms its bracket and is
        #    immediately exposed to it on the same bar — stop first.
        for key in list(self._entries):
            entry = self._entries[key]
            if entry.qty <= 0 or not self._limit_would_fill(entry.limit, bar, entry.direction):
                continue
            price = worse_of(entry.limit, bar.open, entry.direction)  # gap improves the fill
            fills.append(
                Fill(
                    trade_id=entry.trade_id,
                    leg_index=entry.leg_index,
                    kind=FillKind.ENTRY,
                    price=price,
                    qty=entry.qty,
                    ts=bar.ts,
                    bar_index=index,
                    commission=self._commission(price, entry.qty),
                )
            )
            self._entries.pop(key, None)
            bracket = _Bracket(
                trade_id=entry.trade_id,
                leg_index=entry.leg_index,
                direction=entry.direction,
                qty=entry.qty,
                stop=entry.stop,
                target=entry.target,
                armed_index=index,
            )
            self._brackets[key] = bracket
            same_bar = self._resolve_bracket(bracket, bar, index)
            if same_bar is not None:
                fills.append(same_bar)
                self._brackets.pop(key, None)

        return fills

    def _resolve_bracket(self, bracket: _Bracket, bar: Bar, index: int) -> Fill | None:
        if bracket.stop is not None and self._stop_would_trigger(bracket.stop, bar, bracket.direction):
            raw = worse_of(bracket.stop, bar.open, bracket.direction)  # gap fills at the open
            price = self._slipped(raw, bracket.direction)
            return Fill(
                trade_id=bracket.trade_id,
                leg_index=bracket.leg_index,
                kind=FillKind.STOP,
                price=price,
                qty=bracket.qty,
                ts=bar.ts,
                bar_index=index,
                commission=self._commission(price, bracket.qty),
            )
        if bracket.target is not None and self._target_would_fill(bracket.target, bar, bracket.direction):
            price = better_of(bracket.target, bar.open, bracket.direction)
            return Fill(
                trade_id=bracket.trade_id,
                leg_index=bracket.leg_index,
                kind=FillKind.TARGET,
                price=price,
                qty=bracket.qty,
                ts=bar.ts,
                bar_index=index,
                commission=self._commission(price, bracket.qty),
            )
        return None

    # ------------------------------------------------------------ teardown
    def force_close_all(self, bar: Bar, index: int, atr: float | None = None) -> list[Fill]:
        """End of data: mark every open leg out at the final close."""
        if atr is not None:
            self._atr = atr
        fills: list[Fill] = []
        for key in list(self._brackets):
            bracket = self._brackets.pop(key)
            price = self._slipped(bar.close, bracket.direction)
            fills.append(
                Fill(
                    trade_id=bracket.trade_id,
                    leg_index=bracket.leg_index,
                    kind=FillKind.MARKET,
                    price=price,
                    qty=bracket.qty,
                    ts=bar.ts,
                    bar_index=index,
                    commission=self._commission(price, bracket.qty),
                    reason="end_of_data",
                )
            )
        self._entries.clear()
        self._pending_exits.clear()
        return fills

    def has_resting_entry(self, trade_id: int, leg_index: int) -> bool:
        return (trade_id, leg_index) in self._entries
