# Revigate risk register

This register covers the current one-contract Studionet test deployment. It is
not a production custody approval.

| Risk | Severity | Evidence and mitigation | Residual risk |
|---|---|---|---|
| Unsupported incoming value | Critical | The supported `fund_offer` route accounts value before validation and returns typed outcomes. Historical probes show that no-calldata, wrong-method and failed payable routes can retain value outside application accounting. | Runtime recovery is unproven. Do not treat unassigned value as user credit. |
| Outgoing child delivery | Critical | Each withdrawal debits credit once and records an immutable pending transfer. Both live demo recipient balances increased by the exact allocations. | The runtime did not expose a separately verifiable child identity/finality record. No replay is authorized. |
| Ledger backing | High | Live post-withdrawal readback: deposited 1,000,000,000,000; held 0; credits 0; dispatched 1,000,000,000,000; accounted 1,000,000,000,000; contract balance 0. | The accounting snapshot does not prove exceptional transfer recovery. |
| Source or publisher identity | High | Exact source SHA and signed baseline were attested on the deployed address; material candidate advanced the program to epoch 2. | A future source change requires a new attestation and lifecycle. |
| Materiality result | High | Hosted validators returned an actual `MATERIAL` result with five agreeing votes. | Disagreement, prompt-injection and inconclusive outcomes still require independent review coverage. |
| Replay or duplicate payout | High | Credit is consumed before dispatch and transfer records are immutable; frontend never retries automatically. | Full hosted/browser matrix remains incomplete. |
| Frontend misconfiguration | High | Frontend validates chain, protocol, version and custody flags before writes and targets the exact current address. | Production promotion of the final commit is still a release gate. |
| Review and governance | High | Local adversarial audit and automated checks are documented. | No independent security review or second PR approval is available yet. |

## Release posture

Keep this address and the public flag limited to disposable Studionet testing.
Do not accept user funds or call the live balance observations a custody
certification. The older V4/Vault records are historical and do not supersede
the current evidence.
