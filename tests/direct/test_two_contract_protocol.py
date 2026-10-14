"""Direct Mode checks for the Registry/Vault migration boundary.

These tests call receiver methods directly with controlled sender context. They
prove deterministic authorization and replay rules, not child delivery or live
Studionet custody.
"""

import pytest


REGISTRY = "0x" + "1" * 40
VAULT = "0x" + "2" * 40
PUBLISHER = "0x" + "a" * 40
PARTICIPANT = "0x" + "b" * 40
ATTACKER = "0x" + "c" * 40
NOW = 1_767_225_600


def deploy_vault(direct_deploy, direct_vm, custody=False):
    direct_vm.sender = PUBLISHER
    direct_vm.warp("2026-01-01T00:00:00Z")
    direct_vm.check_pickling = True
    vault = direct_deploy("contracts/revigate_vault.py", REGISTRY, custody,
                          sdk_version="v0.2.16")
    from genlayer.py import calldata
    direct_vm.registry_program = {
        "id": 1, "publisher": PUBLISHER, "status": "VERIFIED",
        "epoch": 1, "sha": "1" * 40,
        "document_digest": "e" * 64, "pending_review": 0,
    }
    def registry_view_hook(vm, request):
        call = request.get("CallContract", {})
        method = call.get("calldata", {}).get("method")
        if method == "get_program_for_vault":
            return b"\x00" + calldata.encode(vm.registry_program)
        return None
    direct_vm._gl_call_hook = registry_view_hook
    return vault


def test_registry_loads_with_zero_value_vault_binding(direct_deploy, direct_vm):
    direct_vm.sender = PUBLISHER
    direct_vm.check_pickling = True
    registry = direct_deploy("contracts/revigate_registry.py", sdk_version="v0.2.16")
    from genlayer.py import calldata
    assert registry.get_config()["vault"] == "0x" + "0" * 40
    identity = {"protocol": "revigate-vault-v1", "chain_id": 61999,
                "contract_version": 1,
                "registry": str(__import__("genlayer").gl.message.contract_address).lower(),
                "custody_enabled": False}
    def vault_view_hook(vm, request):
        call = request.get("CallContract", {})
        if call.get("calldata", {}).get("method") != "get_config":
            return None
        return b"\x00" + calldata.encode(identity)
    direct_vm._gl_call_hook = vault_view_hook
    identity["registry"] = ATTACKER
    with direct_vm.expect_revert("Vault identity, Registry binding, or custody mode is invalid"):
        registry.bind_vault(VAULT)
    assert registry.get_config()["vault"] == "0x" + "0" * 40
    identity["registry"] = str(__import__("genlayer").gl.message.contract_address).lower()
    direct_vm.sender = ATTACKER
    with direct_vm.expect_revert("Only the owner may bind the Vault once"):
        registry.bind_vault(VAULT)
    assert registry.get_config()["vault"] == "0x" + "0" * 40
    direct_vm.sender = PUBLISHER
    assert registry.bind_vault(VAULT) is True
    assert registry.get_config() == {
        "protocol": "revigate-registry-v1", "chain_id": 61999,
        "contract_version": 1, "vault": VAULT, "custody_enabled": False,
    }
    with direct_vm.expect_revert("Only the owner may bind the Vault once"):
        registry.bind_vault(ATTACKER)


def snapshot(vault, direct_vm, nonce=1, message_id=None):
    direct_vm.sender = REGISTRY
    return vault.register_program_snapshot(
        message_id or ("d" * 64), nonce, 1, PUBLISHER, 1, "1" * 40, "e" * 64)


def test_vault_is_custody_disabled_by_default(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm)
    assert vault.get_config() == {
        "protocol": "revigate-vault-v1", "chain_id": 61999,
        "contract_version": 1, "registry": REGISTRY,
        "custody_enabled": False,
    }


def test_registry_sender_is_authenticated_and_message_is_idempotent(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm)
    direct_vm.sender = ATTACKER
    with direct_vm.expect_revert("Only the paired Registry may send this message"):
        vault.register_program_snapshot("d" * 64, 1, 1, PUBLISHER, 1, "1" * 40, "e" * 64)
    assert vault.get_program(1) == {}
    assert snapshot(vault, direct_vm) is True
    assert snapshot(vault, direct_vm) is False


def test_out_of_order_nonce_and_identity_conflict_are_rejected(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm)
    assert snapshot(vault, direct_vm, 5) is True
    direct_vm.sender = REGISTRY
    with direct_vm.expect_revert("Registry nonce is stale or out of order"):
        vault.register_program_snapshot("f" * 64, 4, 1, PUBLISHER, 2, "2" * 40, "a" * 64)
    with direct_vm.expect_revert("Program snapshot conflicts with frozen identity"):
        vault.register_program_snapshot("a" * 64, 6, 1, ATTACKER, 2, "2" * 40, "a" * 64)


def test_material_event_fixes_first_trigger_and_rejects_replay(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm)
    snapshot(vault, direct_vm)
    direct_vm.sender = REGISTRY
    assert vault.notify_material_change("a" * 64, 2, 1, 2, NOW + 10,
                                       "2" * 40, "f" * 64) is True
    assert vault.notify_material_change("a" * 64, 2, 1, 2, NOW + 10,
                                       "2" * 40, "f" * 64) is False
    assert vault.notify_material_change("b" * 64, 3, 1, 3, NOW + 20,
                                       "3" * 40, "a" * 64) is True
    program = vault.programs[1]
    assert program.first_material_epoch == 2
    assert program.first_material_at == NOW + 10


def test_agreement_identity_freezes_both_contracts_network_and_terms(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm)
    snapshot(vault, direct_vm)
    direct_vm.sender = PUBLISHER
    offer_id = vault.register_offer(1, PARTICIPANT, 101, NOW + 100,
                                    NOW + 200, NOW + 300, 2000, 3600)
    offer = vault.get_offer(offer_id)
    assert len(offer["agreement_id"]) == 64
    assert offer["state"] == "REGISTERED_UNFUNDED"
    with direct_vm.expect_revert("Agreement replay"):
        vault.register_offer(1, PARTICIPANT, 101, NOW + 100,
                             NOW + 200, NOW + 300, 2000, 3600)


def test_custody_gate_rejects_funding_and_leaves_ledger_zero(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm)
    snapshot(vault, direct_vm)
    direct_vm.sender = PUBLISHER
    offer_id = vault.register_offer(1, PARTICIPANT, 101, NOW + 100,
                                    NOW + 200, NOW + 300, 2000, 3600)
    direct_vm.value = 101
    with direct_vm.expect_revert("Custody is disabled on this deployment"):
        vault.fund_offer(offer_id)
    with direct_vm.expect_revert("Custody is disabled on this deployment"):
        vault.withdraw_credit(1)
    direct_vm.value = 0
    assert vault.get_ledger()["accounted_liabilities"] == 0


def test_enabled_candidate_exact_funding_is_accounted(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    direct_vm.sender = PUBLISHER
    offer_id = vault.register_offer(1, PARTICIPANT, 101, NOW + 100,
                                    NOW + 200, NOW + 300, 2000, 3600)
    direct_vm.value = 101
    assert vault.fund_offer(offer_id) == "FUNDED"
    direct_vm.value = 0
    assert vault.get_ledger() == {
        "received": 101, "held": 101, "claimable": 0,
        "transfer_pending": 0, "recipient_claimed_delivery": 0,
        "native_balance": 0, "unassigned_surplus": 0,
        "liability_shortfall": 101,
        "unreconciled": 0, "accounted_liabilities": 101,
        "reconciled_total": 101, "reconciliation_delta": 0,
    }


def test_invalid_payable_funding_is_credited_before_validation_and_can_be_withdrawn(
        direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm)

    direct_vm.sender = PUBLISHER
    direct_vm.value = 100
    assert vault.fund_offer(offer_id) == "REFUNDABLE_CREDIT_AMOUNT_MISMATCH"
    assert vault.get_offer(offer_id)["state"] == "REGISTERED_UNFUNDED"
    assert vault.get_wallet_credit(PUBLISHER) == 100

    direct_vm.sender = ATTACKER
    direct_vm.value = 101
    assert vault.fund_offer(offer_id) == "REFUNDABLE_CREDIT_WRONG_FUNDER"
    assert vault.get_wallet_credit(ATTACKER) == 101
    assert vault.get_offer(offer_id)["state"] == "REGISTERED_UNFUNDED"

    direct_vm.sender = PUBLISHER
    direct_vm.value = 7
    assert vault.fund_offer(999) == "REFUNDABLE_CREDIT_UNKNOWN_OFFER"
    assert vault.get_wallet_credit(PUBLISHER) == 107

    direct_vm.value = 101
    assert vault.fund_offer(offer_id) == "FUNDED"
    assert vault.get_wallet_credit(PUBLISHER) == 107
    assert vault.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"

    direct_vm.value = 101
    assert vault.fund_offer(offer_id) == "REFUNDABLE_CREDIT_OFFER_NOT_FUNDABLE"
    assert vault.get_wallet_credit(PUBLISHER) == 208
    ledger = vault.get_ledger()
    assert ledger["received"] == 410
    assert ledger["held"] == 101
    assert ledger["claimable"] == 309
    assert ledger["accounted_liabilities"] == ledger["received"]
    assert ledger["reconciliation_delta"] == 0

    direct_vm.value = 0
    direct_vm._gl_call_hook = lambda vm, request: {"ok": None} if "PostMessage" in request else None
    transfer_id = vault.withdraw_credit(100)
    assert vault.get_wallet_credit(PUBLISHER) == 108
    assert vault.get_transfer(transfer_id)["status"] == "UNKNOWN_DELIVERY"
    ledger = vault.get_ledger()
    assert ledger["claimable"] == 209
    assert ledger["transfer_pending"] == 100
    assert ledger["accounted_liabilities"] == ledger["received"]


def test_expired_payable_funding_returns_credit_without_throwing(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm)
    direct_vm.warp("2026-01-01T00:02:00Z")
    direct_vm.sender = PUBLISHER
    direct_vm.value = 101

    assert vault.fund_offer(offer_id) == "REFUNDABLE_CREDIT_FUNDING_EXPIRED"
    assert vault.get_wallet_credit(PUBLISHER) == 101
    assert vault.get_offer(offer_id)["state"] == "REGISTERED_UNFUNDED"
    ledger = vault.get_ledger()
    assert ledger["received"] == 101
    assert ledger["claimable"] == 101
    assert ledger["accounted_liabilities"] == 101
    assert ledger["reconciliation_delta"] == 0


def create_offer(vault, direct_vm, *, principal=101, exit_bps=2000,
                 exit_window=3600, maturity=NOW + 300, offset=0):
    direct_vm.sender = PUBLISHER
    return vault.register_offer(1, PARTICIPANT, principal, NOW + 100 + offset,
                                NOW + 200 + offset, maturity, exit_bps, exit_window)


def fund(vault, direct_vm, offer_id, value=101):
    direct_vm.sender = PUBLISHER
    direct_vm.value = value
    result = vault.fund_offer(offer_id)
    direct_vm.value = 0
    return result


def test_stale_registry_snapshot_cannot_be_accepted(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm)
    assert fund(vault, direct_vm, offer_id) == "FUNDED"
    direct_vm.registry_program = {**direct_vm.registry_program, "epoch": 2,
                                  "sha": "2" * 40, "document_digest": "f" * 64}
    direct_vm.sender = PARTICIPANT
    with direct_vm.expect_revert("Offer cannot be accepted against stale or pending Registry state"):
        vault.accept_offer(offer_id, vault.get_offer(offer_id)["agreement_id"],
                           1, "1" * 40)
    assert vault.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"


def test_stale_registry_snapshot_cannot_register_offer(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    direct_vm.registry_program = {**direct_vm.registry_program, "epoch": 2,
                                  "sha": "2" * 40, "document_digest": "f" * 64}
    direct_vm.sender = PUBLISHER
    with direct_vm.expect_revert("Vault snapshot is not the current authenticated Registry state"):
        vault.register_offer(1, PARTICIPANT, 101, NOW + 100,
                             NOW + 200, NOW + 300, 2000, 3600)
    assert vault.next_offer == 1


def test_acceptance_cancel_race_and_decline_refund_are_single_settlement(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm)
    assert fund(vault, direct_vm, offer_id) == "FUNDED"
    direct_vm.sender = PUBLISHER
    assert vault.cancel_unaccepted_offer(offer_id) is True
    assert vault.get_offer(offer_id)["state"] == "REFUND_ALLOCATED"

    accepted_id = create_offer(vault, direct_vm, offset=1)
    assert fund(vault, direct_vm, accepted_id) == "FUNDED"
    offer = vault.get_offer(accepted_id)
    direct_vm.sender = PARTICIPANT
    assert vault.accept_offer(accepted_id, offer["agreement_id"], 1, "1" * 40) is True
    direct_vm.sender = PUBLISHER
    with direct_vm.expect_revert("Publisher may only cancel an unaccepted offer"):
        vault.cancel_unaccepted_offer(accepted_id)
    assert vault.get_offer(accepted_id)["state"] == "ACCEPTED_LOCKED"
    assert vault.get_ledger()["held"] == 101

    second = create_offer(vault, direct_vm, offset=2)
    assert fund(vault, direct_vm, second) == "FUNDED"
    direct_vm.sender = PARTICIPANT
    assert vault.decline_offer(second) is True
    direct_vm.sender = PUBLISHER
    assert vault.get_offer(second)["state"] == "REFUND_ALLOCATED"
    assert vault.get_offer(second)["held"] == 0
    assert vault.credits[PUBLISHER] == 202
    with direct_vm.expect_revert("Allocation is empty, repeated, or does not conserve principal"):
        vault._allocate(vault.offers[second], 101, 0, "DUPLICATE")


def test_material_exit_uses_first_event_and_keeps_original_agreement(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm)
    assert fund(vault, direct_vm, offer_id) == "FUNDED"
    offer = vault.get_offer(offer_id)
    direct_vm.sender = PARTICIPANT
    vault.accept_offer(offer_id, offer["agreement_id"], 1, "1" * 40)
    direct_vm.sender = REGISTRY
    vault.notify_material_change("a" * 64, 2, 1, 2, NOW + 10,
                                 "2" * 40, "f" * 64)
    vault.notify_material_change("b" * 64, 3, 1, 3, NOW + 20,
                                 "3" * 40, "a" * 64)
    direct_vm.sender = PARTICIPANT
    assert vault.exercise_material_exit(offer_id) is True
    result = vault.get_offer(offer_id)
    assert result["agreement_id"] == offer["agreement_id"]
    assert result["exit_trigger_epoch"] == 2
    assert result["state"] == "MATERIAL_EXIT_ALLOCATED"
    assert result["allocated_publisher"] == 81
    assert result["allocated_participant"] == 20
    assert vault.get_ledger()["claimable"] == 101
    with direct_vm.expect_revert("No valid material exit is available"):
        vault.exercise_material_exit(offer_id)


def test_maturity_allocates_exactly_once(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm, exit_bps=0, exit_window=0)
    assert fund(vault, direct_vm, offer_id) == "FUNDED"
    offer = vault.get_offer(offer_id)
    direct_vm.sender = PARTICIPANT
    vault.accept_offer(offer_id, offer["agreement_id"], 1, "1" * 40)
    with direct_vm.expect_revert("Accepted offer is not mature"):
        vault.allocate_matured_claim(offer_id)
    direct_vm.warp("2026-01-01T00:06:00Z")
    assert vault.allocate_matured_claim(offer_id) is True
    assert vault.credits[PARTICIPANT] == 101
    with direct_vm.expect_revert("Accepted offer is not mature"):
        vault.allocate_matured_claim(offer_id)


def test_mutual_closure_requires_other_wallet_and_settles_once(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)

    closure_offer = create_offer(vault, direct_vm, exit_bps=0, exit_window=0,
                                 maturity=NOW + 1000)
    assert fund(vault, direct_vm, closure_offer) == "FUNDED"
    closure_terms = vault.get_offer(closure_offer)
    direct_vm.sender = PARTICIPANT
    vault.accept_offer(closure_offer, closure_terms["agreement_id"], 1, "1" * 40)
    direct_vm.sender = PUBLISHER
    digest = vault.propose_closure(closure_offer, 40, 61, NOW + 500)
    with direct_vm.expect_revert("Closure requires approval from the other wallet"):
        vault.approve_closure(closure_offer, digest)
    direct_vm.sender = PARTICIPANT
    assert vault.approve_closure(closure_offer, digest) is True
    result = vault.get_offer(closure_offer)
    assert result["state"] == "MUTUAL_CLOSURE_ALLOCATED"
    assert result["allocated_publisher"] == 40
    assert result["allocated_participant"] == 61
    with direct_vm.expect_revert("Only an accepted-offer party may approve closure"):
        vault.approve_closure(closure_offer, digest)


def test_withdrawal_stays_pending_until_recipient_reconciles(direct_deploy, direct_vm):
    vault = deploy_vault(direct_deploy, direct_vm, custody=True)
    snapshot(vault, direct_vm)
    offer_id = create_offer(vault, direct_vm, exit_bps=0, exit_window=0)
    assert fund(vault, direct_vm, offer_id) == "FUNDED"
    direct_vm.sender = PUBLISHER
    assert vault.cancel_unaccepted_offer(offer_id) is True
    direct_vm.sender = PUBLISHER
    direct_vm._gl_call_hook = lambda vm, request: {"ok": None} if "PostMessage" in request else None
    transfer_id = vault.withdraw_credit(101)
    direct_vm.sender = ATTACKER
    with direct_vm.expect_revert("Only the recipient may reconcile an unknown transfer"):
        vault.reconcile_transfer_unknown(transfer_id, "explorer-check")
    direct_vm.sender = PUBLISHER
    assert vault.reconcile_transfer_unknown(transfer_id, "recipient balance not yet checked") is True
    transfer = vault.get_transfer(transfer_id)
    assert transfer["status"] == "UNKNOWN_DELIVERY"
    assert vault.get_ledger()["transfer_pending"] == 101
    with direct_vm.expect_revert("Only the recipient may reconcile an unknown transfer"):
        vault.reconcile_transfer_unknown(transfer_id, "")
    assert vault.record_transfer_delivery_claim(transfer_id, "0x" + "d" * 64) is True
    assert vault.get_transfer(transfer_id)["status"] == "RECIPIENT_ASSERTED_DELIVERED"
    ledger = vault.get_ledger()
    assert ledger["transfer_pending"] == 101
    assert ledger["recipient_claimed_delivery"] == 101
    assert ledger["unreconciled"] == 101
    assert ledger["reconciliation_delta"] == 0
