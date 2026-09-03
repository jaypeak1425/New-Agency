"""The trial log, and the G1 promotion gate that reads it.

"Count your trials. Log every configuration tested, including abandoned ones.
The count is an input to the statistics, and you cannot reconstruct it later."

That last clause is why this persists to disk. The trial count is the single
input to the Deflated Sharpe Ratio that you cannot recover after the fact:
nobody remembers the eleven parameter sets they tried on a Tuesday and threw
away, and every one of them raised the bar the survivor has to clear. A trial
log that only contains the winners produces a DSR that lies in your favour.
"""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Sequence

from .stats import (
    DeflatedSharpe,
    PBOResult,
    annualized_sharpe,
    deflated_sharpe_ratio,
    moments,
    probability_of_backtest_overfitting,
)


@dataclass
class Trial:
    label: str
    params: dict
    returns: list[float]
    trade_count: int = 0
    note: str = ""
    abandoned: bool = False
    recorded_at: float = field(default_factory=time.time)

    @property
    def sharpe(self) -> float:
        return moments(self.returns).sharpe


@dataclass
class TrialLog:
    path: str | None = None
    periods_per_year: float = 24 * 365       # hourly bars on a 24/7 market
    trials: list[Trial] = field(default_factory=list)

    # ------------------------------------------------------------ recording
    def record(
        self,
        label: str,
        params: dict,
        returns: Sequence[float],
        trade_count: int = 0,
        note: str = "",
        abandoned: bool = False,
    ) -> Trial:
        trial = Trial(
            label=label,
            params=dict(params),
            returns=list(returns),
            trade_count=trade_count,
            note=note,
            abandoned=abandoned,
        )
        self.trials.append(trial)
        if self.path:
            self.save()
        return trial

    def __len__(self) -> int:
        return len(self.trials)

    def get(self, label: str) -> Trial | None:
        for t in self.trials:
            if t.label == label:
                return t
        return None

    @property
    def sharpes(self) -> list[float]:
        return [t.sharpe for t in self.trials]

    def matrix(self) -> list[list[float]]:
        """Observations x trials, truncated to the shortest common length."""
        if not self.trials:
            return []
        n = min(len(t.returns) for t in self.trials)
        if n == 0:
            return []
        return [[t.returns[i] for t in self.trials] for i in range(n)]

    # ---------------------------------------------------------- persistence
    def save(self, path: str | None = None) -> None:
        target = Path(path or self.path or "trials.json")
        target.write_text(
            json.dumps(
                {"periods_per_year": self.periods_per_year,
                 "trials": [asdict(t) for t in self.trials]},
                indent=1,
            )
        )

    @classmethod
    def load(cls, path: str) -> "TrialLog":
        raw = json.loads(Path(path).read_text())
        log = cls(path=path, periods_per_year=raw.get("periods_per_year", 24 * 365))
        log.trials = [Trial(**t) for t in raw.get("trials", [])]
        return log

    # ----------------------------------------------------------- statistics
    def deflate(self, label: str) -> DeflatedSharpe:
        trial = self.get(label)
        if trial is None:
            raise KeyError(f"no trial named {label!r}; recorded: {[t.label for t in self.trials]}")
        return deflated_sharpe_ratio(trial.returns, self.sharpes)

    def pbo(self, splits: int = 12, max_combinations: int = 2000) -> PBOResult:
        return probability_of_backtest_overfitting(
            self.matrix(), splits=splits, max_combinations=max_combinations
        )


# ------------------------------------------------------------------ the gate
@dataclass(frozen=True)
class GateCheck:
    name: str
    passed: bool
    detail: str

    def __str__(self) -> str:
        return f"[{'pass' if self.passed else 'FAIL'}] {self.name:<34} {self.detail}"


@dataclass
class G1Result:
    label: str
    checks: list[GateCheck]

    @property
    def passed(self) -> bool:
        return all(c.passed for c in self.checks)

    def report(self) -> str:
        head = f"--- G1 (backtest gate): {self.label} ---"
        tail = (
            "PROMOTE to G2 (holdout). You get one look at the holdout; spending it twice spends it."
            if self.passed
            else "DO NOT PROMOTE. Fix the failures above or cut the sleeve — do not re-tune "
                 "until it passes, because every retune is another trial and raises this bar."
        )
        return "\n".join([head, *[str(c) for c in self.checks], "", tail])


def g1_gate(
    log: TrialLog,
    label: str,
    walk_forward_expectancy: float | None = None,
    stressed_expectancy: float | None = None,
    dsr_threshold: float = 0.95,
    pbo_threshold: float = 0.5,
    min_trades: int = 100,
    splits: int = 12,
) -> G1Result:
    """The G1 gate from the promotion protocol, as code rather than intention.

    Written before there are positions and before there is an emotional stake,
    which is the only time it gets written honestly.
    """
    trial = log.get(label)
    if trial is None:
        raise KeyError(f"no trial named {label!r}")

    dsr = log.deflate(label)
    checks = [
        GateCheck(
            "Deflated Sharpe",
            dsr.dsr >= dsr_threshold,
            f"DSR {dsr.dsr:.3f} vs {dsr_threshold:.2f} "
            f"(raw SR {annualized_sharpe(trial.returns, log.periods_per_year):+.2f} ann., "
            f"{len(log)} trials counted)",
        ),
        GateCheck(
            "Trade count",
            trial.trade_count >= min_trades,
            f"{trial.trade_count} trades vs {min_trades} minimum",
        ),
    ]

    try:
        pbo = log.pbo(splits=splits)
        detail = f"PBO {pbo.pbo:.3f} vs {pbo_threshold:.2f} over {pbo.combinations} splits"
        if pbo.is_noisy:
            detail += " (few trials — noisy estimate)"
        checks.append(GateCheck("Probability of overfitting", pbo.pbo < pbo_threshold, detail))
    except ValueError as exc:
        checks.append(GateCheck("Probability of overfitting", False, f"could not compute: {exc}"))

    if walk_forward_expectancy is not None:
        checks.append(GateCheck(
            "Positive in walk-forward",
            walk_forward_expectancy > 0,
            f"pooled out-of-sample expectancy {walk_forward_expectancy:+.3f} R",
        ))
    else:
        checks.append(GateCheck("Positive in walk-forward", False, "not run — required by G1"))

    if stressed_expectancy is not None:
        checks.append(GateCheck(
            "Survives 2x cost assumptions",
            stressed_expectancy > 0,
            f"expectancy at doubled costs {stressed_expectancy:+.3f} R",
        ))
    else:
        checks.append(GateCheck("Survives 2x cost assumptions", False, "not run — required by G1"))

    return G1Result(label=label, checks=checks)
