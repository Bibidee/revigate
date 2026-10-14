"""Direct Mode checks for Registry-specific provenance and revision state.

GitHub and GenLayer judgment are mocked here. These cases do not certify live
source verification, hosted validator agreement, or child-message finality.
"""

import hashlib
import datetime
import json
import re


PUBLISHER = "0x" + "a" * 40
REPO = "bibidee/revigate"
RULE_PATH = "rules/program.md"
MANIFEST_PATH = ".revigate/publisher.json"
BASE_SHA = "1" * 40
NEXT_SHA = "2" * 40
BRANCH_HEAD = "f" * 40
BASE_TEXT = "## R-01: Eligibility\nParticipants qualify after 14 days.\n\n## R-02: Benefit\nParticipants receive access.\n"
MATERIAL_TEXT = "## R-01: Eligibility\nParticipants qualify after 60 days.\n\n## R-02: Benefit\nParticipants receive access.\n"
NOW = 1_767_225_600


def blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def mock_response(direct_vm, url: str, body, status=200):
    direct_vm.mock_web(re.escape(url), {"method": "GET", "status": status, "body": body})


def mock_snapshot(direct_vm, sha: str, text: str, tree_sha: str, *, signed=True,
                  ancestry_base: str | None = None, candidate_status="ahead"):
    rule_bytes = text.encode("utf-8")
    manifest_bytes = json.dumps({
        "protocol": "revigate-v1", "network_chain_id": 61999,
        "rulebook_path": RULE_PATH, "publisher_wallet": PUBLISHER,
    }, separators=(",", ":")).encode("utf-8")
    commit = {
        "sha": sha, "html_url": f"https://github.com/{REPO}/commit/{sha}",
        "commit": {
            "verification": {"verified": signed, "reason": "valid" if signed else "unsigned",
                             "signature": "test-signature" if signed else None,
                             "payload": "test-payload" if signed else None,
                             "verified_at": "2026-01-01T00:00:00Z" if signed else None},
            "tree": {"sha": tree_sha},
        },
    }
    branch = {"name": "release/v1", "commit": {"sha": BRANCH_HEAD}}
    membership = {"status": "ahead", "ahead_by": 1, "behind_by": 0,
                  "base_commit": {"sha": sha}, "merge_base_commit": {"sha": sha},
                  "commits": [{"sha": BRANCH_HEAD}]}
    tree = {"truncated": False, "tree": [
        {"path": RULE_PATH, "sha": blob_sha(rule_bytes), "type": "blob"},
        {"path": MANIFEST_PATH, "sha": blob_sha(manifest_bytes), "type": "blob"},
    ]}
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/commits/{sha}", json.dumps(commit))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/branches/release%2Fv1", json.dumps(branch))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/compare/{sha}...{BRANCH_HEAD}", json.dumps(membership))
    if ancestry_base:
        ancestry = {"status": candidate_status, "ahead_by": 1, "behind_by": 0,
                    "base_commit": {"sha": ancestry_base},
                    "merge_base_commit": {"sha": ancestry_base if candidate_status == "ahead" else "d" * 40},
                    "commits": [{"sha": sha}]}
        mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/compare/{ancestry_base}...{sha}", json.dumps(ancestry))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/git/trees/{tree_sha}?recursive=1", json.dumps(tree))
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{sha}/{RULE_PATH}", rule_bytes.decode("utf-8"))
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{sha}/{MANIFEST_PATH}", manifest_bytes.decode("utf-8"))


def deploy_registry(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    direct_vm.check_pickling = True
    direct_vm.sender = PUBLISHER
    registry = direct_deploy("contracts/revigate_registry.py", sdk_version="v0.2.16")
    return registry


def propose(registry, direct_vm, sha=BASE_SHA):
    direct_vm.sender = PUBLISHER
    return registry.register_program(REPO, RULE_PATH, MANIFEST_PATH, "release/v1", sha)


def test_registry_registers_branch_and_requires_publisher_for_verification(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    assert registry.get_program(program_id)["branch"] == "release/v1"
    direct_vm.sender = "0x" + "c" * 40
    with direct_vm.expect_revert("Only the publisher may verify its proposed program"):
        registry.verify_program(program_id)
    assert registry.get_program(program_id)["status"] == "PROPOSED"


def test_registry_baseline_binds_signed_commit_and_not_nomination_bypass(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    mock_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40, signed=False)
    assert registry.verify_program(program_id) == "INCONCLUSIVE"
    assert registry.get_program(program_id)["epoch"] == 0
    assert registry.get_program(program_id)["status"] == "PROPOSED"


def test_registry_material_revision_advances_once_and_preserves_first_event(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    mock_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40)
    assert registry.verify_program(program_id) == "VERIFIED"
    assert registry.get_program(program_id)["epoch"] == 1

    review_id = registry.request_revision(program_id, NEXT_SHA)
    mock_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40)
    mock_snapshot(direct_vm, NEXT_SHA, MATERIAL_TEXT, "b" * 40, ancestry_base=BASE_SHA)
    direct_vm.mock_llm(
        "Assess materiality of a public program-rule revision",
        json.dumps({"outcome": "MATERIAL", "changed_ids": ["R-01"],
                    "rationale": "Mocked Direct Mode classification"}),
    )
    assert registry.assess_revision(review_id) == "MATERIAL"
    state = registry.get_program(program_id)
    assert state["active_sha"] == NEXT_SHA
    assert state["epoch"] == 2
    assert state["first_material_at"] == NOW
    assert state["material_event_count"] == 1
    assert registry.get_material_event_page(program_id, 0, 50) == {
        "items": [{"index": 1, "epoch": 2, "at": NOW}], "next_cursor": 0,
    }
    with direct_vm.expect_revert("Review is not pending"):
        registry.assess_revision(review_id)


def test_registry_inconclusive_review_preserves_each_source_authentication_failure(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    mock_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40)
    assert registry.verify_program(program_id) == "VERIFIED"

    review_id = registry.request_revision(program_id, NEXT_SHA)
    mock_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40)
    mock_snapshot(direct_vm, NEXT_SHA, MATERIAL_TEXT, "b" * 40,
                  ancestry_base=BASE_SHA, candidate_status="diverged")

    assert registry.assess_revision(review_id) == "INCONCLUSIVE"
    result = registry.get_review(review_id)["result"]
    assert result["base_source_status"] == "VERIFIED"
    assert result["base_source_reason"] == ""
    assert result["candidate_source_status"] == "INCONCLUSIVE"
    assert result["candidate_source_reason"] == "candidate is not a descendant"


def test_same_epoch_new_source_ack_is_recorded_and_exact_repeat_is_idempotent(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    program = registry.programs[program_id]
    program.status = "VERIFIED"
    program.epoch = 1
    program.active_sha = BASE_SHA
    program.document_digest = "a" * 64
    direct_vm.sender = "0x" + "b" * 40
    assert registry.acknowledge_rules(program_id, 1, BASE_SHA, "a" * 64)
    assert registry.acknowledge_rules(program_id, 1, BASE_SHA, "a" * 64)
    assert registry.acknowledgment_counts[f"{program_id}:{direct_vm.sender}"] == 1
    program.active_sha = NEXT_SHA
    program.document_digest = "b" * 64
    assert registry.acknowledge_rules(program_id, 1, NEXT_SHA, "b" * 64)
    page = registry.get_acknowledgment_page(program_id, direct_vm.sender, 0, 50)
    assert [item["sha"] for item in page["items"]] == [NEXT_SHA, BASE_SHA]
    assert [item["epoch"] for item in page["items"]] == [1, 1]


def test_ack_and_material_pages_are_bounded_and_cursor_stable(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    program = registry.programs[program_id]
    wallet = "0x" + "b" * 40
    for index in range(1, 121):
        registry._record_ack(program_id, wallet, index, f"{index:040x}", f"{index:064x}", index)
        registry._append_material_event(program, index, index)
    first = registry.get_acknowledgment_page(program_id, wallet, 0, 50)
    second = registry.get_acknowledgment_page(program_id, wallet, first["next_cursor"], 50)
    third = registry.get_acknowledgment_page(program_id, wallet, second["next_cursor"], 50)
    assert [len(first["items"]), len(second["items"]), len(third["items"])] == [50, 50, 20]
    assert first["items"][0]["index"] == 120 and third["items"][-1]["index"] == 1
    material = registry.get_material_event_page(program_id, 0, 50)
    assert len(material["items"]) == 50 and material["items"][0]["index"] == 120
    with direct_vm.expect_revert("Page size must be between 1 and 50"):
        registry.get_material_event_page(program_id, 0, 51)


def test_review_deadline_boundary_and_bounded_retry(direct_deploy, direct_vm):
    registry = deploy_registry(direct_deploy, direct_vm)
    program_id = propose(registry, direct_vm)
    program = registry.programs[program_id]
    program.status = "VERIFIED"
    program.epoch = 1
    program.active_sha = BASE_SHA
    program.document_digest = "a" * 64
    review_id = registry.request_revision(program_id, NEXT_SHA)
    deadline = int(registry.reviews[review_id].deadline)
    direct_vm.warp(datetime.datetime.fromtimestamp(deadline, datetime.timezone.utc).isoformat())
    with direct_vm.expect_revert("Revision request is not eligible for expiry"):
        registry.expire_revision_request(review_id)
    direct_vm.warp(datetime.datetime.fromtimestamp(deadline + 1, datetime.timezone.utc).isoformat())
    with direct_vm.expect_revert("Review assessment deadline has passed"):
        registry.assess_revision(review_id)
    assert registry.expire_revision_request(review_id)
    for expected_attempt in (2, 3):
        direct_vm.warp(datetime.datetime.fromtimestamp(deadline + expected_attempt * 301, datetime.timezone.utc).isoformat())
        retry = registry.request_revision(program_id, NEXT_SHA)
        registry.reviews[retry].status = "INCONCLUSIVE"
        program.pending_review = 0
    direct_vm.warp(datetime.datetime.fromtimestamp(deadline + 1300, datetime.timezone.utc).isoformat())
    with direct_vm.expect_revert("review-attempt limit"):
        registry.request_revision(program_id, NEXT_SHA)
