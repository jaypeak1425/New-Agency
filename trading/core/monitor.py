"""Operational risk — the part everyone skips.

Infrastructure failure will cost you more than strategy failure in year one, so
these exist before any alpha does. All four are small, and all four are the
difference between "the bridge dropped a message" and "the bridge dropped a
message and I found out on Thursday".
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class Heartbeat:
    """Liveness for a feed or a bridge. Silence is the failure mode that looks
    exactly like 'nothing is happening', which is why it needs its own alarm."""

    name: str
    max_silence: timedelta = timedelta(minutes=5)
    flatten_on_silence: bool = False
    last_seen: datetime | None = None

    def ping(self, ts: datetime) -> None:
        self.last_seen = ts

    def stale(self, now: datetime) -> bool:
        return self.last_seen is None or (now - self.last_seen) > self.max_silence

    def check(self, now: datetime) -> str | None:
        if not self.stale(now):
            return None
        silent = "never seen" if self.last_seen is None else f"silent {now - self.last_seen}"
        action = " — flattening" if self.flatten_on_silence else ""
        return f"heartbeat {self.name}: {silent}{action}"


@dataclass
class StaleDataGuard:
    """Never trade on a bar older than twice its own timeframe."""

    timeframe: timedelta
    multiple: float = 2.0

    def fresh(self, bar_ts: datetime, now: datetime) -> bool:
        return (now - bar_ts) <= self.timeframe * self.multiple

    def check(self, bar_ts: datetime, now: datetime) -> str | None:
        if self.fresh(bar_ts, now):
            return None
        return (
            f"stale data: last bar {bar_ts.isoformat()} is {now - bar_ts} old, "
            f"limit {self.timeframe * self.multiple}. Not trading on it."
        )


@dataclass
class IdempotencyGuard:
    """TradingView can and does fire the same alert twice.

    Every payload carries a UUID; the receiver rejects repeats. Without this,
    a duplicate webhook opens a second position at full size and the reconciler
    finds out about it fifteen minutes later.
    """

    horizon: int = 10_000
    _seen: dict[str, datetime] = field(default_factory=dict)
    _order: list[str] = field(default_factory=list)

    def accept(self, uid: str, ts: datetime) -> bool:
        """True the first time a UUID is seen, False on every repeat."""
        if not uid:
            raise ValueError("refusing an alert with no id — idempotency is not optional")
        if uid in self._seen:
            return False
        self._seen[uid] = ts
        self._order.append(uid)
        while len(self._order) > self.horizon:
            self._seen.pop(self._order.pop(0), None)
        return True

    def __len__(self) -> int:
        return len(self._seen)


@dataclass(frozen=True)
class Break:
    symbol: str
    believed: float
    actual: float

    @property
    def delta(self) -> float:
        return self.actual - self.believed

    def __str__(self) -> str:
        return f"{self.symbol}: believed {self.believed:+.8g}, broker says {self.actual:+.8g} (delta {self.delta:+.8g})"


@dataclass
class Reconciliation:
    """Compare what the system believes it holds against what the broker holds.

    Webhook systems drop messages. This is how you find out — on a timer, not
    when the P&L stops making sense. Any mismatch halts, because a system that
    is wrong about its own positions cannot be right about anything downstream.
    """

    tolerance: float = 1e-8
    every: timedelta = timedelta(minutes=15)
    last_run: datetime | None = None

    def due(self, now: datetime) -> bool:
        return self.last_run is None or (now - self.last_run) >= self.every

    def compare(
        self,
        believed: dict[str, float],
        actual: dict[str, float],
        now: datetime | None = None,
    ) -> list[Break]:
        if now is not None:
            self.last_run = now
        breaks: list[Break] = []
        for symbol in sorted(set(believed) | set(actual)):
            mine = believed.get(symbol, 0.0)
            theirs = actual.get(symbol, 0.0)
            if abs(mine - theirs) > self.tolerance:
                breaks.append(Break(symbol, mine, theirs))
        return breaks

    @staticmethod
    def report(breaks: list[Break]) -> str:
        if not breaks:
            return "reconciliation: clean"
        lines = [f"RECONCILIATION BREAK ({len(breaks)}) — HALT AND INVESTIGATE"]
        lines += [f"  {b}" for b in breaks]
        return "\n".join(lines)
