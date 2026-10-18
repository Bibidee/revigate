# Implementation status

Recorded 2026-10-18 after PR #10 merged into `main` at
`44121ab5f07f4a9048f73268cdfda1daf14f6562`.

## Current architecture

`contracts/revigate.py` is the single Intelligent Contract. It retains signed
GitHub source authentication, GenLayer materiality consensus, participant
acknowledgments and the native GEN agreement ledger. The archived two-contract
Vault is historical reference material and is not the active deployment target.

The current V5 Studionet deployment is disposable and source-attested. Its
constructor is `custody_enabled=true`, `public_custody=false`: the contract's
controlled financial methods are enabled for an authorized test, while the
frontend's public financial controls remain locked. This distinction is not a
production custody approval and does not prevent unsolicited network transfers.

## Local verification

- JavaScript tests: 23 passing.
- Direct Mode: 47 passing, including the later-material-event regression.
- TypeScript, ESLint and production build: passing.
- Source uses the repository-local GenLayer CLI `0.39.1` only.
- The frontend keeps pending, unknown, failed and finalized transaction states
  distinct and never replays an external transfer automatically.

## Exact deployed source

- Network: GenLayer Studionet, chain 61999.
- Address: `0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684`.
- Deployment transaction: `0x710d4a88bdf535754daff67fbba4a394e4ddc9ef18d11e0acec666ec0072ed68`.
- Source SHA-256: `ED52C6BC82B9A4990DB2A0FC9C6D2C531C0CAEF76BD013124D18CBD0705C6A88`.
- Attestation: exact local source match.
- Constructor: `[true, false]` (`custody_enabled=true`, `public_custody=false`).

## Current hosted regression

The signed baseline was verified at epoch 1. The first signed MATERIAL review
was finalized as `MATERIAL` and advanced Program 1 to epoch 2. Offer 1 was then
funded with 555 wei and accepted by the controlled participant. After the real
first-event window expired, the second signed candidate finalized as `MATERIAL`
and advanced the program to epoch 3. The participant material exit finalized
with the later event's timestamp as its exit-window anchor.

Canonical final state is `MATERIAL_EXIT_ALLOCATED`: held 0, publisher credit
444, participant credit 111. The ledger reconciles deposited 555 with credits
555 and accounted 555; dispatched remains 0 and the contract native balance is
555. No withdrawal was submitted, so no child-transfer delivery is claimed.

## Release boundary

This is a disposable **Studionet test deployment**, not a production custody
release. Do not accept user funds. Unsupported incoming native-value recovery,
failed payable execution recovery, no-calldata and wrong-method value handling,
missing independently verifiable child-transfer identity/finality, and
unconfirmed recipient attribution remain protocol-level limitations. A normal
funded lifecycle would not clear those limitations. No independent external
security review or complete browser/mobile wallet-extension matrix is claimed.

The earlier public-enabled deployment and archived V4/Vault evidence remain
historical and must not be substituted for the current V5 address above.

GitHub Actions CI run 131 passed for PR #10 head
`af449658e4e051200d2d11e62a1abb40d3ba8fef`; the merged commit is
`44121ab5f07f4a9048f73268cdfda1daf14f6562`.
