"""Direct Mode checks against the production contract source.

Each test starts from a new in-memory GenLayer VM. These prove contract logic
under Direct Mode, not hosted consensus, custody, or real transfer delivery.
"""

PUBLISHER = "0x" + "a" * 40
PARTICIPANT = "0x" + "b" * 40
OTHER = "0x" + "c" * 40
NOW = "2026-01-01T00:00:00Z"
NOW_TS = 1_767_225_600
AMOUNT = 101


def make_contract(direct_deploy, direct_vm):
    direct_vm.warp(NOW)
    contract = direct_deploy("contracts/revigate.py")
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
        1,
        participant,
        amount,
        NOW_TS + 3_600,
        NOW_TS + 7_200,
        NOW_TS + 86_400,
        exit_bps,
        3_600,
    )


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
        offer_id,
        offer["terms_digest"],
        offer["epoch"],
        offer["sha"],
    )


def test_T01_malformed_rulebook_path_is_rejected(direct_deploy, direct_vm):
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER

    with direct_vm.expect_revert("Source path is invalid"):
        contract.register_program(
            "bibidee/rulebook", "/rules.md", ".revigate/publisher.json", "main", "1" * 40
        )


def test_T05_only_program_publisher_can_create_an_offer(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("Only the verified publisher"):
        make_offer(contract)


def test_T13_offer_creation_does_not_take_value(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)

    assert contract.get_offer(offer_id)["held"] == 0
    assert contract.credits.get(PUBLISHER, 0) == 0


def test_T14_wrong_funding_amount_becomes_publisher_credit(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)

    assert fund(contract, direct_vm, offer_id, amount=AMOUNT - 1) == "REFUNDABLE_CREDIT_WRONG_AMOUNT"
    assert contract.get_offer(offer_id)["held"] == 0
    assert contract.credits[PUBLISHER] == AMOUNT - 1


def test_T14_wrong_funder_is_credited_without_locking_the_offer(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)

    assert fund(contract, direct_vm, offer_id, sender=OTHER) == "REFUNDABLE_CREDIT_WRONG_SENDER"
    assert contract.get_offer(offer_id)["held"] == 0
    assert contract.credits[OTHER] == AMOUNT


def test_T14_duplicate_funding_becomes_credit_and_zero_value_is_rejected(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    assert fund(contract, direct_vm, offer_id) == "REFUNDABLE_CREDIT_DUPLICATE"
    assert contract.get_wallet_credit(PUBLISHER) == AMOUNT
    direct_vm.value = 0
    with direct_vm.expect_revert("Funding value must be positive"):
        contract.fund_offer(offer_id)
    assert contract.total_deposited == AMOUNT * 2
    assert contract.total_held == AMOUNT
    assert contract.total_credits == AMOUNT


def test_T15_wrong_wallet_cannot_accept_funded_offer(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    offer = contract.get_offer(offer_id)
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("Only the designated participant"):
        contract.accept_offer(offer_id, offer["terms_digest"], 1, "1" * 40)

    assert contract.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"


def test_T17_designated_participant_decline_allocates_exact_refund(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    direct_vm.sender = PARTICIPANT

    assert contract.decline_offer(offer_id) is True
    assert contract.credits[PUBLISHER] == AMOUNT
    assert contract.credits.get(PARTICIPANT, 0) == 0
    assert contract.get_offer(offer_id)["state"] == "REFUND_ALLOCATED"


def test_T19_maturity_preserves_full_original_participant_entitlement(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    assert accept(contract, direct_vm, offer_id) is True
    direct_vm.warp("2026-01-02T00:00:00Z")

    assert contract.allocate_matured_claim(offer_id) is True
    assert contract.credits[PARTICIPANT] == AMOUNT
    assert contract.credits.get(PUBLISHER, 0) == 0
    assert contract.get_offer(offer_id)["allocated_b"] == AMOUNT


def test_T20_maturity_allocation_cannot_run_twice(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.warp("2026-01-02T00:00:00Z")
    contract.allocate_matured_claim(offer_id)

    with direct_vm.expect_revert("Accepted offer is not mature"):
        contract.allocate_matured_claim(offer_id)

    assert contract.credits[PARTICIPANT] == AMOUNT


def test_T22_material_exit_floors_participant_share_and_conserves_remainder(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, amount=AMOUNT, exit_bps=2_000)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    contract.programs[1].epoch = 2
    contract.programs[1].first_material_at = NOW_TS + 100
    direct_vm.warp("2026-01-01T00:05:00Z")
    direct_vm.sender = PARTICIPANT

    assert contract.exercise_material_exit(offer_id) is True
    assert contract.credits[PARTICIPANT] == 20
    assert contract.credits[PUBLISHER] == 81
    assert contract.credits[PARTICIPANT] + contract.credits[PUBLISHER] == AMOUNT


def test_T22_one_wei_exit_remainder_stays_with_publisher(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, amount=1, exit_bps=5_000)
    fund(contract, direct_vm, offer_id, amount=1)
    accept(contract, direct_vm, offer_id)
    contract.programs[1].epoch = 2
    contract.programs[1].first_material_at = NOW_TS + 100
    direct_vm.warp("2026-01-01T00:05:00Z")
    direct_vm.sender = PARTICIPANT

    contract.exercise_material_exit(offer_id)
    assert contract.get_wallet_credit(PARTICIPANT) == 0
    assert contract.credits[PUBLISHER] == 1


def test_T28_wallet_cannot_withdraw_another_wallets_credit(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    contract.credits[PUBLISHER] = 10
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("Insufficient wallet credit"):
        contract.withdraw_credit(10)

    assert contract.credits[PUBLISHER] == 10


def test_T28_successful_withdrawal_consumes_credit_and_records_unknown_delivery(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id, amount=AMOUNT - 1) == "REFUNDABLE_CREDIT_WRONG_AMOUNT"
    direct_vm.sender = PUBLISHER
    transfer_id = contract.withdraw_credit(AMOUNT - 1)
    transfer = contract.get_transfer(transfer_id)
    assert transfer["recipient"] == PUBLISHER
    assert transfer["amount"] == AMOUNT - 1
    assert transfer["status"] == "UNKNOWN_DELIVERY"
    assert contract.get_wallet_credit(PUBLISHER) == 0
    assert contract.get_ledger_totals()["dispatched"] == AMOUNT - 1


def test_T29_randomized_offer_sequences_conserve_deposits(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    expected_total = 0

    for index in range(100):
        direct_vm.sender = PUBLISHER
        participant = "0x" + f"{index + 1:040x}"
        amount = index + 1
        expected_total += amount
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

    total_credits = sum(contract.credits.values())
    total_held = sum(offer.held for offer in contract.offers.values())
    assert total_credits + total_held == expected_total
    totals = contract.get_ledger_totals()
    assert totals["accounted"] == totals["deposited"] == expected_total


def test_T26_closure_requires_both_wallets_to_approve_the_same_digest(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER
    digest = contract.propose_closure(offer_id, 31, 70, NOW_TS + 1_800)
    assert contract.get_offer(offer_id)["held"] == AMOUNT
    with direct_vm.expect_revert("Closure requires approval from the other wallet"):
        contract.approve_closure(offer_id, digest)
    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    direct_vm.sender = PARTICIPANT
    assert contract.approve_closure(offer_id, digest) is True
    assert contract.get_offer(offer_id)["state"] == "MUTUAL_CLOSURE_ALLOCATED"
    assert contract.credits[PUBLISHER] == 31
    assert contract.credits[PARTICIPANT] == 70


def test_T27_cancelled_or_expired_closure_restores_claim_state(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER
    contract.propose_closure(offer_id, 50, 51, NOW_TS + 60)
    direct_vm.sender = PARTICIPANT
    assert contract.cancel_closure(offer_id) is True
    assert contract.get_offer(offer_id)["closure"] is None
    assert contract.get_offer(offer_id)["held"] == AMOUNT
    direct_vm.sender = PUBLISHER
    contract.propose_closure(offer_id, 50, 51, NOW_TS + 60)
    direct_vm.warp("2026-01-01T00:02:00Z")
    assert contract.expire_closure(offer_id) is True
    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT
    direct_vm.warp("2026-01-02T00:00:00Z")
    assert contract.allocate_matured_claim(offer_id) is True
    assert contract.credits[PARTICIPANT] == AMOUNT


def test_T48_pages_are_bounded_latest_first_and_stable_across_new_offers(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    for index in range(52):
        direct_vm.sender = PUBLISHER
        make_offer(contract, participant="0x" + f"{index + 1:040x}", amount=AMOUNT)

    first = contract.get_offer_page(0, 50)
    assert len(first["items"]) == 50
    assert first["items"][0]["id"] == 52
    assert first["items"][-1]["id"] == 3
    assert first["next_cursor"] == 3

    direct_vm.sender = PUBLISHER
    make_offer(contract, participant="0x" + f"{99:040x}", amount=AMOUNT)
    second = contract.get_offer_page(first["next_cursor"], 50)
    assert [item["id"] for item in second["items"]] == [2, 1]
    wallet_page = contract.get_wallet_offer_page(PUBLISHER, 0, 50)
    assert len(wallet_page["items"]) == 50
    assert wallet_page["items"][0]["id"] == 53

    with direct_vm.expect_revert("Page size must be between 1 and 50"):
        contract.get_offer_page(0, 0)
