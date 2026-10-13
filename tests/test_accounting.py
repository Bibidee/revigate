import random
import unittest

from protocol.accounting import Ledger, Offer, Rejected


def offer(offer_id="one", amount=10**18, exit_bps=2000):
    return Offer(offer_id, "alice", "bob", amount, exit_bps, 10, 20, 100)


class AccountingTests(unittest.TestCase):
    def setUp(self):
        self.ledger = Ledger()
        self.ledger.create(offer(), now=1)

    def test_separate_exact_funding_then_acceptance(self):
        self.assertTrue(self.ledger.fund("one", "alice", 10**18, 2))
        self.ledger.accept("one", "bob", 1, 3, 1)
        self.assertEqual(self.ledger.offers["one"].held, 10**18)
        self.ledger.assert_conservation()

    def test_wrong_sender_and_wrong_value_become_refundable_credit(self):
        self.assertFalse(self.ledger.fund("one", "mallory", 10**18, 2))
        self.assertFalse(self.ledger.fund("one", "alice", 7, 2))
        self.assertEqual(self.ledger.credits, {"mallory": 10**18, "alice": 7})
        self.assertEqual(self.ledger.offers["one"].held, 0)
        self.ledger.assert_conservation()

    def test_no_cancel_or_accept_as_wrong_wallet(self):
        self.ledger.fund("one", "alice", 10**18, 2)
        with self.assertRaises(Rejected):
            self.ledger.accept("one", "alice", 1, 3, 1)
        self.ledger.accept("one", "bob", 1, 3, 1)
        with self.assertRaises(Rejected):
            self.ledger.decline("one", "bob")

    def test_matured_entitlement_survives_revision_outcomes(self):
        self.ledger.fund("one", "alice", 10**18, 2)
        self.ledger.accept("one", "bob", 1, 3, 1)
        for outcome in ("MATERIAL", "NONMATERIAL", "INCONCLUSIVE"):
            self.ledger.revise(outcome, 1, 5, "sha")
        self.ledger.allocate_maturity("one", 100)
        self.assertEqual(self.ledger.credits["bob"], 10**18)
        self.assertEqual(self.ledger.credits.get("alice", 0), 0)
        with self.assertRaises(Rejected):
            self.ledger.allocate_maturity("one", 101)

    def test_exit_split_floor_remainder_and_zero_endpoint(self):
        one = Ledger(); one.create(offer(amount=1, exit_bps=3333), 1)
        one.fund("one", "alice", 1, 2); one.accept("one", "bob", 1, 3, 1)
        one.acknowledge_material_epoch("one", 2, 5)
        self.assertEqual(one.allocate_early_exit("one", "bob", 6), (1, 0))
        full = Ledger(); full.create(offer(amount=10_000, exit_bps=10_000), 1)
        full.fund("one", "alice", 10_000, 2); full.accept("one", "bob", 1, 3, 1)
        full.acknowledge_material_epoch("one", 2, 5)
        self.assertEqual(full.allocate_early_exit("one", "bob", 6), (0, 10_000))

    def test_reaffirmation_cannot_extend_first_exit_deadline(self):
        self.ledger.fund("one", "alice", 10**18, 2); self.ledger.accept("one", "bob", 1, 3, 1)
        self.ledger.acknowledge_material_epoch("one", 2, 5, window=10)
        deadline = self.ledger.offers["one"].first_exit_deadline
        self.ledger.acknowledge_material_epoch("one", 3, 8, window=10)
        self.assertEqual(self.ledger.offers["one"].first_exit_deadline, deadline)

    def test_refund_to_publisher_only_once(self):
        self.ledger.fund("one", "alice", 10**18, 2)
        self.ledger.decline("one", "bob")
        self.assertEqual(self.ledger.credits["alice"], 10**18)
        with self.assertRaises(Rejected):
            self.ledger.decline("one", "bob")

    def test_randomized_funding_and_allocation_conservation(self):
        rng = random.Random(61999)
        ledger = Ledger()
        for i in range(100):
            amount = rng.randint(1, 10**24)
            candidate = offer(str(i), amount, rng.randint(0, 10_000))
            ledger.create(candidate, 1)
            ledger.fund(str(i), "alice", amount, 2)
            if i % 2:
                ledger.decline(str(i), "bob")
            else:
                ledger.accept(str(i), "bob", 1, 3, 1)
                ledger.allocate_maturity(str(i), 100)
            ledger.assert_conservation()


if __name__ == "__main__":
    unittest.main()
