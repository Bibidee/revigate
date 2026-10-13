"""Deterministic reference model for Revigate offer allocation.

This is a test oracle only. Production custody must be implemented in and
verified against the GenLayer Intelligent Contract runtime.
"""
from dataclasses import dataclass


class Rejected(ValueError):
    pass


@dataclass
class Offer:
    offer_id: str
    publisher: str
    participant: str
    amount: int
    exit_bps: int
    funding_deadline: int
    acceptance_deadline: int
    maturity: int
    state: str = "OFFERED_UNFUNDED"
    held: int = 0
    accepted_at: int | None = None
    accepted_epoch: int | None = None
    acknowledged_epoch: int | None = None
    first_exit_deadline: int | None = None
    allocated_a: int = 0
    allocated_b: int = 0


class Ledger:
    """Small executable oracle for offer lifecycle and exact integer splits."""

    def __init__(self) -> None:
        self.offers: dict[str, Offer] = {}
        self.credits: dict[str, int] = {}
        self.deposits = 0
        self.allocated = 0

    def create(self, offer: Offer, now: int) -> None:
        if offer.offer_id in self.offers:
            raise Rejected("offer id replay")
        if not offer.publisher or not offer.participant or offer.publisher == offer.participant:
            raise Rejected("invalid wallet roles")
        if offer.amount <= 0 or not 0 <= offer.exit_bps <= 10_000:
            raise Rejected("invalid amount or exit share")
        if not now < offer.funding_deadline < offer.acceptance_deadline < offer.maturity:
            raise Rejected("invalid deadlines")
        self.offers[offer.offer_id] = offer

    def fund(self, offer_id: str, sender: str, value: int, now: int) -> bool:
        """Model refund-first handling; false means value is refundable credit."""
        if value <= 0:
            raise Rejected("zero value cannot enter a payable method")
        self.deposits += value
        self.credits[sender] = self.credits.get(sender, 0) + value
        offer = self.offers.get(offer_id)
        if (offer is None or sender != offer.publisher or offer.state != "OFFERED_UNFUNDED"
                or now > offer.funding_deadline or value != offer.amount):
            self.assert_conservation()
            return False
        self.credits[sender] -= value
        offer.held = value
        offer.state = "FUNDED_UNACCEPTED"
        self.assert_conservation()
        return True

    def accept(self, offer_id: str, sender: str, epoch: int, now: int, current_epoch: int) -> None:
        offer = self._get(offer_id)
        if sender != offer.participant or offer.state != "FUNDED_UNACCEPTED":
            raise Rejected("only designated participant may accept funded offer")
        if now > offer.acceptance_deadline or now >= offer.maturity or epoch != current_epoch:
            raise Rejected("expired or stale terms")
        offer.state = "ACCEPTED_LOCKED"
        offer.accepted_at = now
        offer.accepted_epoch = epoch
        offer.acknowledged_epoch = epoch

    def revise(self, outcome: str, current_epoch: int, now: int, new_reviewed_sha: str) -> tuple[int, str]:
        if outcome == "MATERIAL":
            return current_epoch + 1, new_reviewed_sha
        if outcome == "NONMATERIAL":
            return current_epoch, new_reviewed_sha
        if outcome == "INCONCLUSIVE":
            return current_epoch, ""
        raise Rejected("invalid consensus outcome")

    def acknowledge_material_epoch(self, offer_id: str, new_epoch: int, now: int, window: int = 604800) -> None:
        offer = self._get(offer_id)
        if offer.state != "ACCEPTED_LOCKED" or offer.acknowledged_epoch is None:
            raise Rejected("no active accepted acknowledgment")
        if new_epoch <= offer.acknowledged_epoch:
            raise Rejected("epoch must advance")
        offer.acknowledged_epoch = new_epoch
        if offer.first_exit_deadline is None:
            offer.first_exit_deadline = min(now + window, offer.maturity)

    def allocate_maturity(self, offer_id: str, now: int) -> None:
        offer = self._get(offer_id)
        if offer.state != "ACCEPTED_LOCKED" or now < offer.maturity:
            raise Rejected("not an eligible maturity claim")
        self._allocate(offer, 0, offer.held)
        offer.state = "MATURED_ALLOCATED"

    def allocate_early_exit(self, offer_id: str, sender: str, now: int) -> tuple[int, int]:
        offer = self._get(offer_id)
        if (sender != offer.participant or offer.state != "ACCEPTED_LOCKED"
                or offer.first_exit_deadline is None or now > offer.first_exit_deadline
                or now >= offer.maturity):
            raise Rejected("no eligible material exit")
        share_b = offer.held * offer.exit_bps // 10_000
        share_a = offer.held - share_b
        self._allocate(offer, share_a, share_b)
        offer.state = "MATERIAL_EXIT_ALLOCATED"
        return share_a, share_b

    def decline(self, offer_id: str, sender: str) -> None:
        offer = self._get(offer_id)
        if sender != offer.participant or offer.state != "FUNDED_UNACCEPTED":
            raise Rejected("decline not authorized")
        self._allocate(offer, offer.held, 0)
        offer.state = "REFUND_ALLOCATED"

    def _allocate(self, offer: Offer, amount_a: int, amount_b: int) -> None:
        if offer.held <= 0 or amount_a + amount_b != offer.held:
            raise Rejected("allocation mismatch or replay")
        offer.held = 0
        offer.allocated_a += amount_a
        offer.allocated_b += amount_b
        self.credits[offer.publisher] = self.credits.get(offer.publisher, 0) + amount_a
        self.credits[offer.participant] = self.credits.get(offer.participant, 0) + amount_b
        self.allocated += amount_a + amount_b
        self.assert_conservation()

    def _get(self, offer_id: str) -> Offer:
        try:
            return self.offers[offer_id]
        except KeyError as exc:
            raise Rejected("unknown offer") from exc

    def assert_conservation(self) -> None:
        held = sum(offer.held for offer in self.offers.values())
        credited = sum(self.credits.values())
        allocated_unspent = sum(o.allocated_a + o.allocated_b for o in self.offers.values())
        # Allocated principal is represented in wallet credits, not counted twice.
        del allocated_unspent
        if self.deposits != held + credited:
            raise AssertionError(f"deposit conservation failed: {self.deposits} != {held} + {credited}")
        if any(value < 0 for value in self.credits.values()):
            raise AssertionError("negative beneficiary credit")
