"""1H breakout detection.

Evaluated only on closed bars. A breakout is the first close through a live
daily level: the bar closes beyond ``level.price * (1 ± break_buffer_pct)``
while the previous bar closed on the wrong side of the level itself. The
"first close through" clause is what stops one level firing on every bar of a
trend leg.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..config import Config
from ..levels.lifecycle import Level
from ..types import beyond
from .context import BarContext
from .filters import first_rejection


@dataclass(frozen=True)
class BreakoutSignal:
    level_id: int
    level_price: float
    ts: datetime
    bar_index: int
    breakout_close: float
    breakout_high: float   # the favourable extreme of the breakout bar
    atr: float


@dataclass(frozen=True)
class RejectedSignal:
    level_id: int
    level_price: float
    ts: datetime
    bar_index: int
    price: float
    atr: float
    filter_name: str
    detail: str


def trigger_price(level_price: float, cfg: Config) -> float:
    return level_price * (1.0 + cfg.direction.sign * cfg.break_buffer_pct)


def detect(
    ctx: BarContext,
    levels: list[Level],
    cfg: Config,
    is_eligible,
) -> tuple[list[BreakoutSignal], list[RejectedSignal]]:
    """Evaluate one closed 1H bar against the live levels.

    ``is_eligible(level_id) -> bool`` is supplied by the engine and encodes
    whatever state the signal layer must not know about: a zone already armed
    on this level, a level that has used up its arms, an open trade.
    """
    bar = ctx.bar
    signals: list[BreakoutSignal] = []
    rejected: list[RejectedSignal] = []
    if ctx.prev_bar is None or ctx.atr is None or ctx.atr <= 0:
        return signals, rejected

    for level in levels:
        if not is_eligible(level.id):
            continue
        trigger = trigger_price(level.price, cfg)
        if not beyond(bar.close, trigger, cfg.direction):
            continue
        # First close through: the previous bar must have closed on the near side.
        reference = level.price if cfg.first_close_reference == "level" else trigger
        if beyond(ctx.prev_bar.close, reference, cfg.direction):
            continue

        rejection = first_rejection(ctx, cfg)
        if rejection is not None:
            name, detail = rejection
            rejected.append(
                RejectedSignal(
                    level_id=level.id,
                    level_price=level.price,
                    ts=bar.ts,
                    bar_index=ctx.index,
                    price=bar.close,
                    atr=ctx.atr,
                    filter_name=name,
                    detail=detail,
                )
            )
            continue

        signals.append(
            BreakoutSignal(
                level_id=level.id,
                level_price=level.price,
                ts=bar.ts,
                bar_index=ctx.index,
                breakout_close=bar.close,
                breakout_high=bar.extreme(cfg.direction, favourable=True),
                atr=ctx.atr,
            )
        )
    return signals, rejected
