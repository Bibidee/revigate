# Implementation status

Recorded 2026-10-15 after consolidating the active source and adding native GEN
offer accounting.

## Active architecture

Revigate now has one deployable Intelligent Contract: `contracts/revigate.py`.
It authenticates GitHub rulebooks, records acknowledgments, runs revision
materiality assessment, and manages native GEN offers, held balances, credits,
settlements and withdrawal records. `contracts/archive/revigate_registry_v2.py`
is historical only. No two-contract pairing or Vault messaging is part of the
active architecture.

`get_config()` reports protocol `revigate-registry-v1`, chain `61999`, version
`3`, custody `SINGLE_CONTRACT_ESCROW`, native escrow `NATIVE_GEN`, and external
message transfer evidence.

## Local verification

- JavaScript: **23 passing**.
- Direct Mode: **52 passing** against `contracts/revigate.py`.
- TypeScript: **passing**.
- ESLint: **passing**.
- The Direct Mode suite covers signed-source parsing, publisher and participant
  authorization, funding validation and refundable credits, acceptance,
  decline, expiry, material exit, maturity, mutual closure, single-use
  withdrawal accounting and bounded pages.

These are local or mocked checks. They do not prove hosted validator behavior,
protocol rollback or recipient delivery.

## Wallet identities for disposable tests

- Wallet A / publisher: `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`
- Wallet B / participant: `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54`
- Studionet: chain `61999`, RPC `https://studio.genlayer.com/api`

The old `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` address belongs only to
archived fixture evidence and is not a current wallet.

## Hosted and production state

A disposable single-contract deployment is source-attested on Studionet at `0xD86A6C0a3949D2452bB8964e076983254375b5fE`. Deployment transaction `0x29af681ee4ebb8bb03f52c2f36b4e1c686798e97dbcd0c0b1b2963e9ccf5d8b5` finalized with majority agreement and zero value. The deployed bytes exactly match source SHA-256 `BDF1D0B952719D8EDA16F1AC26A49C2F1B9CBB0465B7DAC972175A3015E904EF` from commit `cb84344`. Initial config and ledger reads are clean. This is disposable evidence, not a production binding. No production address
is approved, no user funds were accepted, and production writes remain locked.

The existing Vercel production site still serves the earlier noncustodial build. The escrow frontend has not been promoted because production custody is locked. This is an
environmental deployment task, not evidence of escrow readiness.

## Remaining gates

1. Use a genuinely GitHub-verified fixture that nominates the submitting publisher wallet. The existing Wallet A fixture is verified, but the unlocked CLI deployer is a different address; the hosted probe correctly returned `INCONCLUSIVE` and left Program 1 `PROPOSED` (`0xc347a08e…`, `0xdec8f4cf…`).
2. Run hosted signed baseline, NONMATERIAL, MATERIAL and ambiguous revision assessments with the correct Wallet A signer, preserving hashes and canonical reads.
3. Execute funded Wallet A/B scenarios only after the payable rollback and outbound delivery hypotheses have a testable, runtime-supported path.
4. Independently observe recipient balance deltas for withdrawals; do not treat parent or child finality alone as proof of credit.
5. Complete the 52-scenario browser and integration matrix, fresh CI and an independent security review.
6. Keep PR #1 draft and do not merge or promote custody without explicit approval after all critical gates pass.

## Release verdict

**NOT RELEASED.** The engineering consolidation and offline state-machine
coverage are complete for this stage. Hosted source attestation, funded
lifecycle evidence, failure recovery, recipient delivery and independent review
remain open. The implementation does not claim custody safety until those
runtime limitations are resolved and documented.

