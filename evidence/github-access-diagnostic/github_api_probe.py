# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Disposable, read-only Studionet probe for the two GitHub API URLs in the 403 report."""

import json
import re

from genlayer import *


COMMIT_URL = (
    "https://api.github.com/repos/Bibidee/revigate/commits/"
    "7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10"
)
RATE_URL = "https://api.github.com/rate_limit"
MAX_DIAGNOSTIC_BODY = 512
SAFE_HEADERS = (
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "x-ratelimit-resource",
    "retry-after",
    "x-github-request-id",
)


class GitHubAccessProbe(gl.Contract):
    def _body_prefix(self, response) -> str:
        body = response.body
        if isinstance(body, bytes):
            value = body[:MAX_DIAGNOSTIC_BODY].decode("utf-8", errors="replace")
        else:
            value = str(body)[:MAX_DIAGNOSTIC_BODY]
        # The probe sends no credentials. Preserve a GitHub-reported requester IP
        # so an IP-based shared-egress limit can be distinguished from auth denial.
        value = re.sub(r"(?i)bearer\s+[A-Za-z0-9._~+/-]+=*", "Bearer [redacted]", value)
        value = re.sub(r"\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b",
                       "[redacted-token]", value)
        return value

    def _safe_headers(self, response) -> dict:
        try:
            headers = getattr(response, "headers", None)
        except Exception:
            headers = None
        if headers is None:
            return {}
        found = {}
        try:
            items = headers.items()
        except Exception:
            return {}
        for name, value in items:
            key = name.decode("ascii", "ignore") if isinstance(name, bytes) else str(name)
            key = key.lower().strip()
            if key not in SAFE_HEADERS:
                continue
            if isinstance(value, bytes):
                value = value.decode("ascii", "ignore")
            if isinstance(value, str) and value and len(value) <= 128:
                value = re.sub(r"(?i)bearer\s+[A-Za-z0-9._~+/-]+=*", "Bearer [redacted]", value)
                found[key] = value
        return found

    def _read_one(self, url: str) -> dict:
        response = gl.nondet.web.get(url)
        body = self._body_prefix(response)
        message = ""
        response_sha = ""
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                message = str(parsed.get("message", ""))[:240]
                response_sha = str(parsed.get("sha", ""))[:40]
        except Exception:
            pass
        return {
            "status": int(response.status),
            "message": message,
            "sha": response_sha,
            "body_prefix": body,
            "headers": self._safe_headers(response),
        }

    def _collect(self) -> dict:
        return {"commit": self._read_one(COMMIT_URL),
                "rate_limit": self._read_one(RATE_URL)}

    @gl.public.write
    def probe(self) -> dict:
        """Read two fixed public URLs; no contract state or value is changed."""
        def leader_fn():
            return self._collect()

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                leader = leader_result.calldata
                independent = self._collect()
                leader_commit = leader["commit"]
                independent_commit = independent["commit"]
                if leader_commit["status"] != independent_commit["status"]:
                    return False
                if leader_commit["status"] == 200:
                    if (leader_commit["sha"].lower()
                            != "7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10"):
                        return False
                    return independent_commit["sha"].lower() == leader_commit["sha"].lower()
                if leader_commit["message"] != independent_commit["message"]:
                    return False
                leader_rate = leader["rate_limit"]
                independent_rate = independent["rate_limit"]
                if leader_rate["status"] != independent_rate["status"]:
                    return False
                return (leader_rate["status"] == 200
                        or leader_rate["message"] == independent_rate["message"])
            except Exception:
                return False

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
