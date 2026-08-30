"""Order/trade state machine.

One armed zone is one ``Trade``. A trade owns ``n_entries`` ``Leg``s, each with
its own limit, its own size, and — in ``atr`` stop mode — its own stop, since
the stop hangs off the fill price. Trade-level accounting aggregates the legs
so that a laddered fill still risks ``risk_per_trade`` in total.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from ..orders.zone import Zone
from ..types import Direction


class TradeStatus(Enum):
    ARMED = "armed"    # orders resting, nothing filled
    OPEN = "open"      # at least one leg filled and still open
    CLOSED = "closed"


class ExitReason(Enum):
    STOP = "stop"
    TRAIL = "trail_stop"
    TARGET = "target"
    TIME = "time_stop"
    INVALIDATION = "invalidation"
    END_OF_DATA = "end_of_data"


class CloseReason(Enum):
    EXPIRED_UNFILLED = "expired_unfilled"
    INVALIDATED_UNFILLED = "invalidated_unfilled"
    COMPLETED = "completed"
    END_OF_DATA = "end_of_data"


@dataclass
class Leg:
    index: int
    limit_price: float
    planned_qty: float
    planned_stop: float
    planned_target: float | None
    planned_risk: float          # dollars this leg was budgeted to risk
    risk_per_share: float
    size_capped: bool

    filled: bool = False
    fill_price: float | None = None
    fill_ts: datetime | None = None
    fill_index: int | None = None
    qty: float = 0.0

    stop_price: float | None = None
    target_price: float | None = None
    trail_active: bool = False
    trail_anchor: float | None = None

    exit_price: float | None = None
    exit_ts: datetime | None = None
    exit_index: int | None = None
    exit_reason: ExitReason | None = None

    commission: float = 0.0
    cancelled: bool = False
    exit_pending: bool = False
    risk_at_fill: float = 0.0    # dollars actually at risk once filled

    @property
    def open(self) -> bool:
        return self.filled and self.exit_reason is None

    @property
    def resting(self) -> bool:
        return not self.filled and not self.cancelled

    def gross_pnl(self, direction: Direction) -> float:
        if not self.filled or self.exit_price is None:
            return 0.0
        return direction.sign * (self.exit_price - self.fill_price) * self.qty

    def net_pnl(self, direction: Direction) -> float:
        return self.gross_pnl(direction) - self.commission

    def unrealized(self, mark: float, direction: Direction) -> float:
        if not self.open:
            return 0.0
        return direction.sign * (mark - self.fill_price) * self.qty

    def r_at(self, price: float, direction: Direction) -> float:
        """Unrealized R for this leg at ``price``."""
        if not self.filled or self.risk_per_share <= 0:
            return 0.0
        return direction.sign * (price - self.fill_price) / self.risk_per_share


@dataclass
class Trade:
    id: int
    level_id: int
    level_price: float
    direction: Direction
    zone: Zone
    atr_at_break: float
    armed_ts: datetime
    armed_index: int
    equity_at_arm: float
    breakout_close: float
    legs: list[Leg] = field(default_factory=list)

    status: TradeStatus = TradeStatus.ARMED
    close_reason: CloseReason | None = None
    closed_ts: datetime | None = None
    closed_index: int | None = None

    invalidated: bool = False   # the close-back-through event fires once
    first_fill_index: int | None = None
    first_fill_ts: datetime | None = None
    mae_r: float = 0.0
    mfe_r: float = 0.0

    # ------------------------------------------------------------- accessors
    @property
    def filled_legs(self) -> list[Leg]:
        return [lg for lg in self.legs if lg.filled]

    @property
    def open_legs(self) -> list[Leg]:
        return [lg for lg in self.legs if lg.open]

    @property
    def resting_legs(self) -> list[Leg]:
        return [lg for lg in self.legs if lg.resting]

    @property
    def ever_filled(self) -> bool:
        return self.first_fill_index is not None

    @property
    def open_qty(self) -> float:
        return sum(lg.qty for lg in self.open_legs)

    @property
    def risk_dollars(self) -> float:
        """Dollar risk actually taken, measured from the fills that happened."""
        return sum(lg.risk_at_fill for lg in self.filled_legs)

    @property
    def planned_risk(self) -> float:
        return sum(lg.planned_risk for lg in self.legs if not lg.cancelled)

    @property
    def net_pnl(self) -> float:
        return sum(lg.net_pnl(self.direction) for lg in self.legs if lg.exit_price is not None)

    @property
    def r_multiple(self) -> float | None:
        risk = self.risk_dollars
        if risk <= 0:
            return None
        return self.net_pnl / risk

    @property
    def commission(self) -> float:
        return sum(lg.commission for lg in self.legs)

    @property
    def avg_entry(self) -> float | None:
        legs = self.filled_legs
        qty = sum(lg.qty for lg in legs)
        if not legs or qty <= 0:
            return None
        return sum(lg.fill_price * lg.qty for lg in legs) / qty

    @property
    def avg_risk_per_share(self) -> float | None:
        legs = self.filled_legs
        qty = sum(lg.qty for lg in legs)
        if not legs or qty <= 0:
            return None
        return sum(lg.risk_per_share * lg.qty for lg in legs) / qty

    @property
    def time_to_fill_bars(self) -> int | None:
        if self.first_fill_index is None:
            return None
        return self.first_fill_index - self.armed_index

    @property
    def hold_bars(self) -> int | None:
        if self.first_fill_index is None or self.closed_index is None:
            return None
        return self.closed_index - self.first_fill_index

    def excursion_r(self, price: float) -> float | None:
        entry = self.avg_entry
        rps = self.avg_risk_per_share
        if entry is None or rps is None or rps <= 0:
            return None
        return self.direction.sign * (price - entry) / rps
