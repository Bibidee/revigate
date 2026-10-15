"""Direct Mode checks for the active noncustodial Registry.

These tests deliberately assert that the old escrow surface is absent. They do
not treat Direct Mode as proof of hosted consensus or network-level transfer
recovery.
"""
from pathlib import Path

PUBLISHER = "0x" + "a" * 40
OTHER = "0x" + "b" * 40
NOW = "2026-01-01T00:00:00Z"


def test_config_is_explicitly_noncustodial(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    config = contract.get_config()
    assert config == {
        "protocol": "revigate-registry-v1",
        "chain_id": 61999,
        "contract_version": 4,
        "custody": "NONE",
        "escrow": "NONE",
        "transfer_evidence": "NONE",
    }


def test_no_native_value_entry_point_exists():
    source = Path("contracts/revigate.py").read_text(encoding="utf-8")
    assert "@gl.public.payable" not in source
    for forbidden in ("create_offer", "fund_offer", "accept_offer", "withdraw_credit", "get_wallet_credit"):
        assert f"def {forbidden}" not in source
    assert "SINGLE_CONTRACT_ESCROW" not in source
    assert "NATIVE_GEN" not in source


def test_initial_registry_has_no_programs_or_reviews(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    assert contract.get_program_page(0, 50)["items"] == []
    assert contract.get_review_page(0, 50)["items"] == []
    assert contract.get_program(1) == {}
    assert contract.get_review(1) == {}


def test_register_program_is_zero_value_rulebook_metadata_only(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER
    program_id = contract.register_program(
        "bibidee/rulebook", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40
    )
    program = contract.get_program(program_id)
    assert program["publisher"] == PUBLISHER
    assert program["status"] == "PROPOSED"
    assert program["epoch"] == 0
    assert program["pending_review"] == 0


def test_only_publisher_can_verify_and_request_revisions(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER
    program_id = contract.register_program(
        "bibidee/rulebook", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40
    )
    direct_vm.sender = OTHER
    with direct_vm.expect_revert("Only the publisher may verify"):
        contract.verify_program(program_id)
    with direct_vm.expect_revert("Only the verified publisher"):
        contract.request_revision(program_id, "2" * 40)


def test_acknowledgment_requires_authenticated_epoch(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER
    program_id = contract.register_program(
        "bibidee/rulebook", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40
    )
    program = contract.programs[program_id]
    program.active_sha = "1" * 40
    program.document_digest = "d" * 64
    program.epoch = 1
    program.status = "VERIFIED"
    contract.programs[program_id] = program
    with direct_vm.expect_revert("Acknowledgment does not match"):
        contract.acknowledge_rules(program_id, 1, "2" * 40, "d" * 64)


def test_acknowledgment_records_only_rulebook_state(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER
    program_id = contract.register_program(
        "bibidee/rulebook", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40
    )
    program = contract.programs[program_id]
    program.active_sha = "1" * 40
    program.document_digest = "d" * 64
    program.epoch = 1
    program.status = "VERIFIED"
    contract.programs[program_id] = program
    assert contract.acknowledge_rules(program_id, 1, "1" * 40, "d" * 64) is True
    assert contract.get_acknowledgment(program_id, PUBLISHER)["epoch"] == 1
    assert contract.get_acknowledgment_page(program_id, PUBLISHER, 0, 50)["items"]


def test_noncustodial_source_does_not_define_financial_storage():
    source = Path("contracts/revigate.py").read_text(encoding="utf-8")
    for field in ("credits:", "total_deposited", "total_held", "total_credits", "transfers:"):
        assert field not in source


def test_legacy_offer_reads_are_not_part_of_registry_api(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
    assert not hasattr(contract, "get_offer")
    assert not hasattr(contract, "get_transfer")
    assert not hasattr(contract, "get_ledger_totals")
