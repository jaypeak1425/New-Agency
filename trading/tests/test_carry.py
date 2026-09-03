"""Sleeve 7 — carry economics, the cost gate, and the churn trap."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from breakout.types import Bar, Direction
from core.feeds.funding import (
    EIGHT_HOURLY,
    HOURLY,
    FundingPoint,
    FundingSnapshot,
    parse_funding_history,
    parse_prices_snapshot,
)
from core.feeds.synthetic import FundingSpec, make_funding
from core.sleeves import MarketContext, Sleeve
from core.sleeves.carry import (
    CarryConfig,
    CarrySleeve,
    CarryTrade,
    backtest_carry,
    rolling_zscore,
    screen,
)

T0 = datetime(2024, 1, 1, tzinfo=timezone.utc)


def series(rates, premiums=None, symbol="BTC") -> list[FundingPoint]:
    premiums = premiums if premiums is not None else [0.0] * len(rates)
    return [
        FundingPoint(symbol, T0 + timedelta(hours=i), r, p)
        for i, (r, p) in enumerate(zip(rates, premiums))
    ]


# ------------------------------------------------------------- the interval
def test_the_funding_interval_is_an_eight_times_error_if_you_get_it_wrong():
    """Hyperliquid pays hourly; most CEX perps pay 8-hourly. Same rate, very
    different annualized number, and it is the same direction every time."""
    p = FundingPoint("BTC", T0, 0.0000125)
    assert p.annualized(HOURLY) == pytest.approx(0.1095)
    assert p.annualized(EIGHT_HOURLY) == pytest.approx(0.0136875)
    assert p.annualized(HOURLY) / p.annualized(EIGHT_HOURLY) == pytest.approx(8.0)


def test_funding_history_parsing_and_ordering():
    rows = [
        {"coin": "BTC", "fundingRate": "0.00002", "premium": "0.0002", "time": 1_700_003_600_000},
        {"coin": "BTC", "fundingRate": "0.00001", "premium": "0.0001", "time": 1_700_000_000_000},
        {"nonsense": True},
    ]
    points = parse_funding_history(rows, "BTC")
    assert [p.rate for p in points] == [0.00001, 0.00002]      # sorted by time
    assert points[0].premium == 0.0001


def test_prices_snapshot_ranks_richest_funding_first():
    snap = parse_prices_snapshot({
        "prices": {"BTC": "93200", "ETH": "3175", "SOL": "150"},
        "funding_rates": {"BTC": "0.00002", "ETH": "-0.00001", "SOL": "0.00005"},
        "open_interest": {"BTC": "1000"},
    })
    assert [s for s, _ in snap.ranked()] == ["SOL", "BTC", "ETH"]
    assert snap.annualized()["ETH"] < 0


# ------------------------------------------------------------- the economics
def test_a_narrowing_basis_pays_and_a_widening_one_costs():
    """long spot + short perp: price PnL = (entry premium - exit premium)."""
    narrowing = CarryTrade("BTC", T0, 0, entry_premium=0.002, entry_carry=0.2,
                           notional=10_000, exit_premium=0.000)
    widening = CarryTrade("BTC", T0, 0, entry_premium=0.000, entry_carry=0.2,
                          notional=10_000, exit_premium=0.002)
    assert narrowing.basis_pnl == pytest.approx(20.0)
    assert widening.basis_pnl == pytest.approx(-20.0)


def test_positive_funding_pays_the_short_perp_leg():
    points = series([0.0001] * 200, [0.0] * 200)
    result = backtest_carry(points, CarryConfig(entry_cost_bps=0, exit_cost_bps=0,
                                                min_carry_over_cost=0, smoothing_intervals=1))
    assert result.funding_pnl > 0
    assert result.funding_share == pytest.approx(1.0)


def test_pnl_decomposes_into_funding_plus_basis_minus_costs():
    trade = CarryTrade("BTC", T0, 0, entry_premium=0.001, entry_carry=0.2,
                       notional=10_000, exit_premium=0.0, funding_pnl=25.0, costs=20.0)
    assert trade.basis_pnl == pytest.approx(10.0)
    assert trade.net_pnl == pytest.approx(25.0 + 10.0 - 20.0)


# ------------------------------------------------------------- the cost gate
def test_the_entry_hurdle_is_the_larger_of_min_carry_and_the_cost_multiple():
    cfg = CarryConfig(min_carry=0.01, min_carry_over_cost=3.0,
                      entry_cost_bps=5.0, exit_cost_bps=5.0)
    assert cfg.round_trip_cost_fraction == pytest.approx(0.002)     # 2 legs x 2 sides x 5bp
    # Funding at 0.4% annualized clears min_carry=1%? No — and it must not clear
    # 3x the round trip either. Nothing should trade.
    thin = series([0.0000005] * 500)
    assert backtest_carry(thin, cfg).closed == []


def test_funding_that_barely_clears_fees_is_not_an_edge():
    cfg_loose = CarryConfig(min_carry=0.0, min_carry_over_cost=0.0)
    cfg_gated = CarryConfig(min_carry=0.0, min_carry_over_cost=3.0)
    marginal = series([0.0000003] * 800)          # ~0.26% annualized, under any real cost
    assert backtest_carry(marginal, cfg_loose).closed != []
    assert backtest_carry(marginal, cfg_gated).closed == []


def test_costs_are_charged_on_both_legs_both_sides():
    rich = series([0.0002] * 100)
    cfg = CarryConfig(entry_cost_bps=5.0, exit_cost_bps=5.0, notional=10_000,
                      min_carry_over_cost=0, smoothing_intervals=1, max_hold_intervals=50)
    trade = backtest_carry(rich, cfg).closed[0]
    assert trade.costs == pytest.approx(10_000 * 0.002)     # 2 legs x (5+5) bps


# ------------------------------------------------------------------ exits
def test_the_position_closes_when_funding_turns_negative():
    points = series([0.0002] * 40 + [-0.0002] * 40)
    result = backtest_carry(points, CarryConfig(smoothing_intervals=1, min_carry_over_cost=0))
    assert result.closed[0].exit_reason == "funding_flipped_negative"


def test_the_position_closes_when_carry_decays_below_the_exit_threshold():
    points = series([0.0002] * 40 + [0.0000001] * 40)
    result = backtest_carry(points, CarryConfig(smoothing_intervals=1, min_carry_over_cost=0,
                                                exit_carry=0.02))
    assert result.closed[0].exit_reason == "carry_decayed"


def test_max_hold_bounds_the_position():
    points = series([0.0002] * 500)
    result = backtest_carry(points, CarryConfig(max_hold_intervals=30, min_carry_over_cost=0,
                                                smoothing_intervals=1))
    assert result.closed[0].exit_reason == "max_hold"
    assert result.closed[0].intervals == 30


# ------------------------------------------------------------- the churn trap
def test_smoothing_the_signal_cuts_the_churn_that_eats_the_yield():
    """Hourly funding flips negative constantly. Reacting to every print pays a
    two-leg round trip each time, which is how a sleeve with a real yield still
    loses money."""
    funding = make_funding()
    twitchy = backtest_carry(funding, CarryConfig(smoothing_intervals=1))
    smoothed = backtest_carry(funding, CarryConfig(smoothing_intervals=24))

    assert len(smoothed.closed) < len(twitchy.closed) / 2
    assert smoothed.costs < twitchy.costs
    assert twitchy.net_pnl < 0 < smoothed.net_pnl
    # The yield was always there; the churn was handing it to the exchange.
    assert twitchy.funding_pnl > 0


def test_entry_and_exit_share_one_signal_so_they_cannot_fight():
    """An earlier version smoothed only the exit and churned *worse* the more it
    smoothed: entry fired on a spike the lagging mean had not seen. Trade count
    must fall as the window grows, not rise."""
    funding = make_funding()
    counts = [len(backtest_carry(funding, CarryConfig(smoothing_intervals=n)).closed)
              for n in (1, 8, 24, 72)]
    assert counts == sorted(counts, reverse=True), counts


# ---------------------------------------------------------- attribution
def test_a_basis_bet_is_called_out_rather_than_counted_as_carry():
    """Tiny funding, big favourable basis move: the P&L is real but it did not
    come from carry, and sizing it as carry would be a mistake."""
    rates = [0.00004] * 60
    premiums = [0.02] * 30 + [0.0] * 30
    result = backtest_carry(series(rates, premiums),
                            CarryConfig(min_carry_over_cost=0, smoothing_intervals=1,
                                        max_hold_intervals=45))
    assert result.basis_pnl > result.funding_pnl
    assert result.funding_share < 0.5
    assert "basis bet wearing a carry trade's clothes" in result.report()


# --------------------------------------------------------- liquidation risk
def test_the_short_leg_can_be_liquidated_while_the_book_is_delta_neutral():
    """The combined position is hedged; the short perp's margin account is not."""
    rates = [0.0003] * 300
    points = series(rates)
    calm = [Bar(p.ts, 100.0, 100.5, 99.5, 100.0, 1.0) for p in points]
    spiked = list(calm)
    spiked[250] = Bar(points[250].ts, 100.0, 180.0, 99.5, 175.0, 1.0)

    cfg = CarryConfig(min_carry_over_cost=0, smoothing_intervals=1, max_hold_intervals=1000)
    assert backtest_carry(points, cfg, prices=calm).liquidations == 0
    hit = backtest_carry(points, cfg, prices=spiked)
    assert hit.liquidations == 1
    assert hit.closed[0].exit_reason == "short_leg_liquidated"
    assert hit.closed[0].liquidated


def test_without_prices_liquidation_cannot_be_simulated_at_all():
    points = series([0.0003] * 300)
    result = backtest_carry(points, CarryConfig(min_carry_over_cost=0, smoothing_intervals=1))
    assert result.liquidations == 0        # not "safe" — unmodelled, per the docstring


# ------------------------------------------------------------------ screen
def test_the_screen_applies_the_cost_hurdle_not_just_a_ranking():
    snap = FundingSnapshot(
        ts=T0,
        rates={"RICH": 0.00005, "THIN": 0.0000002, "NEG": -0.00002},
        prices={"RICH": 10.0, "THIN": 10.0, "NEG": 10.0},
        open_interest={},
    )
    picked = screen(snap, CarryConfig(min_carry=0.10))
    assert [s for s, _ in picked] == ["RICH"]


def test_rolling_zscore_measures_richness_against_the_symbol_s_own_history():
    flat = [0.00001] * 100
    assert rolling_zscore(flat, 100) == 0.0                  # no dispersion, not a divide by zero
    spike = flat[:-1] + [0.0005]
    assert rolling_zscore(spike, 100) > 3.0
    assert rolling_zscore([0.001] * 3, 100) is None          # too little history to judge


# ------------------------------------------------------------------ sleeve
def test_the_carry_sleeve_satisfies_the_protocol_and_is_tier_one():
    s = CarrySleeve()
    assert isinstance(s, Sleeve)
    assert s.tier == 1                       # two legs, two venues: never Pine
    assert s.eligible_markets == {"crypto"}


def test_an_entry_emits_two_legs_in_opposite_directions():
    sleeve = CarrySleeve(CarryConfig(min_carry=0.10, notional=10_000))
    snap = FundingSnapshot(ts=T0, rates={"BTC": 0.00005}, prices={"BTC": 100.0},
                           open_interest={})
    bar = Bar(T0, 100.0, 100.0, 100.0, 100.0, 1.0)
    ctx = MarketContext("BTC", "crypto", "1h", bar, 100_000.0,
                        extras={"funding_snapshot": snap})

    intents = sleeve.signals(ctx)
    assert len(intents) == 2
    assert {i.direction for i in intents} == {Direction.LONG, Direction.SHORT}
    assert all(i.qty == pytest.approx(100.0) for i in intents)     # equal notional
    assert sleeve.signals(ctx) == []          # already on, does not double up


def test_the_sleeve_is_inert_without_a_funding_snapshot():
    sleeve = CarrySleeve()
    bar = Bar(T0, 100.0, 100.0, 100.0, 100.0, 1.0)
    assert sleeve.signals(MarketContext("BTC", "crypto", "1h", bar, 100_000.0)) == []
    assert sleeve.signals(MarketContext("BTC", "equities", "1h", bar, 100_000.0)) == []


def test_the_synthetic_fixture_has_the_shape_carry_trades_on():
    funding = make_funding(FundingSpec(hours=24 * 90))
    annualized = [p.annualized(HOURLY) for p in funding]
    assert sum(annualized) / len(annualized) > 0             # positive on average
    assert any(a < 0 for a in annualized)                    # but flips negative
    assert len(funding) == 24 * 90
