"""Daily resistance -> 1H breakout -> retest entry.

A multi-timeframe breakout system that buys the pullback into the zone between
a broken daily level and the 1H close that broke it, rather than chasing the
break itself.

Nothing here is financial advice. It is a system specification made executable;
any result it produces is a hypothesis until it survives data you have never
looked at.
"""

from .config import Config
from .types import Bar, Direction

__all__ = ["Config", "Bar", "Direction", "__version__"]

__version__ = "0.1.0"
