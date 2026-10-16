"""Direct Mode checks for the isolated, read-only GitHub access probe."""

from types import SimpleNamespace


def test_github_probe_keeps_reported_egress_ip_and_redacts_token_shapes(
        direct_deploy, direct_vm):
    probe = direct_deploy(
        "evidence/github-access-diagnostic/github_api_probe.py", sdk_version="v0.2.16")
    response = SimpleNamespace(
        body=(b'{"message":"API rate limit exceeded for 203.0.113.10; '
              b'Bearer abc.def.secret and ghp_123456789012345678901234567890"}'),
        headers={
            "X-RateLimit-Remaining": b"0",
            "X-RateLimit-Reset": b"1767226800",
            "X-GitHub-Request-Id": b"req-probe-1",
            "Authorization": b"Bearer must-not-escape",
        },
    )

    body = probe._body_prefix(response)
    headers = probe._safe_headers(response)

    assert "203.0.113.10" in body
    assert "Bearer [redacted]" in body
    assert "[redacted-token]" in body
    assert "must-not-escape" not in str(headers)
    assert headers["x-ratelimit-remaining"] == "0"
    assert headers["x-github-request-id"] == "req-probe-1"

