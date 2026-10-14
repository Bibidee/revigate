# Registry/Vault migration status

Recorded 2026-10-14. The two-contract implementation and a custody-disabled live pair exist. This is not a custody certification.

## Responsibilities and implementation

| Responsibility | Registry | Vault |
|---|---|---|
| Program registration, publisher authority, GitHub source verification | Canonical | No |
| Rulebook validation, acknowledgments, revision assessment and epochs | Canonical | Frozen snapshot and first material trigger |
| Offer identity and immutable financial terms | No | Canonical |
| Funding, held principal, allocation and wallet credits | No | Canonical |
| Withdrawal records and delivery reconciliation | No | Canonical |

The Registry implements program registration and verification, publisher nomination, signed commit and exact source checks, rulebook parsing, acknowledgments, revisions, semantic MATERIAL/NONMATERIAL/INCONCLUSIVE assessment, epoch history, first-material-change preservation, reaffirmation, expiry, bounded reads, and Vault notifications.

The Vault implements authenticated snapshot and material-change receivers, monotonic nonce and duplicate-message checks, unique agreement identities, exact amount checks, acceptance, decline, cancellation, unaccepted-offer expiry, frozen participant entitlements, material exit, maturity allocation, mutual closure, wallet-specific credits, withdrawals, transfer records, and bounded views.

The Registry is deployed unpaired, the Vault is deployed with the Registry address, then the Registry owner binds the Vault once. The Vault checks the GenLayer message sender against its immutable Registry address. Message IDs commit to the protocol, chain, both deployments, message kind, nonce, program, epoch and source digest.

## Current final test pair on Studionet

Network is GenLayer Studionet, chain ID 61999, RPC https://studio.genlayer.com/api. Repository-local CLI 0.39.1 was used.

| Contract | Address | Deployment transaction | Source SHA256 |
|---|---|---|---|
| Registry | 0x4EECe12604bC7444e571999D9F92b951Fcc0F740 | 0xa70dae8864a58749081a3379be2cf031736d6d8580ac44756e71f679ad893558 | 5602F7DEDA868864900D0336E3D25509DDCA6564998E0181C997A2842A4255FA |
| Vault | 0xB2ce7E67d2A7766Bb62993aDd37636f0163fAAc5 | 0xf8fe9162f92506d643b25166183f52ae0a63b821c918d20485fa60d7b0f3792c | A6090229AF3F3140A83576C44FC2F13954411F89C617D9FE2283FF827D148EFD |

Both deployment receipts finalized with MAJORITY_AGREE and no attached value. A read-only source attestation fetched the deployed code and matched each local file byte-for-byte. On-chain configuration reports chain ID 61999, protocol names revigate-registry-v1 and revigate-vault-v1, reciprocal addresses, and custody_enabled=false. Both live ledgers read zero liabilities, zero native balance, zero surplus and zero shortfall.

The Registry's one-time bind finalized and the reciprocal config reads confirm the final pairing. The bind transaction hash was not captured in the local command output and is not asserted here. A separate unauthorized-wallet attempt to replace the Registry's Vault address finalized with MAJORITY_AGREE and execution ERROR; the live binding remained unchanged. Its transaction is 0xa97042009c493ab8d2a84018a7d2c8fb1c755865b4ff833cb956dd043f6eb5ef.

The final Vault constructor stores the Registry as a GenLayer Address, and the Registry bind path normalizes the CLI Address representation. Registry/Vault source attestation and config reads confirm that the defect is fixed for deployment and storage. They do not prove cross-contract message execution.

## Message proof still missing

No successful hosted proof is recorded for an authenticated Registry message reaching this Vault, a finalized child transaction, exactly-once canonical state mutation, duplicate delivery, or delayed/out-of-order handling. A live helper deployment used to probe sender impersonation finalized as execution ERROR with invalid_contract/absent_runner_comment and did not alter the final pair. Direct Mode checks cover the boundary in simulation only.

The bind transaction's child-message result must not be inferred from reciprocal configuration. Capture the parent and child transaction receipts in a supported live harness and read back canonical Vault state before claiming message synchronization.

## Custody and lifecycle limitations

The current pair has custody disabled and has never received GEN. Do not send value to it. The prior disposable probes remain release-blocking: Studionet retained value after a payable execution error, a no-calldata transfer, and a nonpayable method call without matching ledger liabilities. One earlier one-wei withdrawal reached a controlled EOA, but the contract record remained UNKNOWN_DELIVERY; failed-transfer recovery remains unproven.

No signed-source live program verification or Wallet A/B/C lifecycle has run. There is no live funding, acceptance, revision, refund, material exit, maturity payout, or recipient-balance proof for this pair. The GitHub source checks and real GenLayer semantic judgment have not been certified against a signed published commit.

## Release posture

Keep the production contract address unset and contract writes locked. The live pair proves deployment, source integrity, reciprocal pairing, and a negative unauthorized Registry bind attempt. It does not clear the custody failure, message-delivery, or lifecycle gates. The project remains NOT COMPLETE.
