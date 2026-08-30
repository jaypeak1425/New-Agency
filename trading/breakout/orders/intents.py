"""Broker-agnostic order intents.

The engine never talks to an exchange. It emits intents; an adapter maps them
onto a broker API, and the backtest's simulated broker is just one such
adapter. Nothing below the adapter layer should ever import a vendor SDK.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Protocol

from ..types import Direction


class IntentKind(Enum):
    PLACE_LIMIT = "place_limit"    # resting entry in the zone
    PLACE_STOP = "place_stop"      # protective stop for a filled leg
    REPLACE_STOP = "replace_stop"  # trail update, computed at bar close
    PLACE_TARGET = "place_target"  # optional hard target
    CANCEL = "cancel"
    EXIT_MARKET = "exit_market"    # invalidation / time stop


@dataclass(frozen=True)
class OrderIntent:
    kind: IntentKind
    ts: datetime
    trade_id: int
    leg_index: int
    direction: Direction
    price: float | None = None
    qty: float | None = None
    reason: str = ""
    # Attached bracket, carried on PLACE_LIMIT. Real brokers accept these with
    # the entry; the simulator needs them to resolve a same-bar entry+stop.
    attached_stop: float | None = None
    attached_target: float | None = None

    def __str__(self) -> str:  # pragma: no cover - diagnostics only
        px = "mkt" if self.price is None else f"{self.price:.4f}"
        return (
            f"{self.ts.isoformat()} {self.kind.value} trade={self.trade_id} "
            f"leg={self.leg_index} {self.direction.name} @{px} qty={self.qty} {self.reason}"
        )


class Broker(Protocol):
    """The whole surface an execution venue has to implement."""

    def submit(self, intent: OrderIntent) -> None:
        ...
