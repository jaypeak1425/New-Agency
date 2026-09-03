"""The risk layer.

The sleeves produce signals; this produces the return profile. Written first and
deliberately: the drawdown governor is the difference between a system that
survives a bad regime and one that doesn't, and the only honest time to write a
demotion rule is while you hold no positions and have no stake in the answer.

Every limit here is checked *before* an order goes out, not reported afterwards.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from breakout.types import Direction


class Action(Enum):
    ALLOW = "allow"
    REDUCE = "reduce"
    REJECT = "reject"


class HaltReason(Enum):
    NONE = "none"
    DAILY_LOSS = "daily_loss_kill_switch"
    DRAWDOWN = "drawdown_governor_halt"
    MANUAL = "manual"


@dataclass(frozen=True)
class RiskLimits:
    risk_per_trade: float = 0.005          # 0.5% of equity
    portfolio_heat: float = 0.06           # 6% total open risk
    max_per_instrument: float = 0.15       # 15% notional
    max_per_asset_class: float = 0.40      # 40% notional
    max_gross_leverage: dict[str, float] = field(
        default_factory=lambda: {"crypto": 3.0, "futures": 5.0, "equities": 2.0}
    )
    daily_loss_kill: float = 0.03          # -3% on the day -> flatten, halt 24h
    halt_hours: float = 24.0
    drawdown_halve: float = 0.10           # -10% peak-to-trough -> half size
    drawdown_halt: float = 0.18            # -18% -> halt, manual restart only
    corr_panic: float = 0.70               # book treated as one position above this

    def leverage_cap(self, asset_class: str) -> float:
        return self.max_gross_leverage.get(asset_class, 1.0)


@dataclass
class Position:
    symbol: str
    asset_class: str
    notional: float          # absolute
    open_risk: float         # currency at risk to the stop
    direction: Direction = Direction.LONG


@dataclass
class ProposedOrder:
    symbol: str
    asset_class: str
    direction: Direction
    qty: float
    price: float
    stop: float

    @property
    def notional(self) -> float:
        return abs(self.qty * self.price)

    @property
    def risk(self) -> float:
        return abs(self.qty * (self.price - self.stop))


@dataclass
class Decision:
    action: Action
    qty: float
    reasons: list[str] = field(default_factory=list)

    @property
    def allowed(self) -> bool:
        return self.action is not Action.REJECT and self.qty > 0

    def __str__(self) -> str:
        head = f"{self.action.value} qty={self.qty:.6g}"
        return head if not self.reasons else head + " — " + "; ".join(self.reasons)


class RiskGovernor:
    """Portfolio-level state plus the pre-trade checks.

    Feed it equity marks with `observe`; ask it about orders with `check`.
    """

    def __init__(self, limits: RiskLimits, initial_equity: float) -> None:
        self.limits = limits
        self.equity = initial_equity
        self.peak_equity = initial_equity
        self.day_start_equity = initial_equity
        self.day: object | None = None
        self.halt_reason = HaltReason.NONE
        self.halted_until: datetime | None = None
        self.avg_pairwise_corr = 0.0
        self.events: list[tuple[datetime, str]] = []

    # ------------------------------------------------------------- state
    def observe(self, equity: float, ts: datetime) -> None:
        """Mark equity. This is what arms the governor — call it every bar."""
        self.equity = equity
        if equity > self.peak_equity:
            self.peak_equity = equity

        day = ts.date()
        if self.day is None or day != self.day:
            self.day = day
            self.day_start_equity = equity
            if self.halt_reason is HaltReason.DAILY_LOSS and self._halt_expired(ts):
                self._log(ts, "daily-loss halt expired; trading resumes at current size")
                self.halt_reason = HaltReason.NONE
                self.halted_until = None

        if self.halt_reason is HaltReason.DAILY_LOSS and self._halt_expired(ts):
            self._log(ts, "daily-loss halt expired")
            self.halt_reason = HaltReason.NONE
            self.halted_until = None

        if self.drawdown >= self.limits.drawdown_halt and self.halt_reason is not HaltReason.DRAWDOWN:
            self.halt_reason = HaltReason.DRAWDOWN
            self.halted_until = None       # manual restart only, by design
            self._log(ts, f"drawdown {self.drawdown:.1%} >= {self.limits.drawdown_halt:.0%}: HALT, manual restart required")
        elif self.halt_reason is HaltReason.NONE and self.day_loss >= self.limits.daily_loss_kill:
            self.halt_reason = HaltReason.DAILY_LOSS
            self.halted_until = ts + timedelta(hours=self.limits.halt_hours)
            self._log(ts, f"daily loss {self.day_loss:.1%}: flatten and halt until {self.halted_until:%Y-%m-%d %H:%M}")

    def _halt_expired(self, ts: datetime) -> bool:
        return self.halted_until is not None and ts >= self.halted_until

    def _log(self, ts: datetime, message: str) -> None:
        self.events.append((ts, message))

    def set_correlation(self, avg_pairwise: float) -> None:
        self.avg_pairwise_corr = avg_pairwise

    def resume(self, ts: datetime, note: str = "manual restart") -> None:
        """Explicit restart after a drawdown halt. There is no automatic path
        out of an -18% halt, and that is the point of it."""
        self._log(ts, f"resumed: {note}")
        self.halt_reason = HaltReason.NONE
        self.halted_until = None
        self.peak_equity = self.equity      # re-anchor, or the halt re-fires instantly

    # ------------------------------------------------------------ readings
    @property
    def drawdown(self) -> float:
        return 0.0 if self.peak_equity <= 0 else max(0.0, (self.peak_equity - self.equity) / self.peak_equity)

    @property
    def day_loss(self) -> float:
        if self.day_start_equity <= 0:
            return 0.0
        return max(0.0, (self.day_start_equity - self.equity) / self.day_start_equity)

    @property
    def halted(self) -> bool:
        return self.halt_reason is not HaltReason.NONE

    @property
    def correlation_override(self) -> bool:
        """Above `corr_panic` the book is one position, whatever the ticker says.

        This is the single most important line in the risk layer: diversification
        that evaporates in a panic was never diversification, and the sizing has
        to know that before the panic, not after.
        """
        return self.avg_pairwise_corr > self.limits.corr_panic

    @property
    def size_multiplier(self) -> float:
        if self.halted:
            return 0.0
        if self.drawdown >= self.limits.drawdown_halve:
            return 0.5
        return 1.0

    # -------------------------------------------------------------- checks
    def check(self, order: ProposedOrder, positions: dict[str, Position] | None = None) -> Decision:
        """Approve, shrink, or refuse one order. Never silently approves."""
        positions = positions or {}
        reasons: list[str] = []

        if self.halted:
            return Decision(Action.REJECT, 0.0, [f"halted: {self.halt_reason.value}"])
        if order.qty <= 0 or order.price <= 0:
            return Decision(Action.REJECT, 0.0, ["non-positive quantity or price"])
        if order.risk <= 0:
            return Decision(Action.REJECT, 0.0, ["stop is at the entry: undefined risk"])

        qty = order.qty
        mult = self.size_multiplier
        if mult < 1.0:
            qty *= mult
            reasons.append(f"drawdown {self.drawdown:.1%}: sizing halved by the governor")

        per_share_risk = order.risk / order.qty

        # 1. risk per trade
        cap_qty = (self.equity * self.limits.risk_per_trade * mult) / per_share_risk
        if qty > cap_qty:
            qty = cap_qty
            reasons.append(f"risk per trade capped at {self.limits.risk_per_trade:.2%} of equity")

        # 2. portfolio heat
        open_risk = sum(p.open_risk for p in positions.values())
        heat_budget = self.equity * self.limits.portfolio_heat - open_risk
        if heat_budget <= 0:
            return Decision(Action.REJECT, 0.0,
                            [*reasons, f"portfolio heat {open_risk / self.equity:.2%} already at the "
                                       f"{self.limits.portfolio_heat:.0%} limit"])
        qty = min(qty, heat_budget / per_share_risk)

        # 3. per-instrument notional. Under the correlation override the whole
        #    book counts as this one instrument.
        existing_symbol = positions[order.symbol].notional if order.symbol in positions else 0.0
        if self.correlation_override:
            existing_symbol = sum(p.notional for p in positions.values())
            reasons.append(f"correlation {self.avg_pairwise_corr:.2f} > {self.limits.corr_panic:.2f}: "
                           f"book sized as a single position")
        room = self.equity * self.limits.max_per_instrument - existing_symbol
        if room <= 0:
            return Decision(Action.REJECT, 0.0,
                            [*reasons, f"instrument limit {self.limits.max_per_instrument:.0%} reached"])
        qty = min(qty, room / order.price)

        # 4. per-asset-class notional
        class_notional = sum(p.notional for p in positions.values() if p.asset_class == order.asset_class)
        class_room = self.equity * self.limits.max_per_asset_class - class_notional
        if class_room <= 0:
            return Decision(Action.REJECT, 0.0,
                            [*reasons, f"asset-class limit {self.limits.max_per_asset_class:.0%} reached "
                                       f"for {order.asset_class}"])
        qty = min(qty, class_room / order.price)

        # 5. gross leverage
        gross = sum(p.notional for p in positions.values())
        lev_room = self.equity * self.limits.leverage_cap(order.asset_class) - gross
        if lev_room <= 0:
            return Decision(Action.REJECT, 0.0,
                            [*reasons, f"gross leverage cap {self.limits.leverage_cap(order.asset_class):.1f}x reached"])
        qty = min(qty, lev_room / order.price)

        if qty <= 0:
            return Decision(Action.REJECT, 0.0, [*reasons, "no room left under the limits"])
        if qty < order.qty * (1 - 1e-9):
            return Decision(Action.REDUCE, qty, reasons or ["reduced to fit the limits"])
        return Decision(Action.ALLOW, qty, reasons)

    # -------------------------------------------------------------- report
    def status(self) -> str:
        lines = [
            f"equity {self.equity:,.2f}   peak {self.peak_equity:,.2f}",
            f"drawdown {self.drawdown:.2%}   day {self.day_loss:.2%}",
            f"size multiplier {self.size_multiplier:.2f}"
            + ("   HALTED: " + self.halt_reason.value if self.halted else ""),
        ]
        if self.correlation_override:
            lines.append(f"CORRELATION OVERRIDE active at {self.avg_pairwise_corr:.2f}")
        return "\n".join(lines)


def average_pairwise_correlation(series: dict[str, list[float]]) -> float:
    """Mean pairwise correlation across the book's return series.

    Correlation convergence is the panic tell: when everything starts moving
    together, position count stops being diversification and starts being
    leverage on one bet.
    """
    keys = [k for k, v in series.items() if len(v) > 2]
    if len(keys) < 2:
        return 0.0
    n = min(len(series[k]) for k in keys)
    cols = {k: series[k][-n:] for k in keys}
    means = {k: sum(v) / n for k, v in cols.items()}

    total = 0.0
    pairs = 0
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            va, vb = cols[a], cols[b]
            ma, mb = means[a], means[b]
            cov = sum((x - ma) * (y - mb) for x, y in zip(va, vb))
            sa = sum((x - ma) ** 2 for x in va) ** 0.5
            sb = sum((y - mb) ** 2 for y in vb) ** 0.5
            if sa > 0 and sb > 0:
                total += cov / (sa * sb)
                pairs += 1
    return total / pairs if pairs else 0.0
