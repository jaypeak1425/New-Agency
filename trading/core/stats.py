"""Overfitting statistics — the G1 gate.

Backtest overfitting is not a risk you avoid by being careful; it is a
mechanical consequence of trying configurations. Bailey and López de Prado
showed that impressive backtest performance is easy to manufacture after only a
handful of trials, and that overfit strategies do not merely fail to outperform
out of sample — they systematically *under*perform, because the noise you fitted
is mean-reverting.

So the raw Sharpe of your best configuration is not evidence. Two things make
it evidence:

* the **Deflated Sharpe Ratio**, which asks whether this Sharpe beats the best
  Sharpe you would *expect* from that many trials on pure noise, and corrects
  for short samples, negative skew and fat tails; and
* the **Probability of Backtest Overfitting**, which asks how often the
  configuration that won in-sample lands below median out-of-sample.

Both need the trial count, which is why `core/trials.py` exists and why it
insists on recording the configurations you abandoned.

Pure stdlib: the normal CDF comes from `math.erf`, its inverse from Acklam's
rational approximation.
"""

from __future__ import annotations

import itertools
import math
import random
from dataclasses import dataclass
from typing import Sequence

EULER_MASCHERONI = 0.5772156649015329


# --------------------------------------------------------------- normal dist
def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


_A = (-3.969683028665376e01, 2.209460984245205e02, -2.759285104469687e02,
      1.383577518672690e02, -3.066479806614716e01, 2.506628277459239e00)
_B = (-5.447609879822406e01, 1.615858368580409e02, -1.556989798598866e02,
      6.680131188771972e01, -1.328068155288572e01)
_C = (-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e00,
      -2.549732539343734e00, 4.374664141464968e00, 2.938163982698783e00)
_D = (7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e00,
      3.754408661907416e00)


def norm_ppf(p: float) -> float:
    """Inverse standard normal CDF (Acklam), accurate to about 1e-9."""
    if not 0.0 < p < 1.0:
        raise ValueError("norm_ppf needs 0 < p < 1")
    plow, phigh = 0.02425, 1.0 - 0.02425
    if p < plow:
        q = math.sqrt(-2.0 * math.log(p))
        return (((((_C[0] * q + _C[1]) * q + _C[2]) * q + _C[3]) * q + _C[4]) * q + _C[5]) / \
               ((((_D[0] * q + _D[1]) * q + _D[2]) * q + _D[3]) * q + 1.0)
    if p > phigh:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        return -(((((_C[0] * q + _C[1]) * q + _C[2]) * q + _C[3]) * q + _C[4]) * q + _C[5]) / \
                ((((_D[0] * q + _D[1]) * q + _D[2]) * q + _D[3]) * q + 1.0)
    q = p - 0.5
    r = q * q
    return (((((_A[0] * r + _A[1]) * r + _A[2]) * r + _A[3]) * r + _A[4]) * r + _A[5]) * q / \
           (((((_B[0] * r + _B[1]) * r + _B[2]) * r + _B[3]) * r + _B[4]) * r + 1.0)


# ------------------------------------------------------------------ moments
@dataclass(frozen=True)
class Moments:
    n: int
    mean: float
    stdev: float
    skew: float
    kurtosis: float       # non-excess: 3.0 for a normal distribution

    @property
    def sharpe(self) -> float:
        """Per-observation Sharpe. Not annualized — the DSR formula wants it raw."""
        return 0.0 if self.stdev <= 0 else self.mean / self.stdev


def moments(returns: Sequence[float]) -> Moments:
    n = len(returns)
    if n < 2:
        return Moments(n, 0.0, 0.0, 0.0, 3.0)
    mean = sum(returns) / n
    var = sum((r - mean) ** 2 for r in returns) / (n - 1)
    sd = math.sqrt(var)
    # A constant series does not have a standard deviation of exactly zero in
    # floating point — it has something like 1e-18, and dividing by that reports
    # a Sharpe of 5e15. Judge degeneracy against the scale of the data, not
    # against zero: a strategy that barely trades produces near-constant returns,
    # and it must not come out of here looking like the best trade ever made.
    scale = max(abs(mean), max((abs(r) for r in returns), default=0.0))
    if sd <= 1e-12 * max(scale, 1e-300):
        return Moments(n, mean, 0.0, 0.0, 3.0)
    m3 = sum((r - mean) ** 3 for r in returns) / n
    m4 = sum((r - mean) ** 4 for r in returns) / n
    pop_sd = math.sqrt(sum((r - mean) ** 2 for r in returns) / n)
    return Moments(n, mean, sd, m3 / pop_sd**3, m4 / pop_sd**4)


def annualized_sharpe(returns: Sequence[float], periods_per_year: float) -> float:
    m = moments(returns)
    return m.sharpe * math.sqrt(periods_per_year)


def returns_from_equity(curve: Sequence) -> list[float]:
    """Simple per-bar returns from an equity curve of ``EquityPoint``."""
    values = [p.equity for p in curve]
    out = []
    for prev, cur in zip(values, values[1:]):
        if prev > 0:
            out.append(cur / prev - 1.0)
    return out


# ------------------------------------------------- probabilistic / deflated
def probabilistic_sharpe_ratio(
    returns: Sequence[float], benchmark_sr: float = 0.0
) -> float:
    """P(true Sharpe > benchmark), correcting for sample length, skew and tails.

    Negative skew and fat tails both *reduce* it: the same Sharpe earned with a
    long left tail is less trustworthy, which is exactly the correction a trend
    sleeve (positive skew) and a mean-reversion sleeve (negative skew) need in
    opposite directions.
    """
    m = moments(returns)
    if m.n < 3 or m.stdev <= 0:
        return 0.0
    sr = m.sharpe
    denom = 1.0 - m.skew * sr + ((m.kurtosis - 1.0) / 4.0) * sr * sr
    if denom <= 0:
        return 0.0
    return norm_cdf((sr - benchmark_sr) * math.sqrt(m.n - 1) / math.sqrt(denom))


def expected_max_sharpe(trial_sharpes: Sequence[float]) -> float:
    """SR*: the Sharpe you would expect the *best* of N trials to show on noise.

    This is the number the candidate has to beat. It grows with the trial count
    and with the dispersion between trials, which is why a wide grid search
    raises its own hurdle.
    """
    n = len(trial_sharpes)
    if n < 2:
        return 0.0
    mean = sum(trial_sharpes) / n
    var = sum((s - mean) ** 2 for s in trial_sharpes) / (n - 1)
    if var <= 0:
        return 0.0
    g = EULER_MASCHERONI
    term = (1.0 - g) * norm_ppf(1.0 - 1.0 / n) + g * norm_ppf(1.0 - 1.0 / (n * math.e))
    return math.sqrt(var) * term


@dataclass(frozen=True)
class DeflatedSharpe:
    sharpe: float               # per-observation, of the candidate
    benchmark_sharpe: float     # SR*, expected max across the trials
    dsr: float                  # probability the true Sharpe beats SR*
    psr: float                  # probability the true Sharpe beats zero
    trials: int
    observations: int
    skew: float
    kurtosis: float

    def passes(self, threshold: float = 0.95) -> bool:
        return self.dsr >= threshold

    def __str__(self) -> str:
        return (
            f"SR {self.sharpe:+.4f}/obs vs SR* {self.benchmark_sharpe:+.4f} over "
            f"{self.trials} trials, {self.observations} obs "
            f"(skew {self.skew:+.2f}, kurt {self.kurtosis:.2f})\n"
            f"  PSR {self.psr:.4f}   DSR {self.dsr:.4f}"
        )


def deflated_sharpe_ratio(
    candidate_returns: Sequence[float], trial_sharpes: Sequence[float]
) -> DeflatedSharpe:
    """The candidate's Sharpe, deflated by how many things you tried.

    ``trial_sharpes`` must include the candidate and every other configuration
    you ran, abandoned ones included. Leaving failures out is the single easiest
    way to make this statistic lie in your favour.
    """
    m = moments(candidate_returns)
    sr_star = expected_max_sharpe(trial_sharpes)
    return DeflatedSharpe(
        sharpe=m.sharpe,
        benchmark_sharpe=sr_star,
        dsr=probabilistic_sharpe_ratio(candidate_returns, sr_star),
        psr=probabilistic_sharpe_ratio(candidate_returns, 0.0),
        trials=len(trial_sharpes),
        observations=m.n,
        skew=m.skew,
        kurtosis=m.kurtosis,
    )


# ------------------------------------------------------------------- PBO
@dataclass(frozen=True)
class PBOResult:
    pbo: float                    # P(the in-sample winner is below median OOS)
    combinations: int
    trials: int
    median_logit: float
    oos_ranks: tuple[float, ...]

    def passes(self, threshold: float = 0.5) -> bool:
        return self.pbo < threshold

    @property
    def is_noisy(self) -> bool:
        """A PBO from few trials is itself a noisy estimate.

        On pure noise this statistic averages ~0.5 but individual draws range
        roughly 0.2-0.8 with 20 trials. Do not read one PBO of 0.35 as a pass
        that means anything; read a PBO of 0.8 as a clear fail.
        """
        return self.trials < 30 or self.combinations < 100

    def __str__(self) -> str:
        return (
            f"PBO {self.pbo:.3f} over {self.combinations} splits of {self.trials} trials "
            f"(median logit {self.median_logit:+.3f})\n"
            f"  {'pass' if self.passes() else 'FAIL'} — "
            f"{'the in-sample winner usually holds up' if self.passes() else 'the in-sample winner is usually noise'}"
            + ("\n  NOTE: few trials — this estimate is itself noisy, treat a marginal pass as unproven"
               if self.is_noisy else "")
        )


def _sharpe_of(block: Sequence[float]) -> float:
    m = moments(block)
    return m.sharpe


def probability_of_backtest_overfitting(
    matrix: Sequence[Sequence[float]],
    splits: int = 12,
    max_combinations: int = 2000,
    seed: int = 0,
) -> PBOResult:
    """PBO by combinatorially symmetric cross-validation.

    ``matrix`` is observations x trials: one column of returns per configuration
    tested, all on the same time index.

    Chop the timeline into ``splits`` blocks, take every way of choosing half of
    them as in-sample, pick the trial that wins in-sample, and look at where it
    ranks out-of-sample. If the in-sample winner lands below the median
    out-of-sample more often than not, your selection procedure is fitting
    noise — and note that this measures *the procedure*, not any one strategy.
    """
    rows = [list(r) for r in matrix]
    if not rows or not rows[0]:
        return PBOResult(0.0, 0, 0, 0.0, ())
    n_trials = len(rows[0])
    if n_trials < 2:
        return PBOResult(0.0, 0, n_trials, 0.0, ())
    if splits % 2 or splits < 4:
        raise ValueError("splits must be an even number >= 4")

    t = len(rows)
    if t < splits * 2:
        raise ValueError(f"need at least {splits * 2} observations for {splits} splits, got {t}")

    size = t // splits
    blocks = [rows[i * size:(i + 1) * size] for i in range(splits)]
    blocks[-1].extend(rows[splits * size:])

    all_combos = list(itertools.combinations(range(splits), splits // 2))
    if len(all_combos) > max_combinations:
        all_combos = random.Random(seed).sample(all_combos, max_combinations)

    logits: list[float] = []
    ranks: list[float] = []
    for combo in all_combos:
        chosen = set(combo)
        is_rows = [row for i in chosen for row in blocks[i]]
        oos_rows = [row for i in range(splits) if i not in chosen for row in blocks[i]]
        if len(is_rows) < 2 or len(oos_rows) < 2:
            continue

        is_sr = [_sharpe_of([row[c] for row in is_rows]) for c in range(n_trials)]
        best = max(range(n_trials), key=lambda c: is_sr[c])

        oos_sr = [_sharpe_of([row[c] for row in oos_rows]) for c in range(n_trials)]
        target = oos_sr[best]
        below = sum(1 for s in oos_sr if s < target)
        ties = sum(1 for s in oos_sr if s == target)
        # Relative rank in (0,1); ties share the interval so a flat trial set
        # lands at 0.5 rather than at an arbitrary end.
        omega = (below + 0.5 * ties) / n_trials
        omega = min(max(omega, 1e-6), 1.0 - 1e-6)
        ranks.append(omega)
        logits.append(math.log(omega / (1.0 - omega)))

    if not logits:
        return PBOResult(0.0, 0, n_trials, 0.0, ())
    pbo = sum(1 for x in logits if x <= 0) / len(logits)
    ordered = sorted(logits)
    mid = len(ordered) // 2
    median = ordered[mid] if len(ordered) % 2 else 0.5 * (ordered[mid - 1] + ordered[mid])
    return PBOResult(pbo, len(logits), n_trials, median, tuple(ranks))
