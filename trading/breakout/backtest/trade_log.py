"""Flat trade log — one row per armed zone, filled or not.

Unfilled zones stay in the log on purpose: fill rate is a headline metric, and
you cannot compute it from a file that only contains the trades that worked out
well enough to happen.
"""

from __future__ import annotations

import csv
from typing import Any, Iterable

from ..engine.state import Trade

TRADE_COLUMNS = (
    "trade_id",
    "level_id",
    "level_price",
    "direction",
    "armed_ts",
    "armed_index",
    "breakout_close",
    "zone_far",
    "zone_near",
    "zone_depth",
    "atr_at_break",
    "equity_at_arm",
    "filled",
    "first_fill_ts",
    "time_to_fill_bars",
    "avg_entry",
    "avg_risk_per_share",
    "qty",
    "risk_dollars",
    "planned_risk",
    "net_pnl",
    "r_multiple",
    "mae_r",
    "mfe_r",
    "hold_bars",
    "closed_ts",
    "close_reason",
    "exit_reasons",
    "size_capped",
)


def trade_row(trade: Trade) -> dict[str, Any]:
    return {
        "trade_id": trade.id,
        "level_id": trade.level_id,
        "level_price": round(trade.level_price, 6),
        "direction": trade.direction.name,
        "armed_ts": trade.armed_ts.isoformat(),
        "armed_index": trade.armed_index,
        "breakout_close": round(trade.breakout_close, 6),
        "zone_far": round(trade.zone.far_bound, 6),
        "zone_near": round(trade.zone.near_bound, 6),
        "zone_depth": round(trade.zone.depth, 6),
        "atr_at_break": round(trade.atr_at_break, 6),
        "equity_at_arm": round(trade.equity_at_arm, 2),
        "filled": int(trade.ever_filled),
        "first_fill_ts": trade.first_fill_ts.isoformat() if trade.first_fill_ts else "",
        "time_to_fill_bars": trade.time_to_fill_bars if trade.time_to_fill_bars is not None else "",
        "avg_entry": round(trade.avg_entry, 6) if trade.avg_entry is not None else "",
        "avg_risk_per_share": (
            round(trade.avg_risk_per_share, 6) if trade.avg_risk_per_share is not None else ""
        ),
        "qty": round(sum(lg.qty for lg in trade.filled_legs), 6),
        "risk_dollars": round(trade.risk_dollars, 2),
        "planned_risk": round(trade.planned_risk, 2),
        "net_pnl": round(trade.net_pnl, 2),
        "r_multiple": round(trade.r_multiple, 4) if trade.r_multiple is not None else "",
        "mae_r": round(trade.mae_r, 4),
        "mfe_r": round(trade.mfe_r, 4),
        "hold_bars": trade.hold_bars if trade.hold_bars is not None else "",
        "closed_ts": trade.closed_ts.isoformat() if trade.closed_ts else "",
        "close_reason": trade.close_reason.value if trade.close_reason else "",
        "exit_reasons": "|".join(
            lg.exit_reason.value for lg in trade.legs if lg.exit_reason is not None
        ),
        "size_capped": int(any(lg.size_capped for lg in trade.legs)),
    }


def to_rows(trades: Iterable[Trade]) -> list[dict[str, Any]]:
    return [trade_row(t) for t in trades]


def write_csv(path: str, rows: list[dict[str, Any]], columns: Iterable[str] = TRADE_COLUMNS) -> None:
    with open(path, "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(columns))
        writer.writeheader()
        writer.writerows(rows)
