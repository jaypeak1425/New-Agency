"""The event loop.

One pass over a merged daily/1H event stream. Within each 1H bar the order is
fixed and it matters:

1. resolve what was already resting against this bar (fills, stops, targets);
2. manage what is now open (excursions, trailing, time stop, invalidation,
   expiry) using only this bar's *close*;
3. mark equity;
4. only then look for a new breakout on this bar's close and arm the zone.

Step 4 last is what guarantees a zone armed at the close of bar *t* cannot fill
on bar *t* — the bar it was armed on is already spent.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..config import Config
from ..data.loaders import MarketData
from ..levels.lifecycle import LevelBook
from ..orders.intents import IntentKind, OrderIntent
from ..orders.sizing import size_position
from ..orders.stops import stop_price, target_price, tighten, trail_stop_price
from ..orders.zone import build_zone
from ..signals.breakout import BreakoutSignal, RejectedSignal, detect
from ..signals.context import BarContext, IntradayContext
from ..types import Bar, beyond, better_of
from .broker import Fill, FillKind, SimBroker
from .state import CloseReason, ExitReason, Leg, Trade, TradeStatus


@dataclass(frozen=True)
class FailedBreak:
    """A break that closed back through its level. Instrumented now, because
    this population is a candidate fade system in its own right (§7)."""

    level_id: int
    level_price: float
    breakout_index: int
    breakout_ts: datetime
    breakout_close: float
    fail_index: int
    fail_ts: datetime
    fail_close: float
    atr: float
    had_fill: bool


@dataclass(frozen=True)
class EquityPoint:
    ts: datetime
    index: int
    equity: float


class Engine:
    """Broker-agnostic strategy engine. Emits intents; owns no venue logic."""

    def __init__(
        self,
        cfg: Config,
        broker: SimBroker | None = None,
        active_from: datetime | None = None,
        costs=None,
    ) -> None:
        self.cfg = cfg
        # Bars before ``active_from`` warm the level book and indicators but may
        # not arm a zone. Walk-forward folds use it so each window starts with a
        # warm engine instead of a cold one.
        self.active_from = active_from
        self.broker = broker if broker is not None else SimBroker(cfg, costs)
        self.book = LevelBook(cfg)
        self.intraday = IntradayContext(cfg)

        self.trades: list[Trade] = []
        self.rejected: list[RejectedSignal] = []
        self.failed_breaks: list[FailedBreak] = []
        self.equity_curve: list[EquityPoint] = []

        self.realized_pnl = 0.0
        self._next_trade_id = 1
        self._arms_by_level: dict[int, int] = {}
        self._last_bar: Bar | None = None
        self._last_index = -1
        self._last_atr: float | None = None

    # ------------------------------------------------------------- equity
    @property
    def equity(self) -> float:
        return self.cfg.initial_equity + self.realized_pnl + self._unrealized()

    def _unrealized(self, mark: float | None = None) -> float:
        if mark is None:
            if self._last_bar is None:
                return 0.0
            mark = self._last_bar.close
        total = 0.0
        for trade in self.trades:
            for leg in trade.open_legs:
                total += leg.unrealized(mark, trade.direction)
        return total

    # ---------------------------------------------------------------- run
    def run(self, data: MarketData) -> None:
        for kind, bar in data.events():
            if kind == "daily":
                self.book.on_daily_bar(bar)
            else:
                self.on_hourly_bar(bar)
        self.finalize()

    def on_hourly_bar(self, bar: Bar) -> BarContext:
        ctx = self.intraday.update(bar)
        self._last_bar = bar
        self._last_index = ctx.index

        self._last_atr = ctx.atr
        self._apply_fills(self.broker.on_bar(bar, ctx.index, ctx.atr))
        self._manage(ctx)
        self.equity_curve.append(EquityPoint(bar.ts, ctx.index, self.equity))
        self._scan(ctx)
        return ctx

    def finalize(self) -> None:
        if self._last_bar is None:
            return
        self._apply_fills(
            self.broker.force_close_all(self._last_bar, self._last_index, self._last_atr),
            forced=True,
        )
        for trade in self.trades:
            if trade.status is TradeStatus.CLOSED:
                continue
            for leg in trade.resting_legs:
                leg.cancelled = True
            self._close_trade(
                trade,
                CloseReason.END_OF_DATA if trade.ever_filled else CloseReason.EXPIRED_UNFILLED,
                self._last_bar.ts,
                self._last_index,
            )

    # -------------------------------------------------------------- fills
    def _lookup(self, trade_id: int) -> Trade:
        return self.trades[trade_id - 1]

    def _apply_fills(self, fills: list[Fill], forced: bool = False) -> None:
        for fill in fills:
            trade = self._lookup(fill.trade_id)
            leg = trade.legs[fill.leg_index]
            if fill.kind is FillKind.ENTRY:
                self._book_entry(trade, leg, fill)
            else:
                self._book_exit(trade, leg, fill, forced)

    def _book_entry(self, trade: Trade, leg: Leg, fill: Fill) -> None:
        leg.filled = True
        leg.fill_price = fill.price
        leg.fill_ts = fill.ts
        leg.fill_index = fill.bar_index
        leg.qty = fill.qty
        leg.commission += fill.commission
        self.realized_pnl -= fill.commission

        # The stop follows the fill in ATR mode (risk per share is unchanged by a
        # gap-improved fill); in structure mode it stays pinned to the level, so a
        # better fill simply risks less.
        if self.cfg.stop_mode == "atr":
            leg.stop_price = fill.price - self.cfg.direction.sign * self.cfg.atr_mult * trade.atr_at_break
        else:
            leg.stop_price = leg.planned_stop
        leg.risk_per_share = abs(fill.price - leg.stop_price)
        leg.risk_at_fill = leg.qty * leg.risk_per_share
        leg.target_price = target_price(fill.price, leg.stop_price, self.cfg)
        leg.trail_anchor = fill.price

        if leg.stop_price != leg.planned_stop or leg.target_price != leg.planned_target:
            self._submit(IntentKind.REPLACE_STOP, trade, leg, leg.stop_price, reason="stop_from_fill")
            if leg.target_price is not None:
                self._submit(IntentKind.PLACE_TARGET, trade, leg, leg.target_price)

        if trade.first_fill_index is None:
            trade.first_fill_index = fill.bar_index
            trade.first_fill_ts = fill.ts
        trade.status = TradeStatus.OPEN

    def _book_exit(self, trade: Trade, leg: Leg, fill: Fill, forced: bool) -> None:
        if not leg.open:
            return
        leg.exit_price = fill.price
        leg.exit_ts = fill.ts
        leg.exit_index = fill.bar_index
        leg.commission += fill.commission
        leg.exit_pending = False
        # Funding and borrow accrue for as long as the position was held.
        if leg.fill_ts is not None:
            held_days = max((fill.ts - leg.fill_ts).total_seconds() / 86400.0, 0.0)
            carry = self.broker.costs.holding_cost(
                leg.qty * leg.fill_price, held_days, trade.direction
            )
            leg.commission += carry
            self.realized_pnl -= carry
        if fill.kind is FillKind.STOP:
            leg.exit_reason = ExitReason.TRAIL if leg.trail_active else ExitReason.STOP
        elif fill.kind is FillKind.TARGET:
            leg.exit_reason = ExitReason.TARGET
        elif forced or fill.reason == "end_of_data":
            leg.exit_reason = ExitReason.END_OF_DATA
        elif fill.reason == ExitReason.TIME.value:
            leg.exit_reason = ExitReason.TIME
        else:
            leg.exit_reason = ExitReason.INVALIDATION
        self.realized_pnl += leg.gross_pnl(trade.direction) - fill.commission

    # ------------------------------------------------------------- manage
    def _manage(self, ctx: BarContext) -> None:
        bar = ctx.bar
        for trade in self.trades:
            if trade.status is TradeStatus.CLOSED:
                continue
            self._update_excursions(trade, bar)
            self._update_trailing(trade, ctx)
            self._check_time_stop(trade, ctx)
            self._check_invalidation(trade, ctx)
            self._check_expiry(trade, ctx)
            self._maybe_close(trade, ctx)

    def _update_excursions(self, trade: Trade, bar: Bar) -> None:
        if not trade.ever_filled:
            return
        favourable = trade.excursion_r(bar.extreme(trade.direction, favourable=True))
        adverse = trade.excursion_r(bar.extreme(trade.direction, favourable=False))
        if favourable is not None:
            trade.mfe_r = max(trade.mfe_r, favourable)
        if adverse is not None:
            trade.mae_r = min(trade.mae_r, adverse)

    def _update_trailing(self, trade: Trade, ctx: BarContext) -> None:
        if ctx.atr is None or ctx.atr <= 0:
            return
        bar = ctx.bar
        for leg in trade.open_legs:
            if leg.exit_pending:
                continue
            leg.trail_anchor = better_of(
                leg.trail_anchor if leg.trail_anchor is not None else leg.fill_price,
                bar.extreme(trade.direction, favourable=True),
                trade.direction,
            )
            if not leg.trail_active:
                if leg.r_at(bar.close, trade.direction) < self.cfg.trail_activate_r:
                    continue
                leg.trail_active = True
            candidate = trail_stop_price(leg.trail_anchor, self.cfg, ctx.atr)
            tightened = tighten(leg.stop_price, candidate, trade.direction)
            if tightened != leg.stop_price:
                leg.stop_price = tightened
                self._submit(IntentKind.REPLACE_STOP, trade, leg, tightened, reason="trail")

    def _check_time_stop(self, trade: Trade, ctx: BarContext) -> None:
        if trade.first_fill_index is None:
            return
        if ctx.index - trade.first_fill_index < self.cfg.max_hold_bars:
            return
        self._exit_open_legs(trade, ExitReason.TIME.value)

    def _check_invalidation(self, trade: Trade, ctx: BarContext) -> None:
        if not self.cfg.cancel_on_close_back or trade.invalidated:
            return
        # "Closes back under the level" — strictly through, against the trade.
        if not beyond(trade.level_price, ctx.bar.close, self.cfg.direction):
            return
        had_resting = bool(trade.resting_legs)
        had_fill = trade.ever_filled
        if not (had_resting or trade.open_legs):
            return
        trade.invalidated = True

        for leg in trade.resting_legs:
            leg.cancelled = True
            self._submit(IntentKind.CANCEL, trade, leg, None, reason="invalidation")

        self.failed_breaks.append(
            FailedBreak(
                level_id=trade.level_id,
                level_price=trade.level_price,
                breakout_index=trade.armed_index,
                breakout_ts=trade.armed_ts,
                breakout_close=trade.breakout_close,
                fail_index=ctx.index,
                fail_ts=ctx.bar.ts,
                fail_close=ctx.bar.close,
                atr=trade.atr_at_break,
                had_fill=had_fill,
            )
        )

        # "Partially filled" is *not all legs filled* rather than *some still
        # resting*: a bar that closes back through the level has necessarily
        # traded through every resting limit in the zone on its way, so by the
        # time this runs the ladder is either complete or was cancelled earlier
        # by expiry. See tests/test_lifecycle.py for the worked case.
        partial = had_fill and any(not lg.filled for lg in trade.legs)
        if (partial and self.cfg.exit_partial_on_invalidation) or (
            not partial and had_fill and self.cfg.exit_full_on_invalidation
        ):
            self._exit_open_legs(trade, ExitReason.INVALIDATION.value)

    def _check_expiry(self, trade: Trade, ctx: BarContext) -> None:
        if ctx.index - trade.armed_index < self.cfg.zone_expiry_bars:
            return
        for leg in trade.resting_legs:
            leg.cancelled = True
            self._submit(IntentKind.CANCEL, trade, leg, None, reason="zone_expiry")

    def _exit_open_legs(self, trade: Trade, reason: str) -> None:
        for leg in trade.open_legs:
            if leg.exit_pending:
                continue
            leg.exit_pending = True
            self._submit(IntentKind.EXIT_MARKET, trade, leg, None, qty=leg.qty, reason=reason)

    def _maybe_close(self, trade: Trade, ctx: BarContext) -> None:
        if trade.resting_legs or trade.open_legs:
            return
        if trade.ever_filled:
            reason = CloseReason.COMPLETED
        elif any(lg.cancelled for lg in trade.legs):
            reason = (
                CloseReason.INVALIDATED_UNFILLED
                if beyond(trade.level_price, ctx.bar.close, self.cfg.direction)
                else CloseReason.EXPIRED_UNFILLED
            )
        else:
            reason = CloseReason.EXPIRED_UNFILLED
        self._close_trade(trade, reason, ctx.bar.ts, ctx.index)

    def _close_trade(self, trade: Trade, reason: CloseReason, ts: datetime, index: int) -> None:
        trade.status = TradeStatus.CLOSED
        trade.close_reason = reason
        trade.closed_ts = ts
        trade.closed_index = index

    # --------------------------------------------------------------- arming
    def _eligible(self, level_id: int) -> bool:
        if self._arms_by_level.get(level_id, 0) >= self.cfg.max_arms_per_level:
            return False
        return not any(
            t.level_id == level_id and t.status is not TradeStatus.CLOSED for t in self.trades
        )

    def _capacity(self) -> bool:
        live = [t for t in self.trades if t.status is not TradeStatus.CLOSED]
        if self.cfg.max_open_trades is not None:
            if sum(1 for t in live if t.status is TradeStatus.OPEN) >= self.cfg.max_open_trades:
                return False
        if self.cfg.max_armed_zones is not None:
            if sum(1 for t in live if t.status is TradeStatus.ARMED) >= self.cfg.max_armed_zones:
                return False
        return True

    def _scan(self, ctx: BarContext) -> None:
        if self.active_from is not None and ctx.bar.ts < self.active_from:
            return
        levels = self.book.live_levels(ctx.bar.close)
        signals, rejected = detect(ctx, levels, self.cfg, self._eligible)
        self.rejected.extend(rejected)
        for signal in signals:
            self.arm(signal, ctx)

    def arm(self, signal: BreakoutSignal, ctx: BarContext) -> Trade | None:
        """Turn a breakout into a zone with resting orders.

        Public because the signal source is swappable: the built-in detector is
        one producer, an external screener is another.
        """
        if not self._capacity():
            self.rejected.append(
                RejectedSignal(
                    level_id=signal.level_id,
                    level_price=signal.level_price,
                    ts=signal.ts,
                    bar_index=signal.bar_index,
                    price=signal.breakout_close,
                    atr=signal.atr,
                    filter_name="capacity",
                    detail="concurrency cap reached",
                )
            )
            return None

        zone = build_zone(signal, self.cfg)
        if zone is None:
            self.rejected.append(
                RejectedSignal(
                    level_id=signal.level_id,
                    level_price=signal.level_price,
                    ts=signal.ts,
                    bar_index=signal.bar_index,
                    price=signal.breakout_close,
                    atr=signal.atr,
                    filter_name="zone_depth",
                    detail=f"zone thinner than {self.cfg.min_zone_depth_atr} ATR",
                )
            )
            return None

        equity = self.equity
        trade = Trade(
            id=self._next_trade_id,
            level_id=signal.level_id,
            level_price=signal.level_price,
            direction=self.cfg.direction,
            zone=zone,
            atr_at_break=signal.atr,
            armed_ts=signal.ts,
            armed_index=signal.bar_index,
            equity_at_arm=equity,
            breakout_close=signal.breakout_close,
        )
        self._next_trade_id += 1
        self.trades.append(trade)
        self._arms_by_level[signal.level_id] = self._arms_by_level.get(signal.level_id, 0) + 1

        for i, entry in enumerate(zone.entries):
            stop = stop_price(entry, zone, self.cfg, signal.atr)
            sizing = size_position(equity, entry, stop, self.cfg, self.cfg.weights[i])
            leg = Leg(
                index=i,
                limit_price=entry,
                planned_qty=sizing.qty,
                planned_stop=stop,
                planned_target=target_price(entry, stop, self.cfg),
                planned_risk=sizing.planned_risk,
                risk_per_share=sizing.risk_per_share,
                size_capped=sizing.capped,
                stop_price=stop,
            )
            trade.legs.append(leg)
            if sizing.qty <= 0 or not beyond(entry, stop, self.cfg.direction):
                leg.cancelled = True   # unsizeable or malformed — never rests
                continue
            self._submit(
                IntentKind.PLACE_LIMIT,
                trade,
                leg,
                entry,
                qty=sizing.qty,
                attached_stop=stop,
                attached_target=leg.planned_target,
                reason="zone_entry",
            )
        if all(lg.cancelled for lg in trade.legs):
            self._close_trade(trade, CloseReason.EXPIRED_UNFILLED, ctx.bar.ts, ctx.index)
        return trade

    # -------------------------------------------------------------- intents
    def _submit(
        self,
        kind: IntentKind,
        trade: Trade,
        leg: Leg,
        price: float | None,
        qty: float | None = None,
        attached_stop: float | None = None,
        attached_target: float | None = None,
        reason: str = "",
    ) -> None:
        self.broker.submit(
            OrderIntent(
                kind=kind,
                ts=self._last_bar.ts if self._last_bar else trade.armed_ts,
                trade_id=trade.id,
                leg_index=leg.index,
                direction=trade.direction,
                price=price,
                qty=qty,
                reason=reason,
                attached_stop=attached_stop,
                attached_target=attached_target,
            )
        )
