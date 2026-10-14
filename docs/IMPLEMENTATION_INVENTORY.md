# Implementation inventory

## Current two-contract candidate

- Registry implementation: contracts/revigate_registry.py
- Vault implementation: contracts/revigate_vault.py
- Browser integration selects a Registry and its paired Vault, reads both configurations, and rejects an unpaired or wrong-chain configuration.
- Production and preview writes are fail-closed. Funding and withdrawals also require the Vault's on-chain custody flag, which is false on the current pair.
- Registry source includes publisher nomination and GitHub source verification, rulebook validation, acknowledgments, revision requests, independent materiality assessment, epoch and first-material-change history, reaffirmation, expiry, and Vault snapshot/material notifications.
- Vault source includes authenticated Registry message entry points, nonce and replay handling, offer registration, exact principal funding checks, participant acceptance and decline, cancellation and expiry, material exit, maturity allocation, mutual closure, wallet-specific credits, withdrawals, transfer records, and bounded read views.
- Accounting reports native balance, liabilities, surplus and shortfall separately. Unknown transfer delivery remains a liability. A recipient's delivery assertion is recorded as a claim and does not convert that claim into verified delivery or clear the liability.
- The original single-contract candidate and its historical probes remain in the repository as preserved history; the newly deployed pair is the current test candidate.

## Automated coverage

The current Direct Mode suite covers contract loading, Registry logic, source-verification fixtures, revision assessments, Registry/Vault authentication boundaries, duplicate and stale messages, Vault lifecycle transitions, accounting, and custody guards. The full suite has been run as part of the latest preflight; see Implementation Status for its exact totals.

Direct Mode and Python accounting tests are local simulations. They do not establish hosted GenLayer consensus, cross-contract child execution, real GitHub signature verification, wallet lifecycle behavior, or native balance recovery.

## Live evidence and boundaries

- A fresh custody-disabled Registry/Vault pair was deployed on Studionet chain 61999. Both deployed bytecodes now match the corresponding local source files exactly; hashes and reciprocal configurations are recorded in Studionet Evidence.
- The Registry stores the Vault address and the Vault stores the Registry address. The on-chain custody flag is false on both contracts. The pair's live ledgers read zero.
- A separate live negative call by an unrelated wallet to replace the Registry's bound Vault finalized as an execution error; it did not change the binding or attach value.
- The source attestation and reciprocal configuration do not prove that a Registry-to-Vault child message finalized or changed canonical Vault state. The attempted helper probe did not produce a successful live execution, so message delivery, duplicate effects, and delayed ordering remain unproven on hosted Studionet.
- No GEN was sent to the current pair. No two-wallet offer lifecycle was run.
- Earlier disposable-contract tests remain evidence of Studionet accepting value without a matching ledger entry after payable failure, direct transfer, and value attached to a nonpayable call. Separately, one prior 1-wei EOA withdrawal was observed at the recipient, while its contract record remained UNKNOWN_DELIVERY.

## Release decision

This is an implemented two-contract candidate, not a certified escrow release. Keep custody disabled and the public frontend unbound. See Implementation Status, Two-Contract Migration, Test Matrix, Risk Register, and Studionet Evidence for exact remaining requirements.
