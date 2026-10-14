"""Mocked-provider checks for the production contract's provenance boundary.

These tests exercise parsing and hash-binding logic in Direct Mode. They do not
prove that live GitHub, GenLayer validators, or deployed commit signatures are
trustworthy.
"""

import hashlib
import json
import re
import pytest


PUBLISHER = "0x" + "a" * 40
REPO = "bibidee/revigate"
SHA = "a" * 40
BRANCH_HEAD = "b" * 40
TREE = "c" * 40
RULE_PATH = "rules/program.md"
MANIFEST_PATH = ".revigate/publisher.json"
RULE_TEXT = "## R-01: Eligibility\nParticipants qualify.\n\n## R-02: Benefit\nParticipants receive access.\n"


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def mock_response(direct_vm, url: str, body: str, status: int = 200):
    direct_vm.mock_web(re.escape(url), {"method": "GET", "status": status, "body": body})


def mock_valid_snapshot(
    direct_vm, *, signed=True, membership_status="ahead", rule_text=RULE_TEXT,
    commit_sha=SHA, branch_head=BRANCH_HEAD, compare_base_sha=None,
    candidate_status="ahead", rule_response_text=None, commit_html_url=None,
    tree_truncated=False, tree_response_body=None, signature="test-signature",
    payload="test-payload", verified_at="2026-01-01T00:00:00Z",
):
    rule_bytes = rule_text.encode("utf-8")
    manifest_bytes = json.dumps({
        "protocol": "revigate-v1",
        "network_chain_id": 61999,
        "rulebook_path": RULE_PATH,
        "publisher_wallet": PUBLISHER,
    }, separators=(",", ":")).encode("utf-8")
    rule_blob = git_blob_sha(rule_bytes)
    manifest_blob = git_blob_sha(manifest_bytes)

    commit = {
        "sha": commit_sha,
        "html_url": commit_html_url or f"https://github.com/{REPO}/commit/{commit_sha}",
        "commit": {
            "verification": {"verified": signed, "reason": "valid" if signed else "unsigned",
                             "signature": signature if signed else None,
                             "payload": payload if signed else None,
                             "verified_at": verified_at if signed else None},
            "tree": {"sha": TREE},
        },
    }
    branch = {"name": "release/v1", "commit": {"sha": branch_head}}
    comparison = {
        "status": membership_status,
        "base_commit": {"sha": commit_sha},
        "merge_base_commit": {"sha": commit_sha},
        "head_commit": {"sha": branch_head},
    }
    tree = {
        "truncated": tree_truncated,
        "tree": [
            {"path": RULE_PATH, "sha": rule_blob, "type": "blob"},
            {"path": MANIFEST_PATH, "sha": manifest_blob, "type": "blob"},
        ],
    }

    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/commits/{commit_sha}", json.dumps(commit))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/branches/release%2Fv1", json.dumps(branch))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/compare/{commit_sha}...{branch_head}", json.dumps(comparison))
    if compare_base_sha:
        ancestry = {
            "status": candidate_status,
            "base_commit": {"sha": compare_base_sha},
            "merge_base_commit": {"sha": compare_base_sha if candidate_status == "ahead" else "d" * 40},
            "head_commit": {"sha": commit_sha},
        }
        mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/compare/{compare_base_sha}...{commit_sha}", json.dumps(ancestry))
    mock_response(
        direct_vm,
        f"https://api.github.com/repos/{REPO}/git/trees/{TREE}?recursive=1",
        tree_response_body if tree_response_body is not None else json.dumps(tree),
    )
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{commit_sha}/{RULE_PATH}", rule_response_text if rule_response_text is not None else rule_bytes.decode("utf-8"))
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{commit_sha}/{MANIFEST_PATH}", manifest_bytes.decode("utf-8"))


def propose(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate_registry.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.register_program(REPO, RULE_PATH, MANIFEST_PATH, "release/v1", SHA)
    return contract, program_id


def test_T02_signed_source_manifest_and_slash_branch_are_bound_to_exact_git_bytes(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "VERIFIED"
    assert result["sha"] == SHA
    assert result["text"] == RULE_TEXT
    assert len(result["digest"]) == 64
    assert set(result["clauses"]) == {"R-01", "R-02"}


def test_T03_unverified_commit_signature_never_verifies_program(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, signed=False)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert "signature" in result["reason"]
    assert contract.programs[program_id].status == "PROPOSED"
    assert contract.programs[program_id].epoch == 0


@pytest.mark.parametrize("missing", ("signature", "payload", "verified_at"))
def test_T03_verified_flag_without_complete_github_attestation_is_inconclusive(
        direct_deploy, direct_vm, missing):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, **{missing: ""})
    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")
    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "commit signature not verified"


def test_T03_source_paths_reject_urls_traversal_spaces_and_backslashes(direct_deploy, direct_vm):
    contract, _ = propose(direct_deploy, direct_vm)
    assert contract._safe_path("rules/program.md")
    for unsafe in ("../rules.md", "rules//book.md", "rules\\book.md", "https://evil.test/x.md",
                   "rules/book%2f.md", "rules/book name.md", "/rules/book.md"):
        assert not contract._safe_path(unsafe)


def test_T03_branch_membership_mismatch_never_verifies_program(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, membership_status="diverged")

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "commit is not a member of the declared branch"
    assert contract.programs[program_id].status == "PROPOSED"
    assert contract.programs[program_id].epoch == 0


def test_T03_provider_repository_identity_mismatch_is_inconclusive(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, commit_html_url=f"https://github.com/another-owner/revigate/commit/{SHA}")

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "commit repository identity mismatch"


def test_T04_source_bytes_with_bad_clause_structure_are_inconclusive(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    malformed = "## R-01: Eligibility\nParticipants qualify.\n"
    mock_valid_snapshot(direct_vm, rule_text=malformed)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "rulebook structure invalid"


def test_T04_duplicate_clause_ids_are_inconclusive(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    duplicate_ids = "## R-01: First\nOne.\n\n## R-01: Duplicate\nTwo.\n\n## R-02: Last\nThree.\n"
    mock_valid_snapshot(direct_vm, rule_text=duplicate_ids)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "rulebook structure invalid"


def test_T04_oversized_rulebook_is_inconclusive(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    oversized = RULE_TEXT + ("x" * 8192)
    mock_valid_snapshot(direct_vm, rule_text=oversized)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "rulebook exceeds size bound"


def test_T35_source_bytes_must_match_the_authenticated_tree_blob(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, rule_response_text=RULE_TEXT.replace("access", "arbitrary access"))

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "rulebook bytes do not match authenticated commit tree"


def test_T35_rate_limited_commit_lookup_is_inconclusive(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/commits/{SHA}", '{"message":"rate limited"}', status=429)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "commit unavailable or mismatched"


def test_T35_oversized_provider_tree_response_is_rejected_before_json_parsing(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, tree_response_body="x" * 1_000_001)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "commit tree unavailable or truncated"


def test_T39_truncated_provider_tree_is_inconclusive(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    mock_valid_snapshot(direct_vm, tree_truncated=True)

    result = contract._fetch_source(contract.programs[program_id], SHA, True, "")

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "commit tree unavailable or truncated"


def test_T40_revision_sibling_of_current_commit_fails_ancestry_check(direct_deploy, direct_vm):
    contract, program_id = propose(direct_deploy, direct_vm)
    candidate = "e" * 40
    mock_valid_snapshot(
        direct_vm, commit_sha=candidate, branch_head="f" * 40,
        compare_base_sha=SHA, candidate_status="diverged",
    )

    result = contract._fetch_source(contract.programs[program_id], candidate, True, SHA)

    assert result["status"] == "INCONCLUSIVE"
    assert result["reason"] == "candidate is not a descendant"
