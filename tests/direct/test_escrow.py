"""Direct Mode economic and custody-gate checks for the single Revigate source.

These tests prove the deterministic Registry/ledger state machine only. They
do not prove Studionet value atomicity, external-message delivery, or an EOA
balance delta; those require separate hosted evidence.
"""

PUBLISHER = "0x" + "a" * 40
PARTICIPANT = "0x" + "b" * 40
OTHER = "0x" + "c" * 40
NOW = "2026-01-01T00:00:00Z"
NOW_TS = 1_767_225_600
AMOUNT = 101


def make_contract(direct_deploy, direct_vm, *, custody=True, public=False):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py", custody, public,
                             sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    contract.register_program(
        "bibidee/rulebook", "rules/program.md", ".revigate/publisher.json",
        "main", "1" * 40)
    program = contract.programs[1]
    program.active_sha = "1" * 40
    program.document_digest = "d" * 64
    program.epoch = 1
    program.status = "VERIFIED"
    program.verified_at = NOW_TS
    contract.programs[1] = program
    contract.next_program = 2
    direct_vm.sender = PUBLISHER
    return contract


def make_offer(contract, participant=PARTICIPANT, amount=AMOUNT, exit_bps=2_000):
    return contract.create_offer(
        1, participant, amount, NOW_TS + 3_600, NOW_TS + 7_200,
        NOW_TS + 86_400, exit_bps, 3_600)


def fund(contract, direct_vm, offer_id, amount=AMOUNT, sender=PUBLISHER):
    direct_vm.sender = sender
    direct_vm.value = amount
    result = contract.fund_offer(offer_id)
    direct_vm.value = 0
    return result


def accept(contract, direct_vm, offer_id, participant=PARTICIPANT):
    offer = contract.get_offer(offer_id)
    direct_vm.sender = participant
    return contract.accept_offer(
        offer_id, offer["terms_digest"], offer["epoch"], offer["sha"])


def test_default_deployment_is_locked_and_not_public(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm, custody=False)
    config = contract.get_config()
    assert config["custody"] == "DISABLED"
    assert config["custody_enabled"] is False
    assert config["public_custody"] is False


def test_disabled_payable_route_does_not_create_application_credit(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm, custody=False)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "CUSTODY_DISABLED_UNASSIGNED"
    assert contract.get_ledger_totals()["deposited"] == 0
    assert contract.get_wallet_credit(PUBLISHER) == 0


def test_funded_offer_and_acceptance_bind_frozen_rules(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    assert accept(contract, direct_vm, offer_id) is True
    offer = contract.get_offer(offer_id)
    assert offer["state"] == "ACCEPTED_LOCKED"
    assert offer["held"] == AMOUNT


def test_wrong_amount_and_wrong_sender_become_refundable_credit(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id, amount=AMOUNT - 1) == "REFUNDABLE_CREDIT_WRONG_AMOUNT"
    assert fund(contract, direct_vm, offer_id, sender=OTHER) == "REFUNDABLE_CREDIT_WRONG_SENDER"
    assert contract.get_wallet_credit(PUBLISHER) == AMOUNT - 1
    assert contract.get_wallet_credit(OTHER) == AMOUNT
    assert contract.get_offer(offer_id)["held"] == 0


def test_decline_cancel_and_expire_return_exact_principal(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    declined = make_offer(contract)
    fund(contract, direct_vm, declined)
    direct_vm.sender = PARTICIPANT
    assert contract.decline_offer(declined) is True
    assert contract.get_wallet_credit(PUBLISHER) == AMOUNT
    assert contract.get_offer(declined)["state"] == "REFUND_ALLOCATED"

    direct_vm.sender = PUBLISHER
    cancelled = make_offer(contract, participant=OTHER)
    fund(contract, direct_vm, cancelled)
    direct_vm.sender = PUBLISHER
    assert contract.cancel_unaccepted_offer(cancelled) is True
    assert contract.get_offer(cancelled)["state"] == "REFUND_ALLOCATED"

    direct_vm.sender = PUBLISHER
    expired = make_offer(contract, participant="0x" + "d" * 40)
    fund(contract, direct_vm, expired)
    direct_vm.warp("2026-01-01T03:00:00Z")
    assert contract.expire_unaccepted_offer(expired) is True
    assert contract.get_offer(expired)["state"] == "REFUND_ALLOCATED"


def test_material_exit_allocates_floor_and_remainder_once(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, amount=AMOUNT, exit_bps=2_000)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    program = contract.programs[1]
    program.epoch = 2
    program.first_material_at = NOW_TS + 100
    contract._append_material_event(program, 2, NOW_TS + 100)
    contract.programs[1] = program
    direct_vm.warp("2026-01-01T00:05:00Z")
    direct_vm.sender = PARTICIPANT
    assert contract.exercise_material_exit(offer_id) is True
    assert contract.get_wallet_credit(PARTICIPANT) == 20
    assert contract.get_wallet_credit(PUBLISHER) == 81
    assert contract.get_offer(offer_id)["held"] == 0


def test_material_exit_uses_later_event_timestamp_after_acknowledged_epoch(
        direct_deploy, direct_vm):
    """A later material revision gets its own usable exit window.

    The first event is deliberately old enough that its window has expired by
    the time the second event is assessed.  Reconstructing a later event from
    ``program.first_material_at`` would therefore reject this valid exit.
    """
    contract = make_contract(direct_deploy, direct_vm)

    # Revision 1 -> 2 happened before the offer was created and acknowledged.
    program = contract.programs[1]
    program.epoch = 2
    program.first_material_at = NOW_TS + 100
    contract._append_material_event(program, 2, NOW_TS + 100)
    contract.programs[1] = program

    offer_id = make_offer(contract, amount=AMOUNT, exit_bps=2_000)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)

    # Revision 2 -> 3 is the first material event after the offer's
    # acknowledged epoch.  Its timestamp must start the usable exit window.
    program = contract.programs[1]
    program.epoch = 3
    contract._append_material_event(program, 3, NOW_TS + 7_200)
    contract.programs[1] = program

    # This is after the first event's one-hour window but inside the second
    # event's one-hour window.
    direct_vm.warp("2026-01-01T02:30:00Z")
    direct_vm.sender = PARTICIPANT
    assert contract.exercise_material_exit(offer_id) is True

    offer = contract.get_offer(offer_id)
    assert offer["exit_trigger_epoch"] == 3
    assert offer["exit_deadline"] == NOW_TS + 7_200 + 3_600
    assert contract.get_wallet_credit(PARTICIPANT) == 20
    assert contract.get_wallet_credit(PUBLISHER) == 81


def test_maturity_payout_and_duplicate_rejection(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, exit_bps=0)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.warp("2026-01-02T00:00:00Z")
    assert contract.allocate_matured_claim(offer_id) is True
    assert contract.get_wallet_credit(PARTICIPANT) == AMOUNT
    with direct_vm.expect_revert("Accepted offer is not mature"):
        contract.allocate_matured_claim(offer_id)


def test_closure_requires_other_wallet_and_preserves_pending_state(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER
    digest = contract.propose_closure(offer_id, 31, 70, NOW_TS + 1_800)
    with direct_vm.expect_revert("Closure requires approval from the other wallet"):
        contract.approve_closure(offer_id, digest)
    direct_vm.sender = PARTICIPANT
    assert contract.approve_closure(offer_id, digest) is True
    assert contract.get_wallet_credit(PUBLISHER) == 31
    assert contract.get_wallet_credit(PARTICIPANT) == 70


def test_withdrawal_consumes_credit_once_and_never_replays_unknown_delivery(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id, amount=AMOUNT - 1) == "REFUNDABLE_CREDIT_WRONG_AMOUNT"
    direct_vm.sender = PUBLISHER
    transfer_id = contract.withdraw_credit(AMOUNT - 1)
    transfer = contract.get_transfer(transfer_id)
    assert transfer["status"] == "DISPATCHED_PENDING_EXTERNAL_SETTLEMENT"
    assert contract.get_wallet_credit(PUBLISHER) == 0
    with direct_vm.expect_revert("Insufficient wallet credit"):
        contract.withdraw_credit(1)
    assert contract.get_ledger_totals()["dispatched"] == AMOUNT - 1
    assert contract.record_transfer_delivery_claim(transfer_id, "balance-delta-proof") is True
    assert contract.get_transfer(transfer_id)["status"] == "RECIPIENT_ASSERTED_DELIVERED"


def test_only_recipient_can_record_delivery_claim(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    contract.credits[PUBLISHER] = 4
    contract.total_credits = 4
    direct_vm.sender = PUBLISHER
    transfer_id = contract.withdraw_credit(4)
    direct_vm.sender = OTHER
    with direct_vm.expect_revert("Recipient confirmation"):
        contract.record_transfer_delivery_claim(transfer_id, "proof")


def test_randomized_sequences_conserve_deposits(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    expected_total = 0
    for index in range(20):
        participant = "0x" + f"{index + 1:040x}"
        amount = index + 1
        expected_total += amount
        direct_vm.sender = PUBLISHER
        offer_id = make_offer(contract, participant=participant, amount=amount, exit_bps=0)
        assert fund(contract, direct_vm, offer_id, amount=amount) == "FUNDED"
        if index % 2 == 0:
            accept(contract, direct_vm, offer_id, participant=participant)
            direct_vm.warp("2026-01-02T00:00:00Z")
            contract.allocate_matured_claim(offer_id)
            direct_vm.warp(NOW)
        else:
            direct_vm.sender = participant
            contract.decline_offer(offer_id)
    totals = contract.get_ledger_totals()
    assert totals["accounted"] == totals["deposited"] == expected_total


def test_supported_invalid_payments_return_without_post_credit_revert(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    assert fund(contract, direct_vm, 999999, amount=7) == "REFUNDABLE_CREDIT_UNKNOWN_OFFER"
    assert contract.get_wallet_credit(PUBLISHER) == 7

