"""Lookahead audit.

Run the backtest on the full series, then re-run it with all data truncated at
each decision point and check that the decisions are identical. If any part of
the system peeks at a bar it has not been shown yet, the truncated run diverges
from the full run's prefix and the audit fails.

The comparison is over emitted order intents — the engine's entire externally
visible behaviour — rather than over metrics, because two different decision
sequences can produce the same P&L by accident.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..config import Config
from ..data.loaders import MarketData
from ..orders.intents import OrderIntent
from .runner import run_backtest


def fingerprint(intent: OrderIntent) -> tuple:
    return (
        intent.ts.isoformat(),
        intent.kind.value,
        intent.trade_id,
        intent.leg_index,
        None if intent.price is None else round(intent.price, 9),
        None if intent.qty is None else round(intent.qty, 9),
        intent.reason,
    )


@dataclass(frozen=True)
class Divergence:
    cutoff: datetime
    position: int
    full: tuple | None
    truncated: tuple | None


@dataclass
class AuditResult:
    checkpoints: list[datetime]
    divergences: list[Divergence]

    @property
    def clean(self) -> bool:
        return not self.divergences

    def report(self) -> str:
        if self.clean:
            return f"lookahead audit: clean over {len(self.checkpoints)} checkpoints"
        head = self.divergences[0]
        return (
            f"lookahead audit: FAILED at {head.cutoff.isoformat()} "
            f"(intent #{head.position})\n  full:      {head.full}\n  truncated: {head.truncated}"
        )


def decision_points(data: MarketData, cfg: Config, limit: int | None = None) -> list[datetime]:
    """Bar closes at which the engine actually decided something."""
    result = run_backtest(data, cfg)
    seen: list[datetime] = []
    for intent in result.intents:
        if not seen or seen[-1] != intent.ts:
            seen.append(intent.ts)
    if limit is not None and len(seen) > limit:
        stride = max(1, len(seen) // limit)
        seen = seen[::stride]
    return seen


def lookahead_audit(
    data: MarketData,
    cfg: Config,
    checkpoints: list[datetime] | None = None,
    limit: int | None = 40,
) -> AuditResult:
    full = [fingerprint(i) for i in run_backtest(data, cfg).intents]
    marks = checkpoints if checkpoints is not None else decision_points(data, cfg, limit)

    divergences: list[Divergence] = []
    for cutoff in marks:
        truncated = [fingerprint(i) for i in run_backtest(data.truncate(cutoff), cfg).intents]
        expected = [f for f in full if datetime.fromisoformat(f[0]) <= cutoff]
        for pos in range(max(len(expected), len(truncated))):
            a = expected[pos] if pos < len(expected) else None
            b = truncated[pos] if pos < len(truncated) else None
            if a != b:
                divergences.append(Divergence(cutoff=cutoff, position=pos, full=a, truncated=b))
                break
    return AuditResult(checkpoints=marks, divergences=divergences)
