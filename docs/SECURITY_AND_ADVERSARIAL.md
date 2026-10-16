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

The disposable custody-enabled deployment `0x377509f00e0731df34673501C9cfE57e2FAEA843` matched source SHA `A7859429ACAEAEA10C5E376E5A3B851920C0BC5DB9C2C0FAF72D7EE793C5C0C2`. It verified the signed baseline, executed a 1,000 wei funded acceptance, recorded a real MATERIAL epoch, allocated the 200/800 exit, refunded a 777 wei unaccepted offer, matured a 444 wei offer, and dispatched 3,776 wei across the publisher and participant credits. A separate 555 wei offer remains held until its longer maturity. The exact transaction hashes, canonical readbacks and balance deltas are in the evidence JSON.

## Transfer finding

The withdrawal parent hashes were submitted and canonical transfer records were created, but the RPC returned not-found/unavailable when those parent hashes were read back for child inspection. Wallet B and A balance deltas were +1,244 and +2,532 respectively. The balances are useful evidence of observed credit, but they do not replace the missing child execution classification. The contract leaves transfers in pending external settlement semantics; no replay is authorized.

## Protocol-level limitations

GenLayer's documented failed child-transfer behavior means a finalized parent or child is not, by itself, proof of recipient credit. Unsolicited no-calldata transfers and value sent to nonpayable methods are outside the supported payable route and remain unassigned hazards. The known historical probes are retained; no automatic retry or fabricated recovery mechanism is claimed.

## Open review gates

- Obtain a runtime-supported child execution/finality proof or keep public custody disabled.
- Complete the 52-scenario browser matrix.
- Obtain an independent security review.
- Obtain a second approved PR review.
- Run fresh CI for the final evidence commit.

Release verdict remains NOT RELEASED until these gates are closed.
