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
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(
        "bibidee/revigate", "fixtures/rulebook_v1.md", ".revigate/publisher.json",
        "main", "1" * 40,
    )
    program = contract.programs[program_id]
    program.active_sha = "1" * 40
    program.document_digest = "d" * 64
    program.epoch = 1
    program.status = "VERIFIED"
    return contract


def make_offer(contract, participant=PARTICIPANT, amount=AMOUNT, exit_bps=2_000, exit_window=3_600):
    return contract.create_offer(
        1,
        participant,
        amount,
        NOW_TS + 3_600,
        NOW_TS + 7_200,
        NOW_TS + 86_400,
        exit_bps,
        exit_window,
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
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER

    with direct_vm.expect_revert("Invalid Markdown path"):
        contract.propose_program(
            "bibidee/rulebook", "/rules.md", ".revigate/publisher.json", "main", "1" * 40
        )


def test_T01_malformed_manifest_path_and_baseline_sha_are_rejected(direct_deploy, direct_vm):
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER
    with direct_vm.expect_revert("Invalid manifest path or full commit SHA"):
        contract.propose_program(
            "bibidee/revigate", "rules/program.md", "../publisher.json", "main", "1" * 40,
        )
    with direct_vm.expect_revert("Invalid manifest path or full commit SHA"):
        contract.propose_program(
            "bibidee/revigate", "rules/program.md", ".revigate/publisher.json", "main", "1234",
        )
    assert contract.next_program == 1


def test_T01_publisher_is_caller_and_zero_address_cannot_register(direct_deploy, direct_vm):
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER
    program_id = contract.propose_program(
        "bibidee/revigate", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40,
    )
    assert contract.programs[program_id].owner == PUBLISHER

    direct_vm.sender = "0x" + "0" * 40
    with direct_vm.expect_revert("Publisher wallet cannot be the zero address"):
        contract.propose_program(
            "bibidee/revigate", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40,
        )
    assert contract.next_program == 2


def test_T01_repo_and_branch_refuse_path_confusion(direct_deploy, direct_vm):
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER

    with direct_vm.expect_revert("Invalid GitHub owner/repository"):
        contract.propose_program("../revigate", "rules/program.md", ".revigate/publisher.json", "main", "1" * 40)
    with direct_vm.expect_revert("Invalid publication branch"):
        contract.propose_program("bibidee/revigate", "rules/program.md", ".revigate/publisher.json", "../main", "1" * 40)


def test_T01_declared_branch_accepts_normal_slash_ref(direct_deploy, direct_vm):
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py")
    direct_vm.sender = PUBLISHER

    program_id = contract.propose_program(
        "bibidee/revigate", "rules/program.md", ".revigate/publisher.json", "release/v1", "1" * 40
    )

    assert contract.programs[program_id].branch == "release/v1"


def test_T05_only_program_publisher_can_create_an_offer(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("Only the verified publisher"):
        make_offer(contract)


def test_T05_only_publisher_can_request_revision(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    before = contract.get_program(1)
    direct_vm.sender = OTHER
    with direct_vm.expect_revert("Only publisher can request a review"):
        contract.request_revision(1, "2" * 40)
    after = contract.get_program(1)
    assert after["active_sha"] == before["active_sha"]
    assert after["epoch"] == before["epoch"]
    assert after["pending_review"] == 0
    assert contract.next_review == 1


def test_T06_pending_review_blocks_second_candidate_and_replay_is_rejected(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    direct_vm.sender = PUBLISHER
    review_id = contract.request_revision(1, "2" * 40)
    with direct_vm.expect_revert("Review pending or publisher cooldown is active"):
        contract.request_revision(1, "3" * 40)
    direct_vm.warp("2026-01-02T00:00:01Z")
    direct_vm.sender = OTHER
    assert contract.expire_revision_request(review_id) is True
    direct_vm.sender = PUBLISHER
    with direct_vm.expect_revert("This candidate commit has already been reviewed"):
        contract.request_revision(1, "2" * 40)
    assert contract.get_program(1)["epoch"] == 1


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


def test_T14_funding_during_pending_review_stays_refundable_credit(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    review_id = contract.request_revision(1, "2" * 40)

    assert review_id != 0
    assert fund(contract, direct_vm, offer_id) == "REFUNDABLE_CREDIT_REVIEW_PENDING"
    assert contract.get_offer(offer_id)["held"] == 0
    assert contract.get_wallet_credit(PUBLISHER) == AMOUNT
    totals = contract.get_ledger_totals()
    assert totals["deposited"] == totals["credits"] == AMOUNT
    assert totals["held"] == 0


def test_T14_funding_after_material_epoch_change_stays_refundable(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    contract.programs[1].epoch = 2

    assert fund(contract, direct_vm, offer_id) == "REFUNDABLE_CREDIT_STALE_RULEBOOK_EPOCH"
    assert contract.get_offer(offer_id)["held"] == 0
    assert contract.get_wallet_credit(PUBLISHER) == AMOUNT


def test_T15_wrong_wallet_cannot_accept_funded_offer(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    offer = contract.get_offer(offer_id)
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("Only the designated participant"):
        contract.accept_offer(offer_id, offer["terms_digest"], 1, "1" * 40)

    assert contract.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"


def test_T15_material_revision_blocks_acceptance_of_old_funded_offer(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    contract.programs[1].epoch = 2
    contract.programs[1].active_sha = "2" * 40
    contract.programs[1].document_digest = "e" * 64
    contract._append_material_event(1, 2, NOW_TS + 100)
    offer = contract.get_offer(offer_id)
    direct_vm.sender = PARTICIPANT

    with direct_vm.expect_revert("Offer cannot be accepted"):
        contract.accept_offer(offer_id, offer["terms_digest"], offer["epoch"], offer["sha"])

    assert contract.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T15_acceptance_after_deadline_is_rejected(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    direct_vm.warp("2026-01-01T02:00:01Z")
    with direct_vm.expect_revert("Offer cannot be accepted during review or after its deadline"):
        accept(contract, direct_vm, offer_id)
    assert contract.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T12_zero_amount_offer_is_rejected(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)

    with direct_vm.expect_revert("Invalid designated participant or amount"):
        make_offer(contract, amount=0)


def test_T12_rejects_self_zero_wallet_and_unordered_deadlines(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    with direct_vm.expect_revert("Invalid designated participant or amount"):
        make_offer(contract, participant=PUBLISHER)
    with direct_vm.expect_revert("Invalid designated participant or amount"):
        make_offer(contract, participant="0x" + "0" * 40)
    with direct_vm.expect_revert("Offer deadlines must be ordered in the future"):
        contract.create_offer(1, PARTICIPANT, AMOUNT, NOW_TS + 7_200, NOW_TS + 3_600, NOW_TS + 86_400, 0, 0)
    with direct_vm.expect_revert("Offer deadlines must be ordered in the future"):
        contract.create_offer(1, PARTICIPANT, AMOUNT, NOW_TS + 3_600, NOW_TS + 3_600, NOW_TS + 86_400, 0, 0)
    with direct_vm.expect_revert("Exit share must be between 0 and 10000 basis points"):
        contract.create_offer(1, PARTICIPANT, AMOUNT, NOW_TS + 3_600, NOW_TS + 7_200, NOW_TS + 86_400, 10_001, 3_600)
    with direct_vm.expect_revert("Exit window is outside the supported range"):
        contract.create_offer(1, PARTICIPANT, AMOUNT, NOW_TS + 3_600, NOW_TS + 7_200, NOW_TS + 86_400, 1, 3_599)


def test_T16_publisher_cannot_cancel_after_participant_accepts(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER

    with direct_vm.expect_revert("Publisher can only cancel an unaccepted offer"):
        contract.cancel_unaccepted_offer(offer_id)

    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T17_designated_participant_decline_allocates_exact_refund(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    assert fund(contract, direct_vm, offer_id) == "FUNDED"
    direct_vm.sender = PARTICIPANT

    assert contract.decline_offer(offer_id) is True
    assert contract.credits[PUBLISHER] == AMOUNT
    assert contract.credits.get(PARTICIPANT, 0) == 0
    assert contract.get_offer(offer_id)["state"] == "REFUND_ALLOCATED"


def test_T17_unrelated_wallet_cannot_force_participant_refund(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    direct_vm.sender = OTHER
    with direct_vm.expect_revert("Only the designated participant may decline an unaccepted offer"):
        contract.decline_offer(offer_id)
    assert contract.get_offer(offer_id)["state"] == "FUNDED_UNACCEPTED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T18_unaccepted_funded_offer_can_be_expired_permissionlessly(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    direct_vm.warp("2026-01-01T02:00:01Z")
    direct_vm.sender = OTHER

    assert contract.expire_unaccepted_offer(offer_id) is True
    assert contract.get_offer(offer_id)["state"] == "REFUND_ALLOCATED"
    assert contract.get_wallet_credit(PUBLISHER) == AMOUNT


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


def test_T11_pending_revision_does_not_block_matured_claim_or_expiry(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, exit_bps=0)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER
    review_id = contract.request_revision(1, "2" * 40)
    direct_vm.warp("2026-01-02T00:00:00Z")

    assert contract.allocate_matured_claim(offer_id) is True
    assert contract.credits[PARTICIPANT] == AMOUNT
    assert contract.expire_revision_request(review_id) is True
    assert contract.programs[1].epoch == 1
    assert contract.programs[1].status == "VERIFIED"


def test_T22_material_exit_floors_participant_share_and_conserves_remainder(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, amount=AMOUNT, exit_bps=2_000)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    contract.programs[1].epoch = 2
    contract._append_material_event(1, 2, NOW_TS + 100)
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
    contract._append_material_event(1, 2, NOW_TS + 100)
    direct_vm.warp("2026-01-01T00:05:00Z")
    direct_vm.sender = PARTICIPANT

    contract.exercise_material_exit(offer_id)
    assert contract.credits[PARTICIPANT] == 0
    assert contract.credits[PUBLISHER] == 1


def test_T22_exit_basis_point_endpoints_are_exact(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_zero = make_offer(contract, exit_bps=0)
    offer_full = make_offer(contract, amount=AMOUNT, exit_bps=10_000)
    fund(contract, direct_vm, offer_zero)
    accept(contract, direct_vm, offer_zero)
    fund(contract, direct_vm, offer_full)
    accept(contract, direct_vm, offer_full)
    contract.programs[1].epoch = 2
    contract._append_material_event(1, 2, NOW_TS + 100)
    direct_vm.sender = PARTICIPANT
    with direct_vm.expect_revert("No valid material exit"):
        contract.exercise_material_exit(offer_zero)
    assert contract.get_offer(offer_zero)["held"] == AMOUNT

    direct_vm.warp("2026-01-01T00:05:00Z")
    direct_vm.sender = PARTICIPANT
    assert contract.exercise_material_exit(offer_full) is True
    assert contract.get_wallet_credit(PUBLISHER) == 0
    assert contract.get_wallet_credit(PARTICIPANT) == AMOUNT


def test_T23_only_participant_may_exercise_material_exit_within_window(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, exit_bps=2_000)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    contract.programs[1].epoch = 2
    contract._append_material_event(1, 2, NOW_TS + 100)
    direct_vm.warp("2026-01-01T00:05:00Z")
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("No valid material exit is available"):
        contract.exercise_material_exit(offer_id)

    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T23_material_exit_after_fixed_window_is_rejected(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, exit_bps=2_000, exit_window=3_600)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    contract.programs[1].epoch = 2
    contract._append_material_event(1, 2, NOW_TS + 100)
    direct_vm.warp("2026-01-01T01:01:41Z")
    direct_vm.sender = PARTICIPANT
    with direct_vm.expect_revert("No valid material exit is available"):
        contract.exercise_material_exit(offer_id)
    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT


def test_T24_T25_reaffirmation_does_not_extend_first_material_exit_window(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract, exit_bps=2_000)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    program = contract.programs[1]
    program.epoch = 2
    program.active_sha = "2" * 40
    program.document_digest = "e" * 64
    contract._append_material_event(1, 2, NOW_TS + 100)
    direct_vm.sender = PARTICIPANT
    contract.reaffirm_offer_rules(offer_id, 2, program.active_sha, program.document_digest)
    first_deadline = contract.offers[offer_id].exit_deadline

    program.epoch = 3
    program.active_sha = "3" * 40
    program.document_digest = "f" * 64
    contract._append_material_event(1, 3, NOW_TS + 200)
    contract.reaffirm_offer_rules(offer_id, 3, program.active_sha, program.document_digest)

    assert contract.offers[offer_id].exit_trigger_epoch == 2
    assert contract.offers[offer_id].exit_deadline == first_deadline
    assert contract.offers[offer_id].ack_epoch == 1


def test_T28_wallet_cannot_withdraw_another_wallets_credit(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    contract.credits[PUBLISHER] = 10
    direct_vm.sender = OTHER

    with direct_vm.expect_revert("Insufficient wallet credit"):
        contract.withdraw_credit(10)

    assert contract.credits[PUBLISHER] == 10


def test_T28_withdrawal_debits_credit_once_and_records_unknown_delivery(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    contract.credits[PUBLISHER] = 10
    contract.total_credits = 10
    contract.total_deposited = 10
    direct_vm.sender = PUBLISHER

    transfer_id = contract.withdraw_credit(10)

    assert transfer_id == 1
    assert contract.get_transfer(transfer_id) == {
        "recipient": PUBLISHER, "amount": 10, "status": "UNKNOWN_DELIVERY",
        "at": NOW_TS,
    }
    assert contract.get_wallet_credit(PUBLISHER) == 0
    assert contract.total_withdrawn == 10
    with direct_vm.expect_revert("Insufficient wallet credit"):
        contract.withdraw_credit(10)


def test_T29_randomized_offer_sequences_conserve_deposits(direct_deploy, direct_vm):
    import random

    contract = make_contract(direct_deploy, direct_vm)
    rng = random.Random(61999)
    expected_total = 0

    for index in range(100):
        direct_vm.sender = PUBLISHER
        participant = "0x" + f"{index + 1:040x}"
        amount = rng.randint(1, 10**9)
        exit_bps = rng.choice([0, 2_000, 5_000, 10_000])
        expected_total += amount
        offer_id = make_offer(contract, participant=participant, amount=amount, exit_bps=exit_bps)
        assert fund(contract, direct_vm, offer_id, amount=amount) == "FUNDED"

        action = rng.choice(("decline", "expire", "mature", "exit", "closure", "hold"))
        if action == "decline":
            direct_vm.sender = participant
            contract.decline_offer(offer_id)
        elif action == "expire":
            direct_vm.warp("2026-01-01T02:00:01Z")
            direct_vm.sender = OTHER
            contract.expire_unaccepted_offer(offer_id)
        else:
            accept(contract, direct_vm, offer_id, participant=participant)
            if action == "mature":
                direct_vm.warp("2026-01-02T00:00:00Z")
                contract.allocate_matured_claim(offer_id)
            elif action == "exit" and exit_bps > 0:
                contract.programs[1].epoch += 1
                contract._append_material_event(1, contract.programs[1].epoch, NOW_TS + 100)
                direct_vm.warp("2026-01-01T00:05:00Z")
                direct_vm.sender = participant
                contract.exercise_material_exit(offer_id)
            elif action == "closure":
                share_b = rng.randint(0, amount)
                direct_vm.sender = PUBLISHER
                digest = contract.propose_closure(offer_id, amount - share_b, share_b, NOW_TS + 1_800)
                direct_vm.sender = participant
                contract.approve_closure(offer_id, digest)
        direct_vm.warp(NOW)

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


def test_T26_closure_amount_sum_cannot_wrap_u256(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER

    with direct_vm.expect_revert("Closure shares must allocate"):
        contract.propose_closure(offer_id, (1 << 256) - 1, 102, NOW_TS + 1_800)

    assert contract.get_offer(offer_id)["held"] == AMOUNT
    assert contract.get_offer(offer_id)["closure"] is None


def test_T41_unscoped_rulebook_text_is_included_in_materiality_diff(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    before = "Publisher reserves discretion.\n\n## R-01: Eligibility\nParticipants qualify.\n\n## R-02: Benefit\nParticipants receive access."
    after = "Publisher may terminate any participant.\n\n## R-01: Eligibility\nParticipants qualify.\n\n## R-02: Benefit\nParticipants receive access."

    before_clauses = contract._clauses(before)
    after_clauses = contract._clauses(after)
    changed = contract._changed_clauses(before_clauses, after_clauses)

    assert "__PREAMBLE__" in changed
    assert changed["__PREAMBLE__"]["before"]["body"] == "Publisher reserves discretion."
    assert changed["__PREAMBLE__"]["after"]["body"] == "Publisher may terminate any participant."


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
    direct_vm.sender = OTHER
    assert contract.expire_closure(offer_id) is True
    assert contract.get_offer(offer_id)["state"] == "ACCEPTED_LOCKED"
    assert contract.get_offer(offer_id)["held"] == AMOUNT
    direct_vm.warp("2026-01-02T00:00:00Z")
    assert contract.allocate_matured_claim(offer_id) is True
    assert contract.credits[PARTICIPANT] == AMOUNT


def test_T27_open_closure_cannot_block_matured_participant_claim(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    offer_id = make_offer(contract)
    fund(contract, direct_vm, offer_id)
    accept(contract, direct_vm, offer_id)
    direct_vm.sender = PUBLISHER
    contract.propose_closure(offer_id, 50, 51, NOW_TS + 3_600)
    direct_vm.warp("2026-01-02T00:00:00Z")

    assert contract.allocate_matured_claim(offer_id) is True
    assert contract.get_offer(offer_id)["state"] == "MATURED_ALLOCATED"
    assert contract.get_offer(offer_id)["closure"] is None
    assert contract.credits[PARTICIPANT] == AMOUNT


def test_T48_pages_are_bounded_latest_first_and_stable_across_new_offers(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    assert contract.get_offer_page(0, 50) == {"items": [], "next_cursor": 0}
    for index in range(103):
        direct_vm.sender = PUBLISHER
        make_offer(contract, participant="0x" + f"{index + 1:040x}", amount=AMOUNT)

    first = contract.get_offer_page(0, 50)
    assert len(first["items"]) == 50
    assert first["items"][0]["id"] == 103
    assert first["items"][-1]["id"] == 54
    assert first["next_cursor"] == 54

    direct_vm.sender = PUBLISHER
    make_offer(contract, participant="0x" + f"{99:040x}", amount=AMOUNT)
    second = contract.get_offer_page(first["next_cursor"], 50)
    assert [item["id"] for item in second["items"]] == list(range(53, 3, -1))
    third = contract.get_offer_page(second["next_cursor"], 50)
    assert [item["id"] for item in third["items"]] == [3, 2, 1]
    wallet_page = contract.get_wallet_offer_page(PUBLISHER, 0, 50)
    assert len(wallet_page["items"]) == 50
    assert wallet_page["items"][0]["id"] == 104
    assert [item["id"] for item in wallet_page["items"]] == list(range(104, 54, -1))
    make_offer(contract, participant="0x" + f"{1000:040x}", amount=AMOUNT)
    wallet_second = contract.get_wallet_offer_page(PUBLISHER, wallet_page["next_cursor"], 50)
    assert [item["id"] for item in wallet_second["items"]] == list(range(54, 4, -1))
    wallet_third = contract.get_wallet_offer_page(PUBLISHER, wallet_second["next_cursor"], 50)
    assert [item["id"] for item in wallet_third["items"]] == [4, 3, 2, 1]

    with direct_vm.expect_revert("Page size must be between 1 and 50"):
        contract.get_offer_page(0, 0)


def test_T48_program_material_history_readback_is_capped(direct_deploy, direct_vm):
    contract = make_contract(direct_deploy, direct_vm)
    for epoch in range(1, 104):
        contract._append_material_event(1, epoch, NOW_TS + epoch)

    program = contract.get_program(1)

    assert program["material_history_count"] == 103
    assert program["material_history_truncated"] is True
    assert len(program["material_history"]) == 50
    assert program["material_history"][0] == [54, NOW_TS + 54]
    assert program["material_history"][-1] == [103, NOW_TS + 103]
