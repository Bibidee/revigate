# Revigate release checklist

## Current verdict

**DISPOSABLE STUDIONET TEST — CONTROLLED HOSTED FUNDED REGRESSION PASSED; NOT A PRODUCTION RELEASE.**

The current V5 source-attested contract is
`0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684` on chain 61999 with source
SHA-256 `ED52C6BC82B9A4990DB2A0FC9C6D2C531C0CAEF76BD013124D18CBD0705C6A88`.
Its constructor is `custody_enabled=true`, `public_custody=false`. The
frontend public financial controls remain locked and no user funds may be
accepted.

## Completed on the current V5 deployment

- [x] Signed baseline registration and verification completed at epoch 1.
- [x] Signed NONMATERIAL assessment finalized with the epoch unchanged.
- [x] First signed MATERIAL assessment finalized as `MATERIAL`, advancing the
      program to epoch 2.
- [x] Offer 1 funded with 555 wei and accepted by the designated participant at
      epoch 2; final state was `MATERIAL_EXIT_ALLOCATED`.
- [x] Second signed MATERIAL assessment finalized at epoch 3 after the real
      first-event exit window expired.
- [x] Participant material exit used the second event timestamp: event 2 at
      `1792311710`, exit deadline `1792315310`.
- [x] Final ledger reconciled deposited 555 = held 0 + credits 555 + dispatched
      0; publisher credit 444, participant credit 111, contract balance 555.
- [x] Machine-readable hosted evidence recorded in
      `evidence/single-contract/2026-10-18-v5-two-material-funded-regression.json`.
- [x] Source attestation matched the exact local contract source.
- [x] 23 JavaScript tests, 47 Direct Mode tests, typecheck, lint and build pass.
- [x] CI run 131 passed for PR #10 head; PR #10 merged into `main` at
      `44121ab5f07f4a9048f73268cdfda1daf14f6562`.

## Hosted regression status

The controlled two-material-revision regression is complete on the exact
source-attested Studionet deployment. It is test evidence only; it does not
clear the runtime custody limitations below.

## Evidence boundary that remains open

- [ ] Failed payable, unsolicited native-value, no-calldata and wrong-method
      recovery remain runtime-level limitations.
- [ ] Studionet does not expose independently verifiable child identity/finality
      for outgoing transfers; recipient deltas are observations only.
- [ ] Full browser/mobile and wallet-extension rejection/disconnect coverage.
- [ ] Independent external security review.

## Release gates

- [x] Current source-attested deployment recorded with `public_custody=false`.
- [x] Latest merged source identity and CI recorded.
- [ ] Documentation/evidence-only PR opened after hosted evidence is complete.
- [ ] Explicit owner approval before any production custody decision.
- [ ] Production custody certification. This checklist does not grant it.

The earlier public-enabled demo, V4 Registry and archived Vault deployments are
historical evidence only. Their addresses and results must not be substituted
for the current V5 deployment.
