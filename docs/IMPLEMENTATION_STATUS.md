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

The unlocked CLI deployer `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` was
used only for the disposable deployment and probes. It is neither Wallet A
nor Wallet B, and it is not a user wallet for the application.

## Hosted and production state

A disposable single-contract deployment is source-attested on Studionet at `0xD86A6C0a3949D2452bB8964e076983254375b5fE`. Deployment transaction `0x29af681ee4ebb8bb03f52c2f36b4e1c686798e97dbcd0c0b1b2963e9ccf5d8b5` finalized with majority agreement and zero value. The deployed bytes exactly match source SHA-256 `BDF1D0B952719D8EDA16F1AC26A49C2F1B9CBB0465B7DAC972175A3015E904EF` from commit `cb84344`. Initial config and ledger reads are clean. This is disposable evidence, not a production binding. No production address
is approved, no user funds were accepted, and production writes remain locked.

Vercel Authentication was disabled for the `the-revigate` project on
2026-10-15 through the authenticated project settings UI. Both the production
alias and the corrected preview now open publicly without the Vercel login
page. The production alias still serves the earlier noncustodial build; the
corrected single-contract frontend remains a preview and has not been promoted.
This changes deployment visibility only and is not evidence of escrow readiness.

A fresh Brave/Rabby check against that currently promoted build passed the
in-app disconnect and reconnect controls for the observed account without
submitting a transaction. This verifies only app-session UX; it does not verify
the disposable escrow frontend, wallet rejection, network/account switching,
or a funded lifecycle.

The corrected public preview was then exercised with Wallet A against the
single-contract deployment. Program 3 registered the GitHub-verified baseline
at `rules/revigate-v2.md`, verified it, and completed genuine NONMATERIAL,
MATERIAL and ambiguous reviews. The actual outcomes were NONMATERIAL, MATERIAL
and MATERIAL. Canonical state is VERIFIED at epoch 3 with active SHA
`d35d438d0e45e58e3227f95135fa3a2abc523aed`, two material events and no pending
review. The NONMATERIAL round included one genuine validator DISAGREE vote.
Exact hashes are in
`evidence/single-contract/2026-10-15-wallet-a-program-3-lifecycle.json`.

## Remaining gates

1. Signed Wallet A baseline, NONMATERIAL, MATERIAL and ambiguous source tests are complete on the single-contract deployment.
2. Funded Wallet A/B scenarios remain blocked by the reproduced Studionet behavior where an execution error rolls back accounting while retaining attached value. Wrong-method and no-calldata value also remain unassigned. There is no runtime-supported recovery path in this contract.
3. Independently observe recipient balance deltas for any future withdrawal; do not treat parent or child finality alone as proof of credit and never replay an UNKNOWN_DELIVERY transfer.
4. Complete the remaining real extension rejection, account/network switch and mobile browser checks, then refresh the evidence matrix.
5. Obtain an independent security review and the required second PR approval.
6. Keep custody writes locked. GitHub `main` protection requires `verify`, `Vercel`, one approving review, last-push approval and conversation resolution.

## Release verdict

**NOT RELEASED.** The engineering consolidation and offline state-machine
coverage and the hosted signed source lifecycle are complete for this stage.
Funded lifecycle evidence, failure recovery, recipient delivery, remaining
browser coverage and independent review remain open. The reproduced rollback
behavior is a critical Studionet custody blocker; the implementation does not
claim custody safety.

