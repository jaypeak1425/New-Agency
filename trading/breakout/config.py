"""Single source of truth for every tunable number in the system.

Nothing below this module is allowed to contain a magic number. If a value
influences behaviour it lives here, gets a default, and is validated at
construction.

Parameters marked (spec) are from section 5 of the build spec at their stated
defaults. The rest are values the spec references in prose but does not
tabulate, or guards the implementation needs; each carries a note.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Sequence

from .types import Direction

STOP_MODES = ("atr", "structure")
ZONE_UPPER_MODES = ("breakout_close", "breakout_high")
FIRST_CLOSE_REFERENCES = ("level", "trigger")


@dataclass(frozen=True)
class Config:
    # ------------------------------------------------------------------ side
    direction: Direction = Direction.LONG

    # ---------------------------------------------------------- levels (§2)
    pivot_lookback: int = 5                 # (spec) daily bars each side
    cluster_tol_atr: float = 0.5            # (spec) daily ATR units
    min_touches: int = 2                    # (spec)
    max_level_age_days: int = 180           # (spec)
    max_level_distance_atr: float = 10.0    # (spec)
    break_confirm_atr: float = 0.25         # referenced in §2, not tabulated
    atr_period_daily: int = 14              # daily ATR for the level layer
    count_retest_touches: bool = True       # count non-pivot retests as touches
    touch_tol_atr: float = 0.25             # daily ATR band that counts as a touch
    touch_cooldown_bars: int = 3            # min daily bars between counted touches

    # --------------------------------------------------------- signals (§3)
    break_buffer_pct: float = 0.001         # (spec)
    require_volume: bool = False            # (spec: individually switchable)
    vol_mult: float = 1.5                   # (spec)
    vol_lookback: int = 20                  # "20-bar average" (§3)
    require_compression: bool = False
    compression_pctile: float = 25.0        # (spec)
    compression_lookback: int = 20          # "20-bar realized vol" (§3)
    compression_history_bars: int = 1560    # "trailing year" of 1H bars
    require_body: bool = False
    min_body_frac: float = 0.5              # (spec)
    # §3 says the prior bar must have closed "at or below the level". With a
    # large break_buffer_pct that means a bar closing inside the buffer band
    # spends the "first close through" condition without arming anything.
    # "trigger" compares the prior close against the buffered trigger instead.
    first_close_reference: str = "level"    # or "trigger"

    # ---------------------------------------------------------- orders (§4)
    zone_upper: str = "breakout_close"      # (spec) or "breakout_high"
    n_entries: int = 2                      # (spec)
    entry_fractions: Sequence[float] = (0.33, 0.66)   # (spec) of zone depth
    entry_weights: Sequence[float] | None = None      # (spec) default equal
    stop_mode: str = "atr"                  # (spec) or "structure"
    atr_mult: float = 2.5                   # (spec)
    structure_buffer_atr: float = 0.5       # (spec)
    atr_period: int = 14                    # (spec) on 1H
    min_zone_depth_atr: float = 0.05        # guard: reject degenerate zones

    # ------------------------------------------------------------ risk (§4)
    risk_per_trade: float = 0.005           # (spec) 0.5% of equity
    max_position_pct: float = 0.15          # (spec)
    initial_equity: float = 100_000.0
    allow_fractional_qty: bool = True       # False rounds down to whole units

    # ------------------------------------------------------- lifecycle (§4)
    zone_expiry_bars: int = 12              # (spec)
    max_arms_per_level: int = 1             # §3 "no repeat firing" — arms per level
    cancel_on_close_back: bool = True       # §4 close back through level cancels
    exit_partial_on_invalidation: bool = True   # §4 exit the filled portion
    exit_full_on_invalidation: bool = False     # §4 is silent; off = stops govern
    max_open_trades: int | None = None      # concurrency cap; None = unlimited
    max_armed_zones: int | None = None      # armed-but-unfilled cap; None = unlimited
    trail_atr_mult: float = 3.0             # (spec)
    trail_activate_r: float = 1.0           # (spec)
    target_r: float | None = None           # (spec) optional hard target
    max_hold_bars: int = 120                # (spec)

    # -------------------------------------------------- execution / §7 sim
    optimistic_fills: bool = False          # (spec) True = fill on touch
    slippage_bps: float = 1.0               # adverse, on stop/market exits
    commission_bps: float = 0.5             # per side, on notional

    # ------------------------------------------------------------ data (§6)
    tz: str = "America/New_York"
    session_close: str = "16:00"

    # cached, derived
    _weights: tuple[float, ...] = field(init=False, repr=False, default=())

    def __post_init__(self) -> None:
        if self.pivot_lookback < 1:
            raise ValueError("pivot_lookback must be >= 1")
        if self.atr_period < 1 or self.atr_period_daily < 1:
            raise ValueError("ATR periods must be >= 1")
        if self.stop_mode not in STOP_MODES:
            raise ValueError(f"stop_mode must be one of {STOP_MODES}")
        if self.first_close_reference not in FIRST_CLOSE_REFERENCES:
            raise ValueError(f"first_close_reference must be one of {FIRST_CLOSE_REFERENCES}")
        if self.zone_upper not in ZONE_UPPER_MODES:
            raise ValueError(f"zone_upper must be one of {ZONE_UPPER_MODES}")
        if self.n_entries != len(self.entry_fractions):
            raise ValueError("n_entries must match len(entry_fractions)")
        if self.n_entries < 1:
            raise ValueError("n_entries must be >= 1")
        for f in self.entry_fractions:
            if not 0.0 < f < 1.0:
                raise ValueError("entry_fractions must be strictly inside (0, 1)")
        if self.risk_per_trade <= 0:
            raise ValueError("risk_per_trade must be > 0")
        if not 0.0 < self.max_position_pct <= 1.0:
            raise ValueError("max_position_pct must be in (0, 1]")
        if not 0.0 < self.compression_pctile < 100.0:
            raise ValueError("compression_pctile must be in (0, 100)")
        if self.zone_expiry_bars < 1 or self.max_hold_bars < 1:
            raise ValueError("bar-count limits must be >= 1")
        if self.target_r is not None and self.target_r <= 0:
            raise ValueError("target_r must be > 0 when set")
        if self.max_arms_per_level < 1:
            raise ValueError("max_arms_per_level must be >= 1")
        for cap in (self.max_open_trades, self.max_armed_zones):
            if cap is not None and cap < 1:
                raise ValueError("concurrency caps must be >= 1 or None")

        if self.entry_weights is None:
            w = tuple(1.0 / self.n_entries for _ in range(self.n_entries))
        else:
            if len(self.entry_weights) != self.n_entries:
                raise ValueError("entry_weights must match n_entries")
            if any(x <= 0 for x in self.entry_weights):
                raise ValueError("entry_weights must be positive")
            total = float(sum(self.entry_weights))
            w = tuple(float(x) / total for x in self.entry_weights)
        object.__setattr__(self, "_weights", w)
        object.__setattr__(self, "entry_fractions", tuple(float(f) for f in self.entry_fractions))

    @property
    def weights(self) -> tuple[float, ...]:
        """Entry weights, normalised to sum to 1."""
        return self._weights

    def with_(self, **kwargs) -> "Config":
        """Return a copy with overrides — the only supported way to vary params."""
        kwargs.pop("_weights", None)
        return replace(self, **kwargs)
