# REVIGATE V1 PRODUCT SPECIFICATION

## Problem
Program publishers routinely update public rules for eligibility, timing, entitlement, appeals and duties. A participant may have accepted and relied upon an earlier rulebook. A publisher-controlled site can display the newest terms but cannot be a neutral authority on whether earlier acknowledgment still covers *materially changed* obligations. When GEN is promised or deposited, unauthorized rule changes must not rewrite the beneficiary's financial position.

## Product promise
**Version the rules; protect the commitment.** Bind wallet acknowledgment and GEN escrow to an authenticated historical rulebook version. Allow later program revision while independent GenLayer judgment decides material vs nonmaterial, causing a new acknowledgment epoch when material. The existing signed cash entitlement remains enforceable on its immutable original terms.

## Distinct users
- Publisher A: wallet that registers a program and is authorized to register a subsequent publication review. May create and fund offers for designated participants. Does **not** control the semantic judgment.
- Participant B: designated wallet who reads, accepts, acknowledges, reaffirms new rules, chooses a pre-negotiated early exit or claims an unconditional matured entitlement. Does **not** control publisher source or verdict.
- Any reader: inspect verified versions, materiality conclusions, historical acknowledgments, escrow eligibility and anonymized program statistics.
- Independent GenLayer validators: fetch exact source versions, verify admissible evidence and judge material change. **Never** choose wallet recipient or amount.

## Core journeys
1. Publisher publishes a bounded numbered English Markdown rulebook and a wallet nomination manifest in one public GitHub repo; signed/verified commit references are required.
2. A submits program proposal with canonical repo, fixed rulebook path, manifest path, publication branch and full 40-character baseline SHA. No money moves.
3. Any wallet invokes GenLayer verifier. Only when source provenance, manifest match and document shape succeed is program `VERIFIED` with canonical baseline digest and epoch 1.
4. A creates one named participant offer against the latest verified epoch: exact amount, future claim maturity, funding/acceptance deadlines, frozen optional early exit split/window, immutable accepted-terms digest.
5. A funds exact offer amount, as a separate payable transaction. B reads full terms and expressly accepts with its wallet. A can cancel/refund ONLY while not accepted.
6. A submits candidate full Git commit SHA for rulebook revision; deterministic request recorded before nondeterministic evaluation. The app must not treat an off-chain GitHub branch move as an on-chain revision.
7. GenLayer validators independently verify immutable source evidence and compare the original/updated numbered clauses for rights/obligation changes. A material verdict increments epoch; nonmaterial retains epoch; an inconclusive verdict leaves prior version authoritative. Pending requests time out deterministically.
8. B can acknowledge the new epoch. Independently, B's already accepted GEN entitlement remains intact. If a material update triggers a pre-agreed early-exit option, B may choose it before its locked deadline. Otherwise B retains the original full maturity claim.
9. On expiry without B acceptance, allocate original deposit back to A; after acceptance, A cannot unilaterally reclaim. On maturity, allocate full protected amount to B. Payout is separately claimed and tracked through its real network finalization/delivery steps.
10. Views, transaction history, economic balances and latest reviewed rule version recover from chain after reload. Browser storage is nonauthoritative convenience only.

## Materiality judgment
- `MATERIAL`: changes a participant's substantive eligibility, economic benefits, deadline, duties, exclusions, remedies, termination/appeal rights, proof burden or relevant enforcement conditions.
- `NONMATERIAL`: editorial fixes, formatting, headings, spelling or clarifications which do not change a substantive condition.
- `INCONCLUSIVE`: ambiguous text, unavailable/inconsistent proof, unparseable or unbounded document, signer/repository problem, disputed semantic interpretation or insufficient evidence. A source verification failure must never be treated as a safe nonmaterial revision.
A later version is not effective on-chain until a **successful finalized** revision-review call with canonical state readback. Program public display must say 'latest reviewed revision', not 'current upstream GitHub'.

## What escrow buys
It does **not** pay a worker if an AI model thinks a task is done (Accordant). It is **not** a bond for the issuer's own promise (Vowmark). It protects B's known amount under rules effective at B's consent. A revision may activate options frozen into the original escrow terms but cannot retroactively reduce the original guaranteed maturity amount.

## Legal/real-world limits
A wallet acknowledgment proves a signed on-chain act. It is not necessarily legal identity, consent under every law, employment status, enforceable offline contract or proof the person read every line. Versioned GitHub content establishes what a provider published at a commit, not that statements within the document are true. No off-chain rights automatically follow without a separate institution recognizing them.

## V1 out of scope
No automated GitHub monitoring, always-on background polling, participant-initiated unauthenticated revisions, full legal analysis, multi-asset support, ERC-20 support, other chains, subscriptions, milestone scoring, arbitration, penalty/slashing, token issuance, interest, private evidence or real-world bank transfer.
