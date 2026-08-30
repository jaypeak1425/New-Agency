"""What happened next.

Two populations get instrumented here, neither of which the engine is allowed
to see:

* **rejected signals** — every breakout a filter killed, with the filter that
  killed it and what price did over the following ``max_hold_bars``. Filters
  are hypotheses; this is the evidence that tells you which ones cost more than
  they save.
* **failed breaks** — every zone that closed back through its level. That is a
  candidate fade system on its own, so it is measured from the fade's side of
  the trade from the start.

Both are computed after the run, from recorded bar indices. They use future
data by construction, which is exactly why they are here and not in the engine.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..config import Config
from ..engine.loop import FailedBreak
from ..signals.breakout import RejectedSignal
from ..types import Bar, Direction


@dataclass(frozen=True)
class ForwardPath:
    """Excursions after an event, in ATR units, for a given direction."""

    bars: int
    mfe_atr: float
    mae_atr: float
    ret_atr: float
    ret_pct: float
    complete: bool   # False when the series ended before the horizon


def forward_path(
    bars: list[Bar],
    index: int,
    horizon: int,
    atr: float,
    direction: Direction,
    reference: float | None = None,
) -> ForwardPath | None:
    if atr <= 0 or index < 0 or index >= len(bars):
        return None
    ref = bars[index].close if reference is None else reference
    window = bars[index + 1 : index + 1 + horizon]
    if not window:
        return ForwardPath(0, 0.0, 0.0, 0.0, 0.0, complete=False)
    sign = direction.sign
    best = max(sign * (b.extreme(direction, favourable=True) - ref) for b in window)
    worst = min(sign * (b.extreme(direction, favourable=False) - ref) for b in window)
    end = sign * (window[-1].close - ref)
    return ForwardPath(
        bars=len(window),
        mfe_atr=round(best / atr, 4),
        mae_atr=round(worst / atr, 4),
        ret_atr=round(end / atr, 4),
        ret_pct=round(end / ref, 6) if ref else 0.0,
        complete=len(window) == horizon,
    )


@dataclass(frozen=True)
class RejectionOutcome:
    signal: RejectedSignal
    path: ForwardPath | None

    @property
    def filter_name(self) -> str:
        return self.signal.filter_name


@dataclass(frozen=True)
class FailedBreakOutcome:
    event: FailedBreak
    continuation: ForwardPath | None   # from the original trade's side
    fade: ForwardPath | None           # from the mirrored side


def enrich_rejections(
    rejected: list[RejectedSignal], hourly: list[Bar], cfg: Config
) -> list[RejectionOutcome]:
    return [
        RejectionOutcome(
            signal=r,
            path=forward_path(hourly, r.bar_index, cfg.max_hold_bars, r.atr, cfg.direction, r.price),
        )
        for r in rejected
    ]


def enrich_failed_breaks(
    failed: list[FailedBreak], hourly: list[Bar], cfg: Config
) -> list[FailedBreakOutcome]:
    out = []
    for f in failed:
        out.append(
            FailedBreakOutcome(
                event=f,
                continuation=forward_path(
                    hourly, f.fail_index, cfg.max_hold_bars, f.atr, cfg.direction, f.fail_close
                ),
                fade=forward_path(
                    hourly,
                    f.fail_index,
                    cfg.max_hold_bars,
                    f.atr,
                    cfg.direction.opposite,
                    f.fail_close,
                ),
            )
        )
    return out


def summarise_rejections(outcomes: list[RejectionOutcome]) -> dict[str, dict[str, float]]:
    """Per filter: how often it fired and what it gave up on average.

    ``mean_mfe_atr`` well above ``mean_mae_atr`` means the filter is throwing
    away trades that went on to work.
    """
    buckets: dict[str, list[RejectionOutcome]] = {}
    for o in outcomes:
        buckets.setdefault(o.filter_name, []).append(o)
    summary = {}
    for name, items in sorted(buckets.items()):
        paths = [i.path for i in items if i.path is not None]
        n = len(paths) or 1
        summary[name] = {
            "count": len(items),
            "mean_mfe_atr": round(sum(p.mfe_atr for p in paths) / n, 4),
            "mean_mae_atr": round(sum(p.mae_atr for p in paths) / n, 4),
            "mean_ret_atr": round(sum(p.ret_atr for p in paths) / n, 4),
        }
    return summary


def summarise_failed_breaks(outcomes: list[FailedBreakOutcome]) -> dict[str, float]:
    fades = [o.fade for o in outcomes if o.fade is not None]
    n = len(fades) or 1
    return {
        "count": len(outcomes),
        "with_fill": sum(1 for o in outcomes if o.event.had_fill),
        "fade_mean_mfe_atr": round(sum(p.mfe_atr for p in fades) / n, 4),
        "fade_mean_mae_atr": round(sum(p.mae_atr for p in fades) / n, 4),
        "fade_mean_ret_atr": round(sum(p.ret_atr for p in fades) / n, 4),
    }
