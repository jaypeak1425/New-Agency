"""Overfitting statistics, the trial log, and the G1 gate."""

from __future__ import annotations

import math
import random
import statistics

import pytest

from core.stats import (
    annualized_sharpe,
    deflated_sharpe_ratio,
    expected_max_sharpe,
    moments,
    norm_cdf,
    norm_ppf,
    probabilistic_sharpe_ratio,
    probability_of_backtest_overfitting,
    returns_from_equity,
)
from core.trials import TrialLog, g1_gate


def noise(n: int, seed: int, mu: float = 0.0, sd: float = 0.01) -> list[float]:
    rng = random.Random(seed)
    return [rng.gauss(mu, sd) for _ in range(n)]


# ------------------------------------------------------------ distributions
@pytest.mark.parametrize("p", [0.001, 0.025, 0.1, 0.5, 0.9, 0.975, 0.999])
def test_norm_ppf_inverts_norm_cdf(p):
    assert norm_cdf(norm_ppf(p)) == pytest.approx(p, abs=1e-8)


def test_known_normal_quantiles():
    assert norm_ppf(0.975) == pytest.approx(1.959963985, abs=1e-6)
    assert norm_cdf(0.0) == pytest.approx(0.5)


def test_moments_recover_a_known_distribution():
    m = moments(noise(20000, 7, mu=0.001, sd=0.02))
    assert m.mean == pytest.approx(0.001, abs=5e-4)
    assert m.stdev == pytest.approx(0.02, rel=0.05)
    assert m.skew == pytest.approx(0.0, abs=0.1)
    assert m.kurtosis == pytest.approx(3.0, abs=0.2)   # non-excess


def test_moments_degrade_gracefully_on_tiny_or_flat_samples():
    assert moments([]).sharpe == 0.0
    assert moments([0.01]).sharpe == 0.0
    assert moments([0.01] * 10).sharpe == 0.0          # constant series
    assert moments([1e6 + 1e-9 * i for i in range(50)]).sharpe == 0.0   # near-constant


# --------------------------------------------------------------- PSR / DSR
def test_psr_rises_with_sample_length_for_the_same_sharpe():
    short = probabilistic_sharpe_ratio(noise(30, 1, mu=0.002))
    long = probabilistic_sharpe_ratio(noise(3000, 1, mu=0.002))
    assert long > short


def test_negative_skew_is_penalised_relative_to_positive_skew():
    """The same Sharpe earned with a long left tail is worth less, which is the
    correction that separates a trend sleeve from a mean-reversion one."""
    base = noise(600, 3, mu=0.002, sd=0.01)
    left = sorted(base)
    right = sorted(base, reverse=True)
    # Build series with identical mean/sd but opposite skew.
    neg = [x for x in base] + [-0.08]
    pos = [x for x in base] + [0.08]
    assert moments(neg).skew < 0 < moments(pos).skew
    assert probabilistic_sharpe_ratio(neg) < probabilistic_sharpe_ratio(pos)
    assert left and right


def test_expected_max_sharpe_grows_with_the_number_of_trials():
    spread = [0.05 * i for i in range(-10, 11)]
    few = expected_max_sharpe(spread[:5])
    many = expected_max_sharpe(spread * 20)
    assert many > few > 0
    assert expected_max_sharpe([0.1]) == 0.0          # one trial has no dispersion


def test_dsr_refuses_to_promote_the_best_of_many_noise_trials():
    """The whole point. Two hundred coin flips produce a winner with a
    spectacular annualized Sharpe and a PSR that says 'certainly positive'.
    The DSR is the statistic that is not fooled."""
    n_trials, n_obs = 200, 500
    columns = [noise(n_obs, seed=s) for s in range(n_trials)]
    sharpes = [moments(c).sharpe for c in columns]
    best = max(range(n_trials), key=lambda c: sharpes[c])

    assert annualized_sharpe(columns[best], 24 * 365) > 5.0     # looks amazing
    assert probabilistic_sharpe_ratio(columns[best]) > 0.95     # PSR is fooled

    dsr = deflated_sharpe_ratio(columns[best], sharpes)
    assert dsr.benchmark_sharpe > 0
    assert not dsr.passes(0.95)                                  # DSR is not


def test_dsr_promotes_a_genuine_edge_found_among_few_trials():
    real = noise(2000, 42, mu=0.004, sd=0.01)          # SR ~0.4/obs, unmistakable
    others = [noise(2000, seed=s) for s in range(8)]
    sharpes = [moments(real).sharpe] + [moments(c).sharpe for c in others]
    assert deflated_sharpe_ratio(real, sharpes).passes(0.95)


# --------------------------------------------------------------------- PBO
def test_pbo_is_near_a_half_on_pure_noise():
    """Calibration check. Individual draws are noisy, so this averages several."""
    values = []
    for seed in range(8):
        rng = random.Random(seed)
        matrix = [[rng.gauss(0, 0.01) for _ in range(20)] for _ in range(300)]
        values.append(probability_of_backtest_overfitting(matrix, splits=10, max_combinations=126).pbo)
    assert 0.35 < statistics.mean(values) < 0.7


def test_pbo_is_near_zero_when_one_configuration_genuinely_wins():
    rng = random.Random(11)
    matrix = [[rng.gauss(0, 0.01) for _ in range(20)] for _ in range(400)]
    for row in matrix:
        row[0] += 0.004
    result = probability_of_backtest_overfitting(matrix, splits=10, max_combinations=252)
    assert result.pbo < 0.1
    assert result.passes()


def test_pbo_flags_its_own_noisiness_on_a_thin_trial_set():
    rng = random.Random(5)
    matrix = [[rng.gauss(0, 0.01) for _ in range(6)] for _ in range(200)]
    result = probability_of_backtest_overfitting(matrix, splits=10, max_combinations=252)
    assert result.is_noisy
    assert "noisy" in str(result)


def test_pbo_rejects_impossible_split_configurations():
    matrix = [[0.01, 0.02] for _ in range(100)]
    with pytest.raises(ValueError):
        probability_of_backtest_overfitting(matrix, splits=7)
    with pytest.raises(ValueError):
        probability_of_backtest_overfitting([[0.01, 0.02]] * 10, splits=12)


# --------------------------------------------------------------- trial log
def test_the_log_counts_abandoned_trials_too(tmp_path):
    """A log of only the winners produces a DSR that lies in your favour."""
    log = TrialLog(path=str(tmp_path / "trials.json"))
    log.record("winner", {"atr_mult": 2.5}, noise(400, 1, mu=0.003))
    for s in range(30):
        log.record(f"abandoned-{s}", {"atr_mult": s}, noise(400, 100 + s), abandoned=True)

    honest = log.deflate("winner")
    dishonest = deflated_sharpe_ratio(log.get("winner").returns, [log.get("winner").sharpe])
    assert honest.trials == 31
    assert honest.benchmark_sharpe > dishonest.benchmark_sharpe
    assert honest.dsr < dishonest.dsr        # counting failures lowers the score


def test_the_log_survives_the_session(tmp_path):
    path = str(tmp_path / "trials.json")
    log = TrialLog(path=path)
    log.record("a", {"x": 1}, noise(50, 1), trade_count=12, note="first pass")
    reloaded = TrialLog.load(path)
    assert len(reloaded) == 1
    assert reloaded.get("a").params == {"x": 1}
    assert reloaded.get("a").trade_count == 12
    assert reloaded.get("a").note == "first pass"


def test_matrix_truncates_to_the_shortest_trial():
    log = TrialLog()
    log.record("a", {}, noise(100, 1))
    log.record("b", {}, noise(60, 2))
    matrix = log.matrix()
    assert len(matrix) == 60 and len(matrix[0]) == 2


def test_deflating_an_unknown_trial_is_an_error():
    with pytest.raises(KeyError):
        TrialLog().deflate("nope")


def test_returns_from_equity_ignores_a_zero_start():
    from breakout.engine.loop import EquityPoint
    from datetime import datetime, timedelta, timezone

    t0 = datetime(2024, 1, 1, tzinfo=timezone.utc)
    curve = [EquityPoint(t0 + timedelta(hours=i), i, e) for i, e in enumerate([100.0, 110.0, 99.0])]
    rets = returns_from_equity(curve)
    assert rets == pytest.approx([0.1, -0.1])


# --------------------------------------------------------------- the G1 gate
def test_g1_fails_a_noise_winner_and_says_why():
    log = TrialLog()
    for s in range(60):
        log.record(f"cfg-{s}", {"seed": s}, noise(400, s), trade_count=120)
    best = max(log.trials, key=lambda t: t.sharpe)
    result = g1_gate(log, best.label, walk_forward_expectancy=0.01, stressed_expectancy=0.01)
    assert not result.passed
    assert "DO NOT PROMOTE" in result.report()
    assert any("Deflated Sharpe" in c.name and not c.passed for c in result.checks)


def test_g1_fails_on_trade_count_even_with_a_good_sharpe():
    log = TrialLog()
    log.record("thin", {}, noise(400, 1, mu=0.004), trade_count=12)
    for s in range(5):
        log.record(f"other-{s}", {}, noise(400, 50 + s), trade_count=12)
    result = g1_gate(log, "thin", walk_forward_expectancy=0.2, stressed_expectancy=0.1)
    assert not result.passed
    assert any(c.name == "Trade count" and not c.passed for c in result.checks)


def test_g1_requires_walk_forward_and_stress_to_have_actually_been_run():
    log = TrialLog()
    log.record("x", {}, noise(400, 1, mu=0.004), trade_count=500)
    for s in range(5):
        log.record(f"o-{s}", {}, noise(400, 60 + s), trade_count=500)
    result = g1_gate(log, "x")
    names = {c.name: c for c in result.checks}
    assert not names["Positive in walk-forward"].passed
    assert not names["Survives 2x cost assumptions"].passed
    assert "not run" in names["Positive in walk-forward"].detail


def test_g1_can_pass_a_genuine_edge():
    log = TrialLog()
    log.record("real", {}, noise(3000, 42, mu=0.005, sd=0.01), trade_count=450)
    for s in range(6):
        log.record(f"o-{s}", {}, noise(3000, 70 + s), trade_count=450)
    result = g1_gate(log, "real", walk_forward_expectancy=0.15, stressed_expectancy=0.05, splits=10)
    assert result.passed, result.report()
    assert "PROMOTE to G2" in result.report()
