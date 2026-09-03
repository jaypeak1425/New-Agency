"""Allocation and portfolio volatility targeting.

The sleeves produce signals; this layer produces the return profile. Two jobs:

* decide each sleeve's weight (§4.1), and
* scale the whole book to a volatility target (§4.2).

Both are deliberately boring. `base_weight` comes from prior conviction rather
than backtest Sharpe — backtest Sharpe is the most overfit number you own, and
allocating by it compounds the overfit into the portfolio. The performance
multiplier is bounded to [0.5, 1.5] for the same reason: mild adaptation, not a
momentum bet on your own strategies.

The regime gate here consumes posteriors from outside. **The HMM that produces
them is Phase 2 and is not built** — with no posterior supplied, every sleeve
weights at 1.0 and the gate is inert, so the rest of the stack runs today and
gains the regime dimension when the model lands.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Sequence

Matrix = list[list[float]]


# ------------------------------------------------------------- regime gate
@dataclass
class RegimeGate:
    """Anti-whipsaw, per §2.3. All three defenses, because one is not enough.

    Raw HMM labels flicker, and flickering regimes destroy Sharpe through
    turnover — you pay the spread on every false transition. So: asymmetric
    entry/exit thresholds, plus a confirmation delay before either fires.
    """

    enter_above: float = 0.65
    leave_below: float = 0.40
    confirm_bars: int = 3
    current: int | None = None
    _entering: int | None = field(default=None, repr=False)
    _entry_streak: int = field(default=0, repr=False)
    _exit_streak: int = field(default=0, repr=False)
    transitions: list[tuple[object, int | None, int, dict]] = field(default_factory=list)

    def update(self, posterior: dict[int, float], ts: object = None) -> int | None:
        """Feed one bar's posterior; return the confirmed regime (or None)."""
        if not posterior:
            return self.current

        candidate = max(posterior, key=lambda k: posterior[k])
        p_candidate = posterior[candidate]

        if self.current is None:
            if p_candidate >= self.enter_above:
                self._entry_streak = self._entry_streak + 1 if self._entering == candidate else 1
                self._entering = candidate
                if self._entry_streak >= self.confirm_bars:
                    self._commit(candidate, ts, posterior)
            else:
                self._entering, self._entry_streak = None, 0
            return self.current

        p_current = posterior.get(self.current, 0.0)
        if p_current < self.leave_below:
            self._exit_streak += 1
        else:
            self._exit_streak = 0
            self._entering, self._entry_streak = None, 0
            return self.current

        if candidate != self.current and p_candidate >= self.enter_above:
            self._entry_streak = self._entry_streak + 1 if self._entering == candidate else 1
            self._entering = candidate
        else:
            self._entering, self._entry_streak = None, 0

        if self._exit_streak >= self.confirm_bars and self._entry_streak >= self.confirm_bars:
            self._commit(self._entering, ts, posterior)
        return self.current

    def _commit(self, regime: int, ts: object, posterior: dict[int, float]) -> None:
        # Every transition is logged with the posterior that caused it. When the
        # system underperforms, this log is the first place to look.
        self.transitions.append((ts, self.current, regime, dict(posterior)))
        self.current = regime
        self._entering, self._entry_streak, self._exit_streak = None, 0, 0


# ------------------------------------------------------------- allocation
def performance_multiplier(returns: Sequence[float], lo: float = 0.5, hi: float = 1.5) -> float:
    """Bounded adaptation to a sleeve's own recent results."""
    n = len(returns)
    if n < 5:
        return 1.0
    mean = sum(returns) / n
    var = sum((r - mean) ** 2 for r in returns) / (n - 1)
    sd = math.sqrt(var)
    if sd <= 0:
        return 1.0
    return max(lo, min(hi, 1.0 + math.tanh(mean / sd * math.sqrt(n))))


def correlation_penalty(name: str, series: dict[str, list[float]]) -> float:
    """Downweight a sleeve for how much it duplicates the rest of the book.

    Three trend variants are not diversification. This is the number that says
    so out loud, so a book that has quietly converged gets sized like the single
    bet it has become.
    """
    others = [k for k in series if k != name and len(series[k]) > 2]
    if name not in series or len(series[name]) < 3 or not others:
        return 1.0
    from core.risk import average_pairwise_correlation

    correlations = [
        average_pairwise_correlation({name: series[name], other: series[other]})
        for other in others
    ]
    mean_corr = max(0.0, sum(correlations) / len(correlations))
    return 1.0 / (1.0 + mean_corr)


@dataclass
class Allocation:
    name: str
    base: float
    regime: float
    performance: float
    correlation: float

    @property
    def raw(self) -> float:
        return self.base * self.regime * self.performance * self.correlation

    def __str__(self) -> str:
        return (
            f"{self.name:<20} base {self.base:.3f} x regime {self.regime:.3f} "
            f"x perf {self.performance:.3f} x corr {self.correlation:.3f} = {self.raw:.4f}"
        )


def allocate(
    base_weights: dict[str, float],
    regime_weights: dict[str, float] | None = None,
    sleeve_returns: dict[str, list[float]] | None = None,
) -> dict[str, Allocation]:
    """sleeve_weight = base x P(regime) x recent-performance x correlation-penalty.

    Returns the factors as well as the product, because when a sleeve is sized
    surprisingly small you need to see which of the four did it.
    """
    regime_weights = regime_weights or {}
    sleeve_returns = sleeve_returns or {}
    return {
        name: Allocation(
            name=name,
            base=base,
            regime=regime_weights.get(name, 1.0),
            performance=performance_multiplier(sleeve_returns.get(name, [])),
            correlation=correlation_penalty(name, sleeve_returns),
        )
        for name, base in base_weights.items()
    }


def normalised_weights(allocations: dict[str, Allocation]) -> dict[str, float]:
    total = sum(a.raw for a in allocations.values())
    if total <= 0:
        return {name: 0.0 for name in allocations}
    return {name: a.raw / total for name, a in allocations.items()}


# ------------------------------------------------------- volatility target
def ewma_covariance(series: dict[str, list[float]], halflife: float = 60.0) -> tuple[list[str], Matrix]:
    """EWMA covariance with a 60-period half-life.

    Sample covariance on a short window is unstable and produces nonsense
    weights, so this is the input to shrinkage rather than the answer itself.
    """
    names = sorted(k for k, v in series.items() if len(v) > 1)
    if not names:
        return [], []
    n = min(len(series[k]) for k in names)
    cols = {k: series[k][-n:] for k in names}

    decay = 0.5 ** (1.0 / halflife)
    weights = [decay ** (n - 1 - i) for i in range(n)]
    total = sum(weights)
    weights = [w / total for w in weights]
    means = {k: sum(w * x for w, x in zip(weights, cols[k])) for k in names}

    cov: Matrix = []
    for a in names:
        row = []
        for b in names:
            row.append(sum(
                w * (x - means[a]) * (y - means[b])
                for w, x, y in zip(weights, cols[a], cols[b])
            ))
        cov.append(row)
    return names, cov


def shrink_to_constant_correlation(cov: Matrix, intensity: float = 0.3) -> Matrix:
    """Ledoit-Wolf style shrinkage toward a constant-correlation target."""
    k = len(cov)
    if k < 2 or not 0.0 <= intensity <= 1.0:
        return [row[:] for row in cov]
    sd = [math.sqrt(max(cov[i][i], 0.0)) for i in range(k)]

    corrs = [
        cov[i][j] / (sd[i] * sd[j])
        for i in range(k) for j in range(i + 1, k)
        if sd[i] > 0 and sd[j] > 0
    ]
    mean_corr = sum(corrs) / len(corrs) if corrs else 0.0

    out: Matrix = []
    for i in range(k):
        row = []
        for j in range(k):
            target = cov[i][j] if i == j else mean_corr * sd[i] * sd[j]
            row.append((1.0 - intensity) * cov[i][j] + intensity * target)
        out.append(row)
    return out


def portfolio_volatility(weights: Sequence[float], cov: Matrix, periods_per_year: float = 252.0) -> float:
    """Annualized portfolio vol from the full covariance matrix.

    Not the weighted sum of individual vols: that ignores correlation, and
    correlation is the entire reason a portfolio behaves differently from its
    parts.
    """
    k = len(weights)
    if k == 0 or len(cov) != k:
        return 0.0
    variance = sum(
        weights[i] * weights[j] * cov[i][j]
        for i in range(k) for j in range(k)
    )
    return math.sqrt(max(variance, 0.0) * periods_per_year)


def vol_target_scalar(
    target_vol: float,
    forecast_vol: float,
    lo: float = 0.25,
    hi: float = 2.0,
) -> float:
    """Scale the book toward the target, but never let the model demand
    extreme leverage. Start the target at 10% annualized, not 20% — you can
    raise it after a year of live data says you should."""
    if forecast_vol <= 0:
        return lo
    return max(lo, min(hi, target_vol / forecast_vol))
