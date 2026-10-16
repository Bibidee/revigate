# Revigate security and adversarial review

## Scope

This is an adversarial self-audit. It is not an independent security review.

## Implemented controls

- Signed GitHub source and nominated publisher are authenticated before a
  program becomes verified.
- MATERIAL, NONMATERIAL and INCONCLUSIVE outcomes are separate states.
- Offer terms bind the source SHA, document digest and program epoch.
- The supported payable route records value before ordinary validation and
  exposes typed refundable-credit outcomes.
- Allocations conserve held value; credits are consumed before dispatch; no
  automatic transfer replay is possible from observer results.
- Frontend action availability is derived from canonical offer state and wallet
  role, with pending and unknown transaction states kept distinct.

## Live evidence

The exact source-attested address is
`0xb875126Ab537327d9E7E87488C89668C071d2997`. The hosted demo registered and
verified the signed baseline, funded and accepted an offer, produced an actual
MATERIAL revision, reaffirmed the participant, allocated an 80/20 exit and
submitted both withdrawals. The ledger reconciled to zero held value and the
observed wallet deltas matched the allocations.

The evidence file records every transaction hash and readback:
[2026-10-16 public-enabled funded demo](../evidence/single-contract/2026-10-16-public-enabled-funded-demo.json).

## Unresolved protocol limits

GenLayer's failed child-transfer behavior means parent or child finality alone
does not prove recipient credit. The current endpoint exposes neither a
separately verifiable child identity nor a child finality record for these
transfers. No-calldata transfers, wrong-method value and failed payable
execution remain unsupported recovery paths. The live balance deltas are
observations only; they do not prove all exceptional paths safe.

## Open release gates

- Full browser and wallet-extension rejection/disconnect/mobile coverage.
- Independent security review.
- Second approved PR review and fresh CI for the final evidence commit.
- Final Vercel promotion and explicit owner approval before any production
  custody decision.

The verdict is a public-enabled Studionet test demo, not a production release.
