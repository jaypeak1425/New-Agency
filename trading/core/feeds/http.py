"""Minimal HTTP with retry. Stdlib only.

The whole package avoids third-party dependencies, feeds included: a data
adapter that drags in `requests` becomes a dependency of the backtester, and
the backtester should be runnable on a bare interpreter.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field

RETRY_STATUS = frozenset({429, 500, 502, 503, 504})


class FeedError(RuntimeError):
    """A feed call that failed in a way the caller should see, not swallow."""

    def __init__(self, message: str, status: int | None = None, body: str = "") -> None:
        super().__init__(message)
        self.status = status
        self.body = body[:2000]


@dataclass
class HttpClient:
    base_url: str
    headers: dict[str, str] = field(default_factory=dict)
    timeout: float = 30.0
    max_retries: int = 4
    backoff: float = 2.0
    user_agent: str = "breakout-retest/0.1 (+stdlib urllib)"

    def _request(self, method: str, url: str, body: bytes | None = None) -> object:
        headers = {"User-Agent": self.user_agent, "Accept": "application/json", **self.headers}
        if body is not None:
            headers["Content-Type"] = "application/json"
        last: Exception | None = None

        for attempt in range(self.max_retries + 1):
            req = urllib.request.Request(url, data=body, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                text = exc.read().decode("utf-8", "replace")
                if exc.code in (401, 403):
                    # Never retry an auth failure — it is a key problem, and
                    # hammering a dead key gets the whole IP rate limited.
                    raise FeedError(
                        f"{exc.code} from {url.split('?')[0]}: check the API key "
                        f"(env var, not a literal) and that it is still valid",
                        exc.code,
                        text,
                    ) from exc
                if exc.code not in RETRY_STATUS or attempt == self.max_retries:
                    raise FeedError(f"HTTP {exc.code} from {url.split('?')[0]}", exc.code, text) from exc
                last = exc
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
                if attempt == self.max_retries:
                    raise FeedError(f"{type(exc).__name__} calling {url.split('?')[0]}: {exc}") from exc
                last = exc
            time.sleep(self.backoff * (2**attempt))

        raise FeedError(f"exhausted retries calling {url}: {last}")   # pragma: no cover

    def get(self, path: str, params: dict | None = None) -> object:
        url = self.base_url.rstrip("/") + path
        if params:
            clean = {k: v for k, v in params.items() if v is not None}
            if clean:
                url = f"{url}?{urllib.parse.urlencode(clean)}"
        return self._request("GET", url)

    def post_json(self, path: str, payload: dict) -> object:
        url = self.base_url.rstrip("/") + path
        return self._request("POST", url, json.dumps(payload).encode("utf-8"))
