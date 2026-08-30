"""Breakout filters.

Each filter is independently switchable and reports *why* it rejected, because
every rejection is logged and re-examined later (§7). The filters are
hypotheses, not truths: a filter that saves fewer losses than the winners it
skips should be turned off, and the rejection log is how you find that out.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from ..config import Config
from .context import BarContext


@dataclass(frozen=True)
class FilterResult:
    passed: bool
    detail: str = ""


@dataclass(frozen=True)
class Filter:
    name: str
    enabled: Callable[[Config], bool]
    check: Callable[[BarContext, Config], FilterResult]


def _volume(ctx: BarContext, cfg: Config) -> FilterResult:
    if ctx.avg_volume is None:
        return FilterResult(False, "insufficient volume history")
    threshold = cfg.vol_mult * ctx.avg_volume
    ok = ctx.bar.volume > threshold
    return FilterResult(ok, f"volume={ctx.bar.volume:.4g} threshold={threshold:.4g}")


def _compression(ctx: BarContext, cfg: Config) -> FilterResult:
    if ctx.vol_rank_before is None:
        return FilterResult(False, "insufficient realized-vol history")
    ok = ctx.vol_rank_before <= cfg.compression_pctile
    return FilterResult(ok, f"vol_rank={ctx.vol_rank_before:.2f} max={cfg.compression_pctile:.2f}")


def _body(ctx: BarContext, cfg: Config) -> FilterResult:
    frac = ctx.bar.body_frac
    return FilterResult(frac >= cfg.min_body_frac, f"body_frac={frac:.4f} min={cfg.min_body_frac:.4f}")


FILTERS: tuple[Filter, ...] = (
    Filter("volume", lambda c: c.require_volume, _volume),
    Filter("compression", lambda c: c.require_compression, _compression),
    Filter("body", lambda c: c.require_body, _body),
)


def active_filters(cfg: Config) -> tuple[Filter, ...]:
    return tuple(f for f in FILTERS if f.enabled(cfg))


def first_rejection(ctx: BarContext, cfg: Config) -> tuple[str, str] | None:
    """Return ``(filter_name, detail)`` for the first filter that kills the bar."""
    for flt in active_filters(cfg):
        result = flt.check(ctx, cfg)
        if not result.passed:
            return flt.name, result.detail
    return None
