# Revigate release checklist

## Current verdict

**PUBLIC-ENABLED STUDIONET TEST DEMO — NOT A PRODUCTION RELEASE.**

The current one-contract source is deployed at
`0xb875126Ab537327d9E7E87488C89668C071d2997` on chain 61999 with exact source
attestation. The public flag was enabled only to exercise a disposable funded
demo. No user funds may be accepted.

## Completed

- [x] Registry authentication, signed publisher manifest and GenLayer materiality consensus retained.
- [x] Historical agreement mechanics integrated into the same contract.
- [x] Local CLI pinned to GenLayer `0.39.1`; typecheck, lint, 23 JavaScript tests, 46 Direct Mode tests and build pass.
- [x] Fresh source-attested Studionet deployment completed.
- [x] Baseline registration and verification completed at epoch 1.
- [x] Actual funded offer, acceptance, invalid-digest negative test and material revision completed.
- [x] Participant reaffirmation and MATERIAL exit allocation completed.
- [x] Both allocations were withdrawn once; ledger reconciled and observed recipient balance deltas matched.
- [x] Frontend uses human GEN/date inputs, canonical state gates, pending/finality handling and no automatic replay.

## Evidence boundary

- [ ] Child transaction identity and independent child finality are not exposed by the current Studionet read path. Transfer records remain `DISPATCHED_PENDING_EXTERNAL_SETTLEMENT`.
- [ ] Failed payable calls, unsolicited native transfers, no-calldata transfers and wrong-method value recovery remain runtime-level limitations.
- [ ] Recipient balance deltas are observations and do not certify every exceptional delivery path.
- [ ] Full 52-scenario hosted/browser coverage, mobile and wallet-extension rejection/disconnect checks were not run in this automation pass.
- [ ] Independent security review is not available; existing work is adversarial self-audit.

## Repository and deployment gates

- [x] Fresh CI run 117 passed for evidence commit `85e04095003a568c0460e5bdba0503b121a8f9ec`.
- [ ] Second approved PR review, if required by repository settings.
- [x] Vercel production promotion completed as `dpl_AswPntt31tSXGzDGzDNK8oLQhLMU`; root, `/agreements` and `/about` returned HTTP 200 and the bundle contains the current address.
- [ ] Explicit owner approval before any production custody decision.
- [ ] Merge to `main` only after the preceding review and CI gates pass.

The exact live hashes and canonical reads are in
[2026-10-16 public-enabled funded demo evidence](../evidence/single-contract/2026-10-16-public-enabled-funded-demo.json).
