# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Revigate Vault migration candidate for Studionet.

Custody is disabled by default and cannot be enabled after deployment. This is
intentional: live Studionet evidence shows failed calls can strand incoming
value outside contract accounting. Deploying with ``custody_enabled=False`` is
safe for zero-value Registry/Vault protocol verification only.
"""

from dataclasses import dataclass
import datetime
import hashlib
import re

from genlayer import *


CHAIN_ID = 61999
ZERO = "0x0000000000000000000000000000000000000000"
EXIT_DENOMINATOR = 10000


@gl.contract_interface
class _Registry:
    class View:
        def get_program_for_vault(self, program_id: u256) -> dict: ...


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class ProgramSnapshot:
    publisher: str
    epoch: u64
    sha: str
    document_digest: str
    last_nonce: u256
    first_material_epoch: u64
    first_material_at: u64
    material_event_count: u256


@allow_storage
@dataclass
class Offer:
    id: u256
    agreement_id: str
    program_id: u256
    publisher: str
    participant: str
    principal: u256
    epoch: u64
    sha: str
    document_digest: str
    funding_deadline: u64
    acceptance_deadline: u64
    maturity: u64
    exit_bps: u64
    exit_window: u64
    state: str
    held: u256
    accepted: bool
    accepted_at: u64
    ack_epoch: u64
    exit_trigger_epoch: u64
    exit_deadline: u64
    allocated_publisher: u256
    allocated_participant: u256
    closure_nonce: u256
    closure_pending: bool
    closure_digest: str
    closure_amount_publisher: u256
    closure_amount_participant: u256
    closure_expires_at: u64
    closure_proposer: str


@allow_storage
@dataclass
class MaterialEvent:
    epoch: u64
    at: u64


@allow_storage
@dataclass
class Transfer:
    recipient: str
    amount: u256
    status: str
    evidence: str
    created_at: u64
    reconciled_at: u64


class RevigateVault(gl.Contract):
    programs: TreeMap[u256, ProgramSnapshot]
    offers: TreeMap[u256, Offer]
    material_events: TreeMap[str, MaterialEvent]
    processed_messages: TreeMap[str, bool]
    agreement_ids: TreeMap[str, bool]
    credits: TreeMap[str, u256]
    transfers: TreeMap[u256, Transfer]
    wallet_offer_ids: TreeMap[str, u256]
    wallet_offer_counts: TreeMap[str, u256]
    next_offer: u256
    next_transfer: u256
    registry: Address
    custody_enabled: bool
    total_received: u256
    total_held: u256
    total_claimable: u256
    total_transfer_pending: u256
    total_unreconciled: u256

    def __init__(self, registry: Address, custody_enabled: bool):
        self._require_address(registry, "Registry")
        normalized_registry = str(registry).lower()
        if normalized_registry in (ZERO, self._sender()):
            self._fail("Registry must be a separate nonzero contract address")
        self.registry = Address(normalized_registry)
        self.custody_enabled = custody_enabled
        self.next_offer = u256(1)
        self.next_transfer = u256(1)
        self.total_received = u256(0)
        self.total_held = u256(0)
        self.total_claimable = u256(0)
        self.total_transfer_pending = u256(0)
        self.total_unreconciled = u256(0)

    def _sender(self) -> str:
        return str(gl.message.sender_address).lower()

    def _fail(self, message: str):
        raise gl.vm.UserError(message)

    def _now(self) -> u64:
        return u64(int(datetime.datetime.now(datetime.timezone.utc).timestamp()))

    def _require_address(self, value, label: str):
        if not re.fullmatch(r"0x[0-9a-fA-F]{40}", str(value)):
            self._fail(label + " address is invalid")

    def _authenticate_message(self, message_id: str, nonce: u256,
                              program_id: u256):
        if self._sender() != str(self.registry).lower():
            self._fail("Only the paired Registry may send this message")
        if not re.fullmatch(r"[0-9a-f]{64}", message_id):
            self._fail("Message identity is invalid")
        if self.processed_messages.get(message_id, False):
            return False
        program = self.programs.get(program_id)
        if program is not None and nonce <= program.last_nonce:
            self._fail("Registry nonce is stale or out of order")
        self.processed_messages[message_id] = True
        return True

    @gl.public.write
    def register_program_snapshot(self, message_id: str, nonce: u256,
                                  program_id: u256, publisher: Address, epoch: u64,
                                  sha: str, document_digest: str) -> bool:
        if not self._authenticate_message(message_id, nonce, program_id):
            return False
        self._require_address(publisher, "Publisher")
        publisher_address = str(publisher).lower()
        if (epoch == 0 or not re.fullmatch(r"[0-9a-f]{40}", sha)
                or not re.fullmatch(r"[0-9a-f]{64}", document_digest)):
            self._fail("Program snapshot is malformed")
        existing = self.programs.get(program_id)
        if existing is not None and (existing.publisher != publisher_address
                                     or epoch < existing.epoch):
            self._fail("Program snapshot conflicts with frozen identity")
        self.programs[program_id] = ProgramSnapshot(
            publisher=publisher_address, epoch=epoch, sha=sha,
            document_digest=document_digest, last_nonce=nonce,
            first_material_epoch=(existing.first_material_epoch if existing else u64(0)),
            first_material_at=(existing.first_material_at if existing else u64(0)),
            material_event_count=(existing.material_event_count if existing else u256(0)),
        )
        return True

    @gl.public.write
    def notify_material_change(self, message_id: str, nonce: u256,
                               program_id: u256, epoch: u64,
                               changed_at: u64, sha: str,
                               document_digest: str) -> bool:
        if not self._authenticate_message(message_id, nonce, program_id):
            return False
        program = self.programs.get(program_id)
        if (program is None or epoch == 0 or changed_at == 0
                or not re.fullmatch(r"[0-9a-f]{40}", sha)
                or not re.fullmatch(r"[0-9a-f]{64}", document_digest)):
            self._fail("Material notification is inconsistent")
        program.last_nonce = nonce
        event_key = str(program_id) + ":" + str(epoch)
        if self.material_events.get(event_key) is None:
            self.material_events[event_key] = MaterialEvent(epoch, changed_at)
            program.material_event_count += u256(1)
        if program.first_material_epoch == 0:
            program.first_material_epoch = epoch
            program.first_material_at = changed_at
        elif epoch < program.first_material_epoch:
            program.first_material_epoch = epoch
            program.first_material_at = changed_at
        if epoch > program.epoch:
            program.epoch = epoch
            program.sha = sha
            program.document_digest = document_digest
        elif epoch == program.epoch:
            # The nonce orders source snapshots. Same-epoch editorial updates
            # may legitimately replace the current SHA and digest.
            program.sha = sha
            program.document_digest = document_digest
        return True

    def _agreement_id(self, program_id: u256, participant: str, principal: u256,
                      funding_deadline: u64, acceptance_deadline: u64,
                      maturity: u64, exit_bps: u64, exit_window: u64,
                      snapshot: ProgramSnapshot) -> str:
        fields = ["revigate-agreement-v1", str(CHAIN_ID), str(self.registry).lower(),
                  str(gl.message.contract_address).lower(), str(program_id),
                  snapshot.publisher, participant, str(principal),
                  str(funding_deadline), str(acceptance_deadline), str(maturity),
                  str(exit_bps), str(exit_window), str(snapshot.epoch),
                  snapshot.sha, snapshot.document_digest]
        return hashlib.sha256("|".join(fields).encode("utf-8")).hexdigest()

    @gl.public.write
    def register_offer(self, program_id: u256, participant: Address, principal: u256,
                       funding_deadline: u64, acceptance_deadline: u64,
                       maturity: u64, exit_bps: u64, exit_window: u64) -> u256:
        snapshot = self.programs.get(program_id)
        sender = self._sender()
        self._require_address(participant, "Participant")
        participant_address = str(participant).lower()
        if snapshot is None or sender != snapshot.publisher:
            self._fail("Only the authenticated publisher may register an offer")
        authoritative = _Registry(self.registry).view().get_program_for_vault(program_id)
        if (authoritative is None or authoritative.get("status") != "VERIFIED"
                or authoritative.get("pending_review") != 0
                or authoritative.get("publisher", "").lower() != snapshot.publisher
                or authoritative.get("epoch") != snapshot.epoch
                or authoritative.get("sha") != snapshot.sha
                or authoritative.get("document_digest") != snapshot.document_digest):
            self._fail("Vault snapshot is not the current authenticated Registry state")
        now = self._now()
        if (participant_address in (sender, ZERO) or principal == 0
                or not now < funding_deadline < acceptance_deadline < maturity
                or funding_deadline > now + 30 * 86400
                or acceptance_deadline > now + 30 * 86400
                or maturity > now + 365 * 86400
                or exit_bps > EXIT_DENOMINATOR
                or (exit_bps > 0 and not 3600 <= exit_window <= 2_592_000)):
            self._fail("Financial terms are invalid")
        agreement_id = self._agreement_id(
            program_id, participant_address, principal, funding_deadline,
            acceptance_deadline, maturity, exit_bps, exit_window, snapshot)
        if self.agreement_ids.get(agreement_id, False):
            self._fail("Agreement replay")
        self.agreement_ids[agreement_id] = True
        offer_id = self.next_offer
        self.next_offer += u256(1)
        self.offers[offer_id] = Offer(
            id=offer_id, agreement_id=agreement_id, program_id=program_id,
            publisher=sender, participant=participant_address, principal=principal,
            epoch=snapshot.epoch, sha=snapshot.sha,
            document_digest=snapshot.document_digest,
            funding_deadline=funding_deadline,
            acceptance_deadline=acceptance_deadline, maturity=maturity,
            exit_bps=exit_bps, exit_window=exit_window,
            state="REGISTERED_UNFUNDED", held=u256(0), accepted=False,
            accepted_at=u64(0), ack_epoch=snapshot.epoch,
            exit_trigger_epoch=u64(0), exit_deadline=u64(0),
            allocated_publisher=u256(0), allocated_participant=u256(0),
            closure_nonce=u256(0), closure_pending=False, closure_digest="",
            closure_amount_publisher=u256(0), closure_amount_participant=u256(0),
            closure_expires_at=u64(0), closure_proposer="",
        )
        self._append_wallet_offer(sender, offer_id)
        self._append_wallet_offer(participant_address, offer_id)
        return offer_id

    def _append_wallet_offer(self, wallet: str, offer_id: u256):
        normalized = wallet.lower()
        count = self.wallet_offer_counts.get(normalized, u256(0)) + u256(1)
        self.wallet_offer_counts[normalized] = count
        self.wallet_offer_ids[normalized + ":" + str(count)] = offer_id

    @gl.public.write.payable
    def fund_offer(self, offer_id: u256) -> str:
        # This precondition is an operational gate, not a refund mechanism.
        # Studionet may retain gl.message.value even when this method fails.
        if not self.custody_enabled:
            self._fail("Custody is disabled on this deployment")
        value = gl.message.value
        if value == 0:
            return "REJECTED_ZERO_VALUE"

        # Put all value received through this supported payable route into the
        # sender's refundable credit before validating ordinary offer inputs.
        # Invalid requests return normally so they do not roll this ledger
        # mutation back after the runtime has already credited the value.
        sender = self._sender()
        self.total_received += value
        self.total_claimable += value
        self.credits[sender] = self.credits.get(sender, u256(0)) + value

        offer = self.offers.get(offer_id)
        if offer is None:
            return "REFUNDABLE_CREDIT_UNKNOWN_OFFER"
        if offer.publisher != sender:
            return "REFUNDABLE_CREDIT_WRONG_FUNDER"
        if offer.state != "REGISTERED_UNFUNDED":
            return "REFUNDABLE_CREDIT_OFFER_NOT_FUNDABLE"
        if self._now() > offer.funding_deadline:
            return "REFUNDABLE_CREDIT_FUNDING_EXPIRED"
        if value != offer.principal:
            return "REFUNDABLE_CREDIT_AMOUNT_MISMATCH"

        self.credits[sender] -= value
        self.total_claimable -= value
        offer.held = value
        offer.state = "FUNDED_UNACCEPTED"
        self.total_held += value
        return "FUNDED"

    @gl.public.write
    def accept_offer(self, offer_id: u256, expected_agreement_id: str,
                     expected_epoch: u64, expected_sha: str) -> bool:
        offer = self.offers.get(offer_id)
        sender = self._sender()
        if (offer is None or sender != offer.participant
                or offer.state != "FUNDED_UNACCEPTED"):
            self._fail("Only the designated participant may accept a funded offer")
        authoritative = _Registry(self.registry).view().get_program_for_vault(offer.program_id)
        if (authoritative is None or authoritative.get("status") != "VERIFIED"
                or authoritative.get("pending_review") != 0
                or authoritative.get("epoch") != offer.epoch
                or authoritative.get("sha") != offer.sha
                or authoritative.get("document_digest") != offer.document_digest
                or self._now() > offer.acceptance_deadline):
            self._fail("Offer cannot be accepted against stale or pending Registry state")
        if (expected_agreement_id != offer.agreement_id
                or expected_epoch != offer.epoch or expected_sha.lower() != offer.sha):
            self._fail("Acceptance does not match the frozen agreement")
        offer.accepted = True
        offer.state = "ACCEPTED_LOCKED"
        offer.accepted_at = self._now()
        offer.ack_epoch = expected_epoch
        return True

    @gl.public.write
    def decline_offer(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.participant != self._sender()
                or offer.state != "FUNDED_UNACCEPTED"):
            self._fail("Only the designated participant may decline an unaccepted offer")
        self._allocate(offer, offer.held, u256(0), "REFUND_ALLOCATED")
        return True

    @gl.public.write
    def cancel_unaccepted_offer(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.publisher != self._sender()
                or offer.state not in ("REGISTERED_UNFUNDED", "FUNDED_UNACCEPTED")):
            self._fail("Publisher may only cancel an unaccepted offer")
        if offer.held > 0:
            self._allocate(offer, offer.held, u256(0), "REFUND_ALLOCATED")
        else:
            offer.state = "CANCELLED_UNFUNDED"
        return True

    @gl.public.write
    def expire_unaccepted_offer(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.state not in ("REGISTERED_UNFUNDED", "FUNDED_UNACCEPTED")
                or self._now() <= offer.acceptance_deadline):
            self._fail("Offer has not expired")
        if offer.held > 0:
            self._allocate(offer, offer.held, u256(0), "REFUND_ALLOCATED")
        else:
            offer.state = "EXPIRED_UNFUNDED"
        return True

    def _first_material_after(self, program_id: u256, epoch: u64):
        program = self.programs.get(program_id)
        if program is None:
            return None
        for candidate_epoch in range(int(epoch) + 1, int(program.epoch) + 1):
            event = self.material_events.get(str(program_id) + ":" + str(candidate_epoch))
            if event is not None:
                return event
        return None

    def _set_exit_trigger(self, offer: Offer):
        if offer.exit_trigger_epoch != 0:
            return
        event = self._first_material_after(offer.program_id, offer.ack_epoch)
        if event is not None:
            offer.exit_trigger_epoch = event.epoch
            offer.exit_deadline = min(event.at + offer.exit_window, offer.maturity)

    @gl.public.write
    def reaffirm_offer_rules(self, offer_id: u256, expected_epoch: u64,
                             expected_sha: str, expected_digest: str) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.participant != self._sender()
                or offer.state != "ACCEPTED_LOCKED"):
            self._fail("Only the accepted participant may reaffirm this offer")
        authoritative = _Registry(self.registry).view().get_program_for_vault(offer.program_id)
        if (authoritative is None or authoritative.get("pending_review") != 0
                or authoritative.get("epoch") != expected_epoch
                or authoritative.get("sha") != expected_sha.lower()
                or authoritative.get("document_digest") != expected_digest):
            self._fail("Reaffirmation must bind the current Registry rules")
        self._set_exit_trigger(offer)
        if offer.exit_trigger_epoch == 0:
            offer.ack_epoch = expected_epoch
        return True

    @gl.public.write
    def exercise_material_exit(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        now = self._now()
        if (offer is None or offer.participant != self._sender()
                or offer.state != "ACCEPTED_LOCKED"):
            self._fail("No valid material exit is available")
        self._set_exit_trigger(offer)
        if (offer.exit_trigger_epoch == 0 or offer.exit_bps == 0
                or now > offer.exit_deadline or now >= offer.maturity):
            self._fail("No valid material exit is available")
        participant_share = (offer.held * offer.exit_bps) // EXIT_DENOMINATOR
        publisher_share = offer.held - participant_share
        self._allocate(offer, publisher_share, participant_share,
                       "MATERIAL_EXIT_ALLOCATED")
        return True

    @gl.public.write
    def allocate_matured_claim(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.state != "ACCEPTED_LOCKED"
                or self._now() < offer.maturity):
            self._fail("Accepted offer is not mature")
        self._allocate(offer, u256(0), offer.held, "MATURED_ALLOCATED")
        return True

    def _allocate(self, offer: Offer, publisher_amount: u256,
                  participant_amount: u256, state: str):
        principal = offer.held
        if (principal == 0 or publisher_amount > principal
                or participant_amount > principal
                or publisher_amount + participant_amount != principal):
            self._fail("Allocation is empty, repeated, or does not conserve principal")
        self.total_held -= principal
        offer.held = u256(0)
        offer.closure_pending = False
        offer.closure_digest = ""
        offer.closure_amount_publisher = u256(0)
        offer.closure_amount_participant = u256(0)
        offer.closure_expires_at = u64(0)
        offer.closure_proposer = ""
        offer.allocated_publisher += publisher_amount
        offer.allocated_participant += participant_amount
        offer.state = state
        self.credits[offer.publisher] = self.credits.get(offer.publisher, u256(0)) + publisher_amount
        self.credits[offer.participant] = self.credits.get(offer.participant, u256(0)) + participant_amount
        self.total_claimable += principal

    def _closure_digest(self, offer: Offer, nonce: u256,
                        publisher_amount: u256, participant_amount: u256,
                        expires_at: u64) -> str:
        fields = ["revigate-closure-v1", offer.agreement_id, str(nonce),
                  str(publisher_amount), str(participant_amount), str(expires_at)]
        return hashlib.sha256("|".join(fields).encode("utf-8")).hexdigest()

    @gl.public.write
    def propose_closure(self, offer_id: u256, publisher_amount: u256,
                        participant_amount: u256, expires_at: u64) -> str:
        offer = self.offers.get(offer_id)
        sender = self._sender()
        now = self._now()
        if (offer is None or offer.state != "ACCEPTED_LOCKED"
                or sender not in (offer.publisher, offer.participant)):
            self._fail("Only an accepted-offer party may propose closure")
        if offer.closure_pending:
            self._fail("A closure proposal is already pending")
        if (offer.held == 0 or publisher_amount + participant_amount != offer.held):
            self._fail("Closure shares must allocate the full held amount")
        if not now < expires_at <= min(now + 7 * 86400, offer.maturity):
            self._fail("Closure expiry must be within seven days and before maturity")
        offer.closure_nonce += u256(1)
        digest = self._closure_digest(offer, offer.closure_nonce,
                                      publisher_amount, participant_amount, expires_at)
        offer.closure_pending = True
        offer.closure_digest = digest
        offer.closure_amount_publisher = publisher_amount
        offer.closure_amount_participant = participant_amount
        offer.closure_expires_at = expires_at
        offer.closure_proposer = sender
        return digest

    @gl.public.write
    def approve_closure(self, offer_id: u256, digest: str) -> bool:
        offer = self.offers.get(offer_id)
        sender = self._sender()
        if (offer is None or offer.state != "ACCEPTED_LOCKED"
                or sender not in (offer.publisher, offer.participant)):
            self._fail("Only an accepted-offer party may approve closure")
        if not offer.closure_pending or offer.closure_digest != digest:
            self._fail("No matching pending closure proposal")
        if sender == offer.closure_proposer:
            self._fail("Closure requires approval from the other wallet")
        if self._now() >= offer.closure_expires_at:
            self._fail("Closure proposal has expired")
        self._allocate(offer, offer.closure_amount_publisher,
                       offer.closure_amount_participant, "MUTUAL_CLOSURE_ALLOCATED")
        return True

    @gl.public.write
    def cancel_closure(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.state != "ACCEPTED_LOCKED"
                or not offer.closure_pending
                or self._sender() not in (offer.publisher, offer.participant)):
            self._fail("No pending closure to cancel")
        offer.closure_pending = False
        offer.closure_digest = ""
        return True

    @gl.public.write
    def expire_closure(self, offer_id: u256) -> bool:
        offer = self.offers.get(offer_id)
        if (offer is None or offer.state != "ACCEPTED_LOCKED"
                or not offer.closure_pending or self._now() < offer.closure_expires_at):
            self._fail("Closure proposal is not eligible for expiry")
        offer.closure_pending = False
        offer.closure_digest = ""
        return True

    @gl.public.write
    def withdraw_credit(self, amount: u256) -> u256:
        if not self.custody_enabled:
            self._fail("Custody is disabled on this deployment")
        sender = self._sender()
        value = u256(amount)
        if value == 0 or self.credits.get(sender, u256(0)) < value:
            self._fail("Insufficient wallet credit")
        transfer_id = self.next_transfer
        self.next_transfer += u256(1)
        self.credits[sender] -= value
        self.total_claimable -= value
        self.total_transfer_pending += value
        self.total_unreconciled += value
        self.transfers[transfer_id] = Transfer(
            recipient=sender, amount=value, status="UNKNOWN_DELIVERY",
            evidence="", created_at=self._now(), reconciled_at=u64(0))
        _Recipient(Address(sender)).emit_transfer(value=value)
        return transfer_id

    @gl.public.write
    def record_transfer_delivery_claim(self, transfer_id: u256, evidence: str) -> bool:
        transfer = self.transfers.get(transfer_id)
        if (not self.custody_enabled or transfer is None
                or transfer.recipient != self._sender()
                or transfer.status != "UNKNOWN_DELIVERY"
                or not re.fullmatch(r"0x[0-9a-fA-F]{64}", evidence)):
            self._fail("Recipient confirmation does not match an unknown transfer")
        # A recipient-supplied transaction hash is an assertion, not a proof the
        # Studio runtime can verify. Keep the full amount pending and do not
        # release the liability from contract accounting.
        transfer.status = "RECIPIENT_ASSERTED_DELIVERED"
        transfer.evidence = evidence.lower()
        transfer.reconciled_at = self._now()
        return True

    @gl.public.write
    def reconcile_transfer_unknown(self, transfer_id: u256,
                                   evidence: str) -> bool:
        """Record a recipient's fresh check without releasing or resending funds."""
        transfer = self.transfers.get(transfer_id)
        if (transfer is None or transfer.recipient != self._sender()
                or transfer.status not in ("UNKNOWN_DELIVERY", "RECIPIENT_ASSERTED_DELIVERED")
                or not evidence or len(evidence) > 200):
            self._fail("Only the recipient may reconcile an unknown transfer")
        transfer.evidence = evidence
        transfer.reconciled_at = self._now()
        return True

    @gl.public.view
    def get_offer(self, offer_id: u256) -> dict:
        offer = self.offers.get(offer_id)
        if offer is None:
            return {}
        return self._offer_view(offer)

    def _offer_view(self, offer: Offer) -> dict:
        closure = None
        if offer.closure_pending:
            closure = {"digest": offer.closure_digest, "nonce": offer.closure_nonce,
                       "publisher_amount": offer.closure_amount_publisher,
                       "participant_amount": offer.closure_amount_participant,
                       "expires_at": offer.closure_expires_at,
                       "proposer": offer.closure_proposer}
        return {"id": offer.id, "agreement_id": offer.agreement_id,
                "program_id": offer.program_id, "publisher": offer.publisher,
                "participant": offer.participant, "principal": offer.principal,
                "epoch": offer.epoch, "sha": offer.sha,
                "document_digest": offer.document_digest,
                "funding_deadline": offer.funding_deadline,
                "acceptance_deadline": offer.acceptance_deadline,
                "maturity": offer.maturity, "exit_bps": offer.exit_bps,
                "exit_window": offer.exit_window, "state": offer.state,
                "held": offer.held, "accepted": offer.accepted,
                "accepted_at": offer.accepted_at, "ack_epoch": offer.ack_epoch,
                "exit_trigger_epoch": offer.exit_trigger_epoch,
                "exit_deadline": offer.exit_deadline,
                "allocated_publisher": offer.allocated_publisher,
                "allocated_participant": offer.allocated_participant,
                "closure": closure}

    @gl.public.view
    def get_program(self, program_id: u256) -> dict:
        program = self.programs.get(program_id)
        if program is None:
            return {}
        return {"id": program_id, "publisher": program.publisher,
                "epoch": program.epoch, "sha": program.sha,
                "document_digest": program.document_digest,
                "first_material_epoch": program.first_material_epoch,
                "first_material_at": program.first_material_at}

    @gl.public.view
    def get_material_event(self, program_id: u256, epoch: u64) -> dict:
        event = self.material_events.get(str(program_id) + ":" + str(epoch))
        if event is None:
            return {}
        return {"epoch": event.epoch, "at": event.at}

    @gl.public.view
    def get_offer_page(self, before_id: u256, limit: u64) -> dict:
        if limit < 1 or limit > 50:
            self._fail("Page size must be between 1 and 50")
        cursor = self.next_offer if before_id == 0 or before_id > self.next_offer else before_id
        items = []
        while cursor > 1 and len(items) < limit:
            cursor -= 1
            offer = self.offers.get(cursor)
            if offer is not None:
                items.append(self._offer_view(offer))
        return {"items": items, "next_cursor": cursor if cursor > 1 else u256(0)}

    @gl.public.view
    def get_wallet_offer_page(self, wallet: Address, before_id: u256,
                              limit: u64) -> dict:
        if limit < 1 or limit > 50:
            self._fail("Page size must be between 1 and 50")
        normalized = str(wallet).lower()
        count = int(self.wallet_offer_counts.get(normalized, u256(0)))
        if before_id == 0:
            cursor = count
        else:
            low, high = 0, count
            while low < high:
                middle = (low + high) // 2
                indexed_id = self.wallet_offer_ids.get(
                    normalized + ":" + str(middle + 1), u256(0))
                if indexed_id < before_id:
                    low = middle + 1
                else:
                    high = middle
            cursor = low
        items = []
        while cursor > 0 and len(items) < limit:
            offer_id = self.wallet_offer_ids.get(
                normalized + ":" + str(cursor), u256(0))
            cursor -= 1
            offer = self.offers.get(offer_id)
            if offer is not None:
                items.append(self._offer_view(offer))
        return {"items": items,
                "next_cursor": items[-1]["id"] if cursor > 0 and items else u256(0)}

    @gl.public.view
    def get_ledger(self) -> dict:
        liabilities = (self.total_held + self.total_claimable
                       + self.total_transfer_pending)
        native_balance = u256(self.balance)
        unassigned_surplus = (native_balance - liabilities
                              if native_balance > liabilities else u256(0))
        liability_shortfall = (liabilities - native_balance
                               if liabilities > native_balance else u256(0))
        reconciled = (self.total_held + self.total_claimable
                      + self.total_transfer_pending)
        return {"received": self.total_received, "held": self.total_held,
                "claimable": self.total_claimable,
                "transfer_pending": self.total_transfer_pending,
                "recipient_claimed_delivery": self._recipient_claimed_delivery_total(),
                "unreconciled": self.total_unreconciled,
                "native_balance": native_balance,
                "unassigned_surplus": unassigned_surplus,
                "liability_shortfall": liability_shortfall,
                "accounted_liabilities": liabilities,
                "reconciled_total": reconciled,
                "reconciliation_delta": self.total_received - reconciled}

    @gl.public.view
    def get_wallet_credit(self, wallet: Address) -> u256:
        return self.credits.get(str(wallet).lower(), u256(0))

    def _recipient_claimed_delivery_total(self) -> u256:
        total = u256(0)
        transfer_id = u256(1)
        while transfer_id < self.next_transfer:
            transfer = self.transfers.get(transfer_id)
            if transfer is not None and transfer.status == "RECIPIENT_ASSERTED_DELIVERED":
                total += transfer.amount
            transfer_id += u256(1)
        return total

    @gl.public.view
    def get_transfer(self, transfer_id: u256) -> dict:
        transfer = self.transfers.get(transfer_id)
        if transfer is None:
            return {}
        return {"recipient": transfer.recipient, "amount": transfer.amount,
                "status": transfer.status, "evidence": transfer.evidence,
                "created_at": transfer.created_at,
                "reconciled_at": transfer.reconciled_at}

    @gl.public.view
    def get_config(self) -> dict:
        return {"protocol": "revigate-vault-v1", "chain_id": CHAIN_ID,
                "contract_version": 1, "registry": str(self.registry).lower(),
                "custody_enabled": self.custody_enabled}
