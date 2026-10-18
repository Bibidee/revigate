# Revigate security and adversarial review

## Scope

This is an adversarial self-audit. It is not an independent security review.

## Implemented controls

- Signed GitHub source and nominated publisher are authenticated before a
  program becomes verified.
- MATERIAL, NONMATERIAL and INCONCLUSIVE outcomes are kept distinct.
- Offer terms bind the source SHA, document digest and program epoch.
- The supported payable route records value before ordinary validation and
  returns typed refundable-credit outcomes for supported invalid paths.
- Allocations conserve held value; credits are consumed before dispatch; no
  automatic transfer replay is possible from observer results.
- Frontend action availability is derived from canonical offer state and wallet
  role, with pending and unknown transaction states kept distinct.

## Current live evidence

The current exact source-attested deployment is
`0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684` on Studionet 61999 with source
SHA-256 `ED52C6BC82B9A4990DB2A0FC9C6D2C531C0CAEF76BD013124D18CBD0705C6A88`.
Its configuration is `custody_enabled=true`, `public_custody=false`. The
signed baseline, NONMATERIAL review, first MATERIAL review, 555 wei Offer 1
funding/acceptance, second MATERIAL review and participant material exit have
all finalized. The later event timestamp was used for the exit deadline and
the ledger reconciled exactly. No withdrawal was submitted and no production
funds were accepted.

The earlier public-enabled funded demonstration remains historical evidence:
[2026-10-16 public-enabled funded demo](../evidence/single-contract/2026-10-16-public-enabled-funded-demo.json).
It is not evidence that the current deployment or exceptional transfer paths
are production safe.

## Unresolved protocol limits

GenLayer's failed child-transfer behavior means parent or child finality alone
does not prove recipient credit. The current endpoint does not expose a
separately verifiable child identity and finality record for these transfers.
Unsolicited native value, no-calldata transfers, wrong-method value and failed
payable execution remain unsupported recovery paths. Recipient balance deltas
are observations only and cannot certify every exceptional path.

## Open release gates

- Full browser and wallet-extension rejection/disconnect/mobile coverage.
- Independent security review.
- Documentation/evidence-only PR with fresh checks after hosted evidence.
- Explicit owner approval before any production custody decision.

The current verdict is **NOT READY FOR PRODUCTION CUSTODY**.
