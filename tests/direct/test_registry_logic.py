"""Direct Mode checks for Registry-specific provenance and revision state.

GitHub and GenLayer judgment are mocked here. These cases do not certify live
source verification, hosted validator agreement, or child-message finality.
"""

import hashlib
import json
import re


PUBLISHER = "0x" + "a" * 40
VAULT = "0x" + "2" * 40
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
                  ancestry_base: str | None = None):
    rule_bytes = text.encode("utf-8")
    manifest_bytes = json.dumps({
        "protocol": "revigate-v1", "network_chain_id": 61999,
        "rulebook_path": RULE_PATH, "publisher_wallet": PUBLISHER,
    }, separators=(",", ":")).encode("utf-8")
    commit = {
        "sha": sha, "html_url": f"https://github.com/{REPO}/commit/{sha}",
        "commit": {
            "verification": {"verified": signed, "reason": "valid" if signed else "unsigned",
                             "signature": "test-signature" if signed else None},
            "tree": {"sha": tree_sha},
        },
    }
    branch = {"name": "release/v1", "commit": {"sha": BRANCH_HEAD}}
    membership = {"status": "ahead", "base_commit": {"sha": sha},
                  "merge_base_commit": {"sha": sha},
                  "head_commit": {"sha": BRANCH_HEAD}}
    tree = {"truncated": False, "tree": [
        {"path": RULE_PATH, "sha": blob_sha(rule_bytes), "type": "blob"},
        {"path": MANIFEST_PATH, "sha": blob_sha(manifest_bytes), "type": "blob"},
    ]}
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/commits/{sha}", json.dumps(commit))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/branches/release%2Fv1", json.dumps(branch))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/compare/{sha}...{BRANCH_HEAD}", json.dumps(membership))
    if ancestry_base:
        ancestry = {"status": "ahead", "base_commit": {"sha": ancestry_base},
                    "merge_base_commit": {"sha": ancestry_base},
                    "head_commit": {"sha": sha}}
        mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/compare/{ancestry_base}...{sha}", json.dumps(ancestry))
    mock_response(direct_vm, f"https://api.github.com/repos/{REPO}/git/trees/{tree_sha}?recursive=1", json.dumps(tree))
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{sha}/{RULE_PATH}", rule_bytes.decode("utf-8"))
    mock_response(direct_vm, f"https://raw.githubusercontent.com/{REPO}/{sha}/{MANIFEST_PATH}", manifest_bytes.decode("utf-8"))


def deploy_registry(direct_deploy, direct_vm):
    direct_vm.warp("2026-01-01T00:00:00Z")
    direct_vm.check_pickling = True
    direct_vm.sender = PUBLISHER
    registry = direct_deploy("contracts/revigate_registry.py", sdk_version="v0.2.16")
    from genlayer.py import calldata
    from genlayer import gl

    def hook(vm, request):
        if "CallContract" in request:
            call = request["CallContract"]
            if call.get("calldata", {}).get("method") == "get_config":
                identity = {"protocol": "revigate-vault-v1", "chain_id": 61999,
                            "contract_version": 1,
                            "registry": str(gl.message.contract_address).lower(),
                            "custody_enabled": False}
                return b"\x00" + calldata.encode(identity)
        if "PostMessage" in request:
            return {"ok": None}
        return None

    direct_vm._gl_call_hook = hook
    direct_vm.sender = PUBLISHER
    assert registry.bind_vault(VAULT) is True
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
    message_id = registry.verify_program(program_id)
    assert re.fullmatch(r"[0-9a-f]{64}", message_id)
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
    assert state["material_history"] == [{"epoch": 2, "at": NOW}]
    with direct_vm.expect_revert("Review is not pending"):
        registry.assess_revision(review_id)
