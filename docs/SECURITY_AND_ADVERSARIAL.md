# Revigate V5 security and adversarial review

## Scope

This document is an adversarial self-audit. It is not an independent security review.

## Implemented controls

- Signed GitHub commit, branch membership, Git tree blobs and publisher-manifest nomination are authenticated before a program becomes VERIFIED.
- MATERIAL, NONMATERIAL and INCONCLUSIVE outcomes are distinct; only verified materiality changes advance the epoch.
- Offer terms bind the program epoch, source SHA and document digest.
- The supported payable route records every nonzero value as sender credit before ordinary validation and returns typed outcomes for unknown offer, wrong sender, duplicate, late and wrong amount.
- Allocations conserve held value exactly. Credits are consumed before dispatch. Transfers are immutable pending claims with no automatic replay.
- Recipient evidence is stored as an assertion and cannot restore credit or trigger a second transfer.
- Production custody remains constructor-locked.

## Hosted evidence

The disposable custody-enabled deployment `0xedfE5a6354a518Fbb46111cBa9D3216DA5869b99` matched source SHA `5F49DDBA7C88DA98B584F02F28075B1B1DA54305F0C68105344108522F4C833A`. It verified the signed baseline, executed a 1,000 wei funded acceptance, recorded a real MATERIAL epoch, allocated the 80/20 exit, refunded a 777 wei unaccepted offer, matured a 555 wei offer, and dispatched both wallet credits once. The exact parent hashes, child IDs, canonical readbacks and balance deltas are in the evidence JSON.

## Transfer finding

Each withdrawal parent finalized with successful execution and produced one child ID. Each child was readable as FINALIZED/NO_MAJORITY, with no execution-result field. Wallet B and A balance deltas were +755 and +2,577 respectively. The balances are useful evidence of observed credit, but they do not replace the missing child execution classification. The contract leaves both transfers in pending external settlement semantics; no replay is authorized.

## Protocol-level limitations

GenLayer's documented failed child-transfer behavior means a finalized parent or child is not, by itself, proof of recipient credit. Unsolicited no-calldata transfers and value sent to nonpayable methods are outside the supported payable route and remain unassigned hazards. The known historical probes are retained; no automatic retry or fabricated recovery mechanism is claimed.

## Open review gates

- Obtain a runtime-supported child execution/finality proof or keep public custody disabled.
- Complete the 52-scenario browser matrix.
- Obtain an independent security review.
- Obtain a second approved PR review.
- Run fresh CI for the final evidence commit.

Release verdict remains NOT RELEASED until these gates are closed.
