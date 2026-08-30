"""Backtest metrics.

Trade count is reported first and everywhere, deliberately: a beautiful
equity curve on forty trades is noise wearing a suit.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field

from ..engine.loop import EquityPoint
from ..engine.state import Trade
from ..indicators import percentile

PERCENTILES = (10.0, 25.0, 50.0, 75.0, 90.0)


@dataclass(frozen=True)
class Metrics:
    armed_zones: int = 0
    trade_count: int = 0          # zones that actually filled
    fill_rate: float = 0.0
    win_rate: float = 0.0
    expectancy_r: float = 0.0
    median_r: float = 0.0
    profit_factor: float = 0.0
    total_r: float = 0.0
    net_pnl: float = 0.0
    commission: float = 0.0
    return_pct: float = 0.0
    max_drawdown_pct: float = 0.0
    max_drawdown: float = 0.0
    avg_time_to_fill_bars: float = 0.0
    avg_hold_bars: float = 0.0
    avg_win_r: float = 0.0
    avg_loss_r: float = 0.0
    mae_r: dict[str, float] = field(default_factory=dict)
    mfe_r: dict[str, float] = field(default_factory=dict)
    exit_reasons: dict[str, int] = field(default_factory=dict)
    close_reasons: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


def _dist(values: list[float]) -> dict[str, float]:
    if not values:
        return {}
    return {f"p{int(p)}": round(percentile(values, p), 4) for p in PERCENTILES}


def max_drawdown(curve: list[EquityPoint]) -> tuple[float, float]:
    """Return ``(dollars, fraction)`` of the deepest peak-to-trough decline."""
    peak = None
    worst_abs = 0.0
    worst_pct = 0.0
    for point in curve:
        if peak is None or point.equity > peak:
            peak = point.equity
        drop = peak - point.equity
        if drop > worst_abs:
            worst_abs = drop
        if peak > 0 and drop / peak > worst_pct:
            worst_pct = drop / peak
    return worst_abs, worst_pct


def compute(trades: list[Trade], curve: list[EquityPoint], initial_equity: float) -> Metrics:
    filled = [t for t in trades if t.ever_filled]
    rs = [t.r_multiple for t in filled if t.r_multiple is not None]
    wins = [r for r in rs if r > 0]
    losses = [r for r in rs if r <= 0]

    gross_win = sum(wins)
    gross_loss = abs(sum(losses))
    net_pnl = sum(t.net_pnl for t in trades)

    exit_reasons: dict[str, int] = {}
    for trade in filled:
        for leg in trade.legs:
            if leg.exit_reason is not None:
                key = leg.exit_reason.value
                exit_reasons[key] = exit_reasons.get(key, 0) + 1
    close_reasons: dict[str, int] = {}
    for trade in trades:
        if trade.close_reason is not None:
            key = trade.close_reason.value
            close_reasons[key] = close_reasons.get(key, 0) + 1

    ttf = [t.time_to_fill_bars for t in filled if t.time_to_fill_bars is not None]
    holds = [t.hold_bars for t in filled if t.hold_bars is not None]
    dd_abs, dd_pct = max_drawdown(curve)

    return Metrics(
        armed_zones=len(trades),
        trade_count=len(filled),
        fill_rate=round(len(filled) / len(trades), 4) if trades else 0.0,
        win_rate=round(len(wins) / len(rs), 4) if rs else 0.0,
        expectancy_r=round(sum(rs) / len(rs), 4) if rs else 0.0,
        median_r=round(percentile(rs, 50), 4) if rs else 0.0,
        profit_factor=round(gross_win / gross_loss, 4) if gross_loss > 0 else float("inf") if gross_win > 0 else 0.0,
        total_r=round(sum(rs), 4),
        net_pnl=round(net_pnl, 2),
        commission=round(sum(t.commission for t in trades), 2),
        return_pct=round(net_pnl / initial_equity, 4) if initial_equity else 0.0,
        max_drawdown=round(dd_abs, 2),
        max_drawdown_pct=round(dd_pct, 4),
        avg_time_to_fill_bars=round(sum(ttf) / len(ttf), 3) if ttf else 0.0,
        avg_hold_bars=round(sum(holds) / len(holds), 3) if holds else 0.0,
        avg_win_r=round(sum(wins) / len(wins), 4) if wins else 0.0,
        avg_loss_r=round(sum(losses) / len(losses), 4) if losses else 0.0,
        mae_r=_dist([t.mae_r for t in filled]),
        mfe_r=_dist([t.mfe_r for t in filled]),
        exit_reasons=exit_reasons,
        close_reasons=close_reasons,
    )


def format_report(metrics: Metrics, title: str = "backtest") -> str:
    lines = [
        f"--- {title} ---",
        f"trades (filled)      {metrics.trade_count}      <- read this first",
        f"armed zones          {metrics.armed_zones}",
        f"fill rate            {metrics.fill_rate:.1%}",
        f"expectancy           {metrics.expectancy_r:+.3f} R",
        f"win rate             {metrics.win_rate:.1%}",
        f"profit factor        {metrics.profit_factor:.3f}",
        f"total                {metrics.total_r:+.2f} R / {metrics.net_pnl:+,.2f}",
        f"return               {metrics.return_pct:+.2%}",
        f"max drawdown         {metrics.max_drawdown_pct:.2%} ({metrics.max_drawdown:,.2f})",
        f"avg win / avg loss   {metrics.avg_win_r:+.2f} R / {metrics.avg_loss_r:+.2f} R",
        f"avg time to fill     {metrics.avg_time_to_fill_bars:.2f} bars",
        f"avg hold             {metrics.avg_hold_bars:.2f} bars",
        f"MAE R  {metrics.mae_r}",
        f"MFE R  {metrics.mfe_r}",
        f"exits  {metrics.exit_reasons}",
        f"zones  {metrics.close_reasons}",
    ]
    if metrics.trade_count < 100:
        lines.append(
            f"NOTE: {metrics.trade_count} trades is a small sample. Treat every "
            "number above as a hypothesis, not a measurement."
        )
    return "\n".join(lines)
