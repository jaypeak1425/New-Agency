"""Position sizing.

Volatility-targeted, always: the dollar risk of a trade is a constant fraction
of equity, and the share count falls out of the stop distance. Never a fixed
share count — a fixed size means a wide-stop trade risks several times what a
tight-stop trade does, and the equity curve ends up measuring stop distance
rather than edge.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from ..config import Config


@dataclass(frozen=True)
class Sizing:
    qty: float
    risk_dollars: float       # actual dollar risk after any cap
    planned_risk: float       # dollar risk targeted before the cap
    risk_per_share: float
    capped: bool


def size_position(
    equity: float,
    entry: float,
    stop: float,
    cfg: Config,
    weight: float = 1.0,
) -> Sizing:
    """Size one ladder entry.

    ``weight`` is that entry's share of the trade's risk budget, so a filled
    ladder risks ``risk_per_trade`` in total rather than per leg.
    """
    risk_per_share = abs(entry - stop)
    planned_risk = equity * cfg.risk_per_trade * weight
    if risk_per_share <= 0 or equity <= 0 or entry <= 0:
        return Sizing(0.0, 0.0, planned_risk, risk_per_share, False)

    qty = planned_risk / risk_per_share
    capped = False
    max_notional = equity * cfg.max_position_pct * weight
    if qty * entry > max_notional:
        qty = max_notional / entry
        capped = True
    if not cfg.allow_fractional_qty:
        qty = math.floor(qty)

    return Sizing(
        qty=qty,
        risk_dollars=qty * risk_per_share,
        planned_risk=planned_risk,
        risk_per_share=risk_per_share,
        capped=capped,
    )
