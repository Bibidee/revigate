"""Direct Mode assertions for revision state transitions.

GitHub and LLM responses are explicitly mocked. These tests verify contract
state handling and the validator callback only; they do not prove hosted
validator consensus or real GitHub provenance.
"""

import hashlib
import json
import re

import pytest


PUBLISHER = "0x" + "a" * 40
PARTICIPANT = "0x" + "b" * 40
OTHER = "0x" + "c" * 40
REPO = "bibidee/revigate"
RULE_PATH = "rules/program.md"
MANIFEST_PATH = ".revigate/publisher.json"
BASE_SHA = "1" * 40
CANDIDATE_SHA = "2" * 40
BRANCH_HEAD = "f" * 40
BASE_TEXT = (
    "## R-01: Eligibility\nParticipants qualify after 14 days.\n\n"
    "## R-02: Benefit\nParticipants receive access.\n"
)
MATERIAL_TEXT = (
    "## R-01: Eligibility\nParticipants qualify after 60 days.\n\n"
    "## R-02: Benefit\nParticipants receive access.\n"
)
NONMATERIAL_TEXT = (
    "## R-01: Eligibility\n*Participants qualify after 14 days.*\n\n"
    "## R-02: Benefit\nParticipants receive access.\n"
)
AMBIGUOUS_TEXT = (
    "## R-01: Eligibility\nParticipants may qualify when appropriate.\n\n"
    "## R-02: Benefit\nParticipants receive access.\n"
)
NOW_TS = 1_767_225_600
AMOUNT = 101


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def mock_response(direct_vm, url: str, body, status: int = 200):
    direct_vm.mock_web(re.escape(url), {"method": "GET", "status": status, "body": body})


def mock_commit_snapshot(
    direct_vm, sha: str, rule_text: str, tree_sha: str, *,
    ancestry_base: str | None = None, commit_html_url: str | None = None,
    include_rule_blob: bool = True,
):
    rule_bytes = rule_text.encode("utf-8")
    manifest_bytes = json.dumps({
        "protocol": "revigate-v1",
        "network_chain_id": 61999,
        "rulebook_path": RULE_PATH,
        "publisher_wallet": PUBLISHER,
    }, separators=(",", ":")).encode("utf-8")
    entries = [{"path": MANIFEST_PATH, "sha": git_blob_sha(manifest_bytes), "type": "blob"}]
    if include_rule_blob:
        entries.insert(0, {"path": RULE_PATH, "sha": git_blob_sha(rule_bytes), "type": "blob"})
    commit = {
        "sha": sha,
        "html_url": commit_html_url or f"https://github.com/{REPO}/commit/{sha}",
        "commit": {
            "verification": {"verified": True, "reason": "valid", "signature": "mocked-signature"},
            "tree": {"sha": tree_sha},
        },
    }
    branch = {"name": "release/v1", "commit": {"sha": BRANCH_HEAD}}
    membership = {
        "status": "ahead", "base_commit": {"sha": sha},
        "merge_base_commit": {"sha": sha}, "head_commit": {"sha": BRANCH_HEAD},
    }
    tree = {"truncated": False, "tree": entries}

    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/commits/{sha}", json.dumps(commit))
    mock_response(direct_vm, "https://api.github.com/repos/bibidee/revigate/branches/release%2Fv1", json.dumps(branch))
    mock_response(
        direct_vm,
        f"https://api.github.com/repos/{REPO}/compare/{sha}...{BRANCH_HEAD}",
        json.dumps(membership),
    )
    if ancestry_base:
        ancestry = {
            "status": "ahead", "base_commit": {"sha": ancestry_base},
            "merge_base_commit": {"sha": ancestry_base}, "head_commit": {"sha": sha},
        }
        mock_response(
            direct_vm,
            f"https://api.github.com/repos/{REPO}/compare/{ancestry_base}...{sha}",
            json.dumps(ancestry),
        )
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/git/trees/{tree_sha}?recursive=1", json.dumps(tree))
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{sha}/{RULE_PATH}", rule_text)
    mock_response(
        direct_vm,
        f"https://raw.githubusercontent.com/{REPO}/{sha}/{MANIFEST_PATH}",
        manifest_bytes.decode("utf-8"),
    )


def mock_revision_inputs(direct_vm, candidate_text: str, outcome: str):
    mock_commit_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40)
    mock_commit_snapshot(
        direct_vm, CANDIDATE_SHA, candidate_text, "b" * 40,
        ancestry_base=BASE_SHA,
    )
    direct_vm.mock_llm(
        "Assess materiality of a public program-rule revision",
        json.dumps({
            "outcome": outcome,
            "changed_ids": ["R-01"],
            "rationale": "mocked Direct Mode classification",
        }),
    )


def make_verified_contract(direct_deploy, direct_vm, *, accepted_offer=False):
    direct_vm.warp("2026-01-01T00:00:00Z")
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(
        REPO, RULE_PATH, MANIFEST_PATH, "release/v1", BASE_SHA,
    )
    program = contract.programs[program_id]
    program.status = "VERIFIED"
    program.active_sha = BASE_SHA
    program.baseline_sha = BASE_SHA
    program.document_digest = hashlib.sha256(BASE_TEXT.encode("utf-8")).hexdigest()
    program.epoch = 1
    if not accepted_offer:
        return contract, program_id, None

    offer_id = contract.create_offer(
        program_id, PARTICIPANT, AMOUNT,
        NOW_TS + 3_600, NOW_TS + 7_200, NOW_TS + 86_400, 2_000, 3_600,
    )
    direct_vm.value = AMOUNT
    assert contract.fund_offer(offer_id) == "FUNDED"
    direct_vm.value = 0
    direct_vm.sender = PARTICIPANT
    offer = contract.get_offer(offer_id)
    assert contract.accept_offer(
        offer_id, offer["terms_digest"], offer["epoch"], offer["sha"],
    ) is True
    return contract, program_id, offer_id


def request_candidate(contract, direct_vm):
    direct_vm.sender = PUBLISHER
    return contract.request_revision(1, CANDIDATE_SHA)


def test_T07_T08_material_revision_advances_once_and_keeps_ack_historical(direct_deploy, direct_vm):
    contract, program_id, offer_id = make_verified_contract(direct_deploy, direct_vm, accepted_offer=True)
    ack_key = f"{program_id}:{PARTICIPANT}"
    ack = contract.acks[f"{ack_key}:1"]
    review_id = request_candidate(contract, direct_vm)
    mock_revision_inputs(direct_vm, MATERIAL_TEXT, "MATERIAL")

    assert contract.assess_revision(review_id) == "MATERIAL"
    program = contract.get_program(program_id)
    offer = contract.get_offer(offer_id)
    assert program["epoch"] == 2
    assert program["active_sha"] == CANDIDATE_SHA
    assert program["pending_review"] == 0
    assert program["material_history"] == [[2, NOW_TS]]
    assert contract.ack_counts[ack_key] == 1
    assert contract.acks[f"{ack_key}:1"].epoch == ack.epoch == offer["ack_epoch"] == 1
    assert offer["state"] == "ACCEPTED_LOCKED"

    direct_vm.sender = PARTICIPANT
    assert contract.exercise_material_exit(offer_id) is True
    exited = contract.get_offer(offer_id)
    assert exited["state"] == "MATERIAL_EXIT_ALLOCATED"
    assert exited["allocated_a"] == 81
    assert exited["allocated_b"] == 20

    with direct_vm.expect_revert("Review is not pending"):
        contract.assess_revision(review_id)
    assert contract.get_program(program_id)["epoch"] == 2


def test_T09_nonmaterial_revision_changes_sha_without_staling_ack_or_epoch(direct_deploy, direct_vm):
    contract, program_id, offer_id = make_verified_contract(direct_deploy, direct_vm, accepted_offer=True)
    review_id = request_candidate(contract, direct_vm)
    mock_revision_inputs(direct_vm, NONMATERIAL_TEXT, "NONMATERIAL")

    assert contract.assess_revision(review_id) == "NONMATERIAL"
    program = contract.get_program(program_id)
    offer = contract.get_offer(offer_id)
    assert program["active_sha"] == CANDIDATE_SHA
    assert program["epoch"] == 1
    assert program["material_history"] == []
    assert offer["ack_epoch"] == program["epoch"] == 1
    assert offer["state"] == "ACCEPTED_LOCKED"
    assert contract.acks[f"{program_id}:{PARTICIPANT}:1"].epoch == 1
    direct_vm.sender = PARTICIPANT
    with direct_vm.expect_revert("No valid material exit"):
        contract.exercise_material_exit(offer_id)


def test_T10_inconclusive_assessment_does_not_advance_rules_or_epoch(direct_deploy, direct_vm):
    contract, program_id, offer_id = make_verified_contract(direct_deploy, direct_vm, accepted_offer=True)
    review_id = request_candidate(contract, direct_vm)
    mock_revision_inputs(direct_vm, AMBIGUOUS_TEXT, "INCONCLUSIVE")

    assert contract.assess_revision(review_id) == "INCONCLUSIVE"
    program = contract.get_program(program_id)
    assert program["active_sha"] == BASE_SHA
    assert program["epoch"] == 1
    assert program["pending_review"] == 0
    assert program["material_history"] == []
    assert contract.reviews[review_id].status == "INCONCLUSIVE"
    direct_vm.sender = PARTICIPANT
    with direct_vm.expect_revert("No valid material exit"):
        contract.exercise_material_exit(offer_id)
    # Direct Mode cannot manufacture or stand in for a protocol UNDETERMINED receipt.


def test_T32_signed_14_to_60_day_revision_is_material_in_direct_mode(direct_deploy, direct_vm):
    contract, program_id, _ = make_verified_contract(direct_deploy, direct_vm)
    review_id = request_candidate(contract, direct_vm)
    mock_revision_inputs(direct_vm, MATERIAL_TEXT, "MATERIAL")

    assert contract.assess_revision(review_id) == "MATERIAL"
    assert contract.get_program(program_id)["epoch"] == 2
    assert contract.get_program(program_id)["active_sha"] == CANDIDATE_SHA


def test_T13_nonpayable_offer_creation_does_not_take_attached_value(direct_deploy, direct_vm):
    contract, _, _ = make_verified_contract(direct_deploy, direct_vm)
    direct_vm.value = 1
    offer_id = contract.create_offer(
        1, PARTICIPANT, AMOUNT,
        NOW_TS + 3_600, NOW_TS + 7_200, NOW_TS + 86_400, 2_000, 3_600,
    )
    direct_vm.value = 0

    assert offer_id == 1
    assert contract.get_offer(offer_id)["held"] == 0
    assert contract.get_ledger_totals() == {
        "deposited": 0, "held": 0, "credits": 0,
        "withdrawn_or_pending_delivery": 0, "accounted": 0,
    }
    assert contract.balance == 0


@pytest.mark.parametrize("state", ["pending_review", "matured", "material_revision"])
def test_T16_publisher_cannot_cancel_accepted_offer_in_any_lifecycle_state(
    direct_deploy, direct_vm, state,
):
    contract, _, offer_id = make_verified_contract(direct_deploy, direct_vm, accepted_offer=True)
    if state == "pending_review":
        direct_vm.sender = PUBLISHER
        contract.request_revision(1, CANDIDATE_SHA)
    elif state == "matured":
        direct_vm.warp("2026-01-02T00:00:00Z")
    else:
        contract.programs[1].epoch = 2
        contract.programs[1].active_sha = CANDIDATE_SHA
        contract._append_material_event(1, 2, NOW_TS + 100)

    direct_vm.sender = PUBLISHER
    with direct_vm.expect_revert("Publisher can only cancel an unaccepted offer"):
        contract.cancel_unaccepted_offer(offer_id)
    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


@pytest.mark.parametrize("case", ["no_material_event", "after_maturity"])
def test_T23_material_exit_requires_event_and_pre_maturity_time(direct_deploy, direct_vm, case):
    contract, _, offer_id = make_verified_contract(direct_deploy, direct_vm, accepted_offer=True)
    if case == "after_maturity":
        contract.programs[1].epoch = 2
        contract.programs[1].active_sha = CANDIDATE_SHA
        contract._append_material_event(1, 2, NOW_TS + 100)
        direct_vm.warp("2026-01-02T00:00:00Z")

    direct_vm.sender = PARTICIPANT
    with direct_vm.expect_revert("No valid material exit"):
        contract.exercise_material_exit(offer_id)
    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T35_bad_commit_json_is_inconclusive(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(REPO, RULE_PATH, MANIFEST_PATH, "release/v1", BASE_SHA)
    mock_response(
        direct_vm, f"https://api.github.com/repos/{REPO}/commits/{BASE_SHA}",
        "not-json",
    )

    result = contract._fetch_source(contract.programs[program_id], BASE_SHA, True, "")
    assert result == {
        "status": "INCONCLUSIVE",
        "reason": "provider response invalid or unavailable",
    }
    assert contract.programs[program_id].status == "PROPOSED"


def test_T35_missing_rulebook_blob_is_inconclusive(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(REPO, RULE_PATH, MANIFEST_PATH, "release/v1", BASE_SHA)
    mock_commit_snapshot(
        direct_vm, BASE_SHA, BASE_TEXT, "a" * 40, include_rule_blob=False,
    )

    result = contract._fetch_source(contract.programs[program_id], BASE_SHA, True, "")
    assert result == {"status": "INCONCLUSIVE", "reason": "fixed source path absent from commit tree"}
    assert contract.programs[program_id].epoch == 0


def test_T35_commit_404_is_inconclusive(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(REPO, RULE_PATH, MANIFEST_PATH, "release/v1", BASE_SHA)
    mock_response(
        direct_vm,
        f"https://api.github.com/repos/{REPO}/commits/{BASE_SHA}",
        '{"message":"not found"}',
        status=404,
    )

    result = contract._fetch_source(contract.programs[program_id], BASE_SHA, True, "")
    assert result == {"status": "INCONCLUSIVE", "reason": "commit unavailable or mismatched"}


def test_T35_unavailable_provider_exception_is_inconclusive(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(REPO, RULE_PATH, MANIFEST_PATH, "release/v1", BASE_SHA)

    result = contract._fetch_source(contract.programs[program_id], BASE_SHA, True, "")
    assert result == {"status": "INCONCLUSIVE", "reason": "provider response invalid or unavailable"}


def test_T37_validator_callback_rejects_a_different_materiality_result(direct_deploy, direct_vm):
    contract, _, _ = make_verified_contract(direct_deploy, direct_vm)
    review_id = request_candidate(contract, direct_vm)
    mock_revision_inputs(direct_vm, MATERIAL_TEXT, "NONMATERIAL")
    assert contract.assess_revision(review_id) == "NONMATERIAL"

    direct_vm.clear_mocks()
    mock_revision_inputs(direct_vm, MATERIAL_TEXT, "MATERIAL")
    assert direct_vm.run_validator() is False


def test_T38_validator_callback_rejects_source_identity_mismatch(direct_deploy, direct_vm):
    contract, _, _ = make_verified_contract(direct_deploy, direct_vm)
    review_id = request_candidate(contract, direct_vm)
    mock_revision_inputs(direct_vm, MATERIAL_TEXT, "MATERIAL")
    assert contract.assess_revision(review_id) == "MATERIAL"

    direct_vm.clear_mocks()
    mock_commit_snapshot(direct_vm, BASE_SHA, BASE_TEXT, "a" * 40)
    mock_commit_snapshot(
        direct_vm, CANDIDATE_SHA, MATERIAL_TEXT, "b" * 40,
        ancestry_base=BASE_SHA,
        commit_html_url=f"https://github.com/attacker/revigate/commit/{CANDIDATE_SHA}",
    )
    assert direct_vm.run_validator() is False
