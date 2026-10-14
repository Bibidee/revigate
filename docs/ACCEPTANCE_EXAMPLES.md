> **ARCHIVED:** This document describes the removed escrow candidate and is retained only as historical security evidence. See [current status](IMPLEMENTATION_STATUS.md).

# Worked Acceptance Cases for Contract, UI and Validators

These are exact expected *business effects*; use whole integer wei amounts in the implementation and no fabricated transaction hashes.

## Case 1 — Publisher-funded original guaranteed entitlement
- A registers authenticated program; source SHA S1, epoch 1.
- A creates 10 GEN named offer B, maturity M, material-exit basis points 2000, exit window 7 days; then separately funds.
- B accepts signed SHA S1/digest and the exact economic terms.
- When M is reached, even if GitHub is down and a semantic review failed, 10 GEN belongs to B, 0 to A. A unilateral cancellation must fail.

## Case 2 — Typo only
- A requests review from S1 to genuine descendant signed S2 where only heading typography changes.
- Validators return NONMATERIAL; active reviewed commit becomes S2, epoch remains 1; B's acknowledgment may still be current for rule epoch. B maturity claim still 10 GEN.

## Case 3 — Substantive rule revision
- S3 signed and reviewed changes qualifying term 14 to 60 days. Consensus MATERIAL. Epoch 2, old acknowledgment stale for new program decisions.
- B's accepted original offer remains entitled to full 10 GEN at maturity. Before maturity and within original 7-day exit window, B can *voluntarily* choose exit, getting 2 GEN while A receives 8 GEN. Exact allocation occurs once; no second maturity payout.
- A cannot invoke early exit, raise split to 100% A, or force B to reaffirm.

## Case 4 — Inconclusive/unavailable
- A submits S4 with invalid GitHub metadata/ambiguous evidence. Valid typed INCONCLUSIVE or failed protocol round. In either case, old active reviewed SHA and epoch stay. Pending review can expire after its deterministic deadline, without touching B's 10 GEN.

## Case 5 — Unaccepted offer
- A funds 10 GEN and B doesn't accept by deadline. Anyone expires. A alone gets the 10 GEN refund credit. B cannot receive it. A double-refund fails.

## Case 6 — Consent-driven closure
- A proposes A=3 GEN, B=7 GEN early closure of an *accepted* 10 GEN agreement, signs immutable digest and nonce. Without B approval this does nothing and must expire after one hour. If B approves unchanged digest before expiry, credit exact 3/7 once. If maturity occurs in the meantime, B's full 10 GEN claim takes precedence, never trapped by A's proposal.

## Case 7 — Funding failure and outgoing delivery
- A tries to fund 10 GEN twice, or C sends wrong amount/attempt. Actual onchain value must be reconciled; unexpected received GEN becomes source-attributed refundable credit if supported. Never assume rejected transaction refunded automatically.
- B withdraws allocated credit. Show parent success and pending external delivery separately; credit 'arrived' only if independently supported receipt/balance evidence exists. If unknown, block blind retry and disclose.
