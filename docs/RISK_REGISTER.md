# Revigate risk register

This register describes the active single-contract candidate on branch
`feat/revigate-funded-registry`. Historical Registry/Vault probes remain linked
as evidence, but they are not the current application architecture.

| Risk | Severity | Current evidence and mitigation | Residual release risk |
|---|---|---|---|
| Incoming value can arrive through an unsupported route | Critical | The supported `fund_offer` route credits the sender before ordinary validation and returns typed outcomes for unknown, wrong-funder, duplicate, expired and wrong-amount cases. Historical Studionet probes still show that a payable runtime error, no-calldata transfer and value attached to a nonpayable method can retain native value while rolling back or bypassing accounting. | Runtime-supported recovery for unsolicited or failed-entry value is unproven. Keep public custody disabled and do not call unassigned value user credit. |
| Outgoing child delivery is not objectively classifiable | Critical | The contract debits credits once, records a canonical transfer and never authorizes replay. The frontend validates the parent-listed child identity, sender, recipient, value and finality. The current Studionet endpoint returned no execution result and `gen_getTransactionReceipt` returned `Method not found`; recipient deltas are separate observations. | Child execution success, non-delivery recovery and independent recipient attribution remain open. No automatic retry is permitted. |
| Ledger backing is misstated after a payout | High | The single-contract ledger separates held/claimable backing from emitted pending transfers. Exact-source hosted readback reconciled deposited 4,331, held 555, credits 0, dispatched 3,776 and native balance 555. Offer 3's later maturity allocation was accepted by five validators, but post-state readback is pending RPC recovery. | Do not infer the post-claim ledger until canonical state is read back; public custody is not enabled. |
| Registry source or publisher identity is false or stale | High | Exact GitHub-signed baseline verification succeeded at epoch 1 and the MATERIAL candidate advanced epoch 2 on the exact source-attested deployment. The contract binds source, manifest and nominated publisher. | A fresh signed NONMATERIAL/ambiguous lifecycle on this funded candidate and independent review remain release gates. |
| Materiality result is unsafe or disputed | High | GenLayer consensus produced an actual MATERIAL result for the hosted candidate. Direct Mode covers MATERIAL, NONMATERIAL and INCONCLUSIVE transitions. | Prompt-injection/disagreement coverage and independent security review remain open; never manufacture a validator outcome. |
| Offer state or payout can be replayed | High | Direct Mode covers one-time funding, acceptance, refund, material allocation, maturity allocation, credit consumption and duplicate withdrawal rejection. Hosted duplicate withdrawal finalized with execution error and did not dispatch a second credit. | Full hosted multi-wallet/browser matrix and long-maturity closeout remain open. |
| Frontend can point to an unapproved contract | High | Frontend configuration checks chain 61999, protocol `revigate-registry-v1`, version 5, custody flags and source attestation before writes. Production deployment `dpl_D3raXV8ajYNZxk3TgfYWxvAForQ3` contains the candidate address and remains write-locked. | Public custody still requires maturity, transfer-delivery and independent-review gates. |
| GitHub release controls are incomplete | High | Current branch is pushed to PR #4; a fresh CI run is required after this focused frontend/docs pass. Main protection requires the repository's configured status checks and conversation resolution. | Merge remains pending the final CI result and any repository protection rule that still requires a second review. |
| Dependency or source drift invalidates evidence | Medium | Local CLI is pinned to 0.39.1; `npm ci`, typecheck, lint, 23 JS tests, 46 Direct Mode tests and production build pass. Source attestation hashes the exact deployed `contracts/revigate.py`. | A later source or frontend change requires a new attestation, CI run and review; do not reuse this candidate evidence for another source. |

## Release posture

Keep `public_custody=false`, keep production contract writes locked, and do not
accept user funds. The implementation and disposable funded evidence are real,
but the protocol-level exceptional transfer paths, full hosted/browser coverage,
independent review and merge gates are still unresolved.
