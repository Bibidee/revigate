# Revigate product specification

## Product

Revigate is one source-attested Intelligent Contract for authenticated rulebooks and bounded financial agreements. A publisher nominates its wallet in a manifest committed alongside a Markdown rulebook. The Registry verifies signed GitHub source and records the exact digest. GenLayer validators assess later revisions as `MATERIAL`, `NONMATERIAL` or `INCONCLUSIVE`. A participant can acknowledge an epoch and, when a custody-enabled deployment is explicitly authorized, enter a frozen native GEN offer with deterministic settlement rules.

## Agreement ledger

The single contract stores offers, held value, publisher and participant credits, material-exit allocations, maturity allocations, refunds and pending external transfers. A material exit uses the offer's frozen basis points and conserves the full held amount. Maturity pays the participant deterministically. Unaccepted offers can be cancelled or expired. Credit withdrawal is single-use and remains `DISPATCHED_PENDING_EXTERNAL_SETTLEMENT` until independently checked.

## Safety gate

The production deployment is not custody-enabled. A custody-enabled disposable Studionet instance is used for hosted evidence only. Every nonzero value route must be tested separately from unsolicited transfers and failed external delivery. A child transaction reaching finality is not recipient balance proof. No public custody promotion is allowed until funded settlement and exceptional transfer paths are independently reviewed.

## Outcomes

- `MATERIAL`: authenticated source advances the epoch and may open a frozen material-exit window.
- `NONMATERIAL`: authenticated source changes without advancing the epoch.
- `INCONCLUSIVE`: source or semantic evidence is unresolved; active source remains unchanged.
