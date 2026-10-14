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

## Latest source-exact pair on Studionet

Current branch head at deployment: `ba3ad9a83178bede7b27864d7d5c5cdded872694`.
Both deployed source files match the repository's current contract files.
The pair is reciprocal and custody-disabled.

| Contract | Address | Deployment transaction | Source SHA256 |
|---|---|---|---|
| Registry | `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE` | `0x857f02cc8a12c79a2a5cd23cb92e987151f0f80ce5cbf1d8868e961ec2d34c22` | `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F` |
| Vault | `0xf390D8D77f21710679a72Fc11b84A5e85a318849` | `0x9e68dc1b03b76388701f36d333aac730ce29de85097568d36f0f337416c3db20` | `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F` |

The bind finalized in `0x55ff1283efcba6c28c1ddb71a2ff2567fd9df75839c458fff3b9de172e34ef4d`.
Read-only address-schema verification confirmed constructor and method address
types, a successful address-encoded `get_wallet_credit` read, zero test-wallet
credit, and a zero Vault ledger. No GEN was sent to this pair.

## Current-source message proof and bounded payable probe

A separate fresh disposable Registry emitter
`0xB4c8ED40B96110F01ef25Ee44A9A06D0f0782D71` was paired to Vault
`0x96e4C4c77B3B1C5BA0eBcFb5fe0B55000dc153A0`, whose deployed source matches
the current Vault file. It proved one finalized authorized child, duplicate
no-op, stale-nonce rejection, different-contract spoof rejection and A0
unauthorized rebind rejection. Full parent/child IDs and state readbacks are in
[Studionet Evidence](STUDIONET_EVIDENCE.md).

The current Vault source was also deployed separately with custody enabled for
one unknown-offer 1-wei test. The ordinary rejection balanced caller credit and
native balance. One withdrawal child finalized and the signer balance rose by
1 wei, but the Vault still records `UNKNOWN_DELIVERY`, one pending liability
and a one-wei shortfall. No resend was attempted. This probe is not a paired
candidate, and it does not clear custody risk.

## Previous source-exact pair (superseded by the latest revision above)

Network is GenLayer Studionet, chain ID 61999, RPC https://studio.genlayer.com/api. Repository-local CLI 0.39.1 was used.

| Contract | Address | Deployment transaction | Source SHA256 |
|---|---|---|---|
| Registry | 0x4C55E4e0ab00C8534B6d4A826620cdb506349B45 | 0x73a64f695854b54eea242bb88921e768994bce875ce9adaf285c8ec2d14dc3ac | 6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F |
| Vault | 0xdCa7E9DF49e2773FaEFAD6B27B612BC296C74751 | 0xd573670ccc439863757fb9346e836c88809857608fe31260988cd8f1566e8545 | 53982AE6B5E0351F0987249947732EC1A186616DCDCF52ED6FA045997F7BF629 |

Both deployment receipts finalized with no attached value. Pairing transaction: `0xf14c1fce80975470197d2d9287667644412cb95facf641158a34d9d1be6e2894`. A read-only source attestation fetched the deployed code and matched each local file byte-for-byte. On-chain configuration reports chain ID 61999, protocol names `revigate-registry-v1` and `revigate-vault-v1`, reciprocal addresses, and `custody_enabled=false`. Both contracts have zero ledger liabilities and the pair has received no GEN.

## Address encoding correction

Address-bearing contract parameters now use GenLayer's `Address` type: the Registry/Vault snapshot publisher, offer participant, acknowledgment wallet, and wallet-offer-page wallet. Stored values are normalized with `str(address).lower()`. The frontend wraps address arguments with the GenLayerJS `CalldataAddress` encoder for `register_offer`, `get_acknowledgment`, and `get_wallet_offer_page`. Deployed schema checks and live address-encoded read calls passed for both deployed pairs.

## Earlier hosted authenticated-message proof

An isolated disposable proof pair tested cross-contract messaging. Registry probe `0x01170B19d49581Be9987C95937082b9ec06Ca046` (source hash `BB780BC816BE98DE0A7DA8363E6A2E6737EF595816BE1C8A3227C22657C543CC`) had one owner-gated test emitter added to the current Registry source. Vault `0x11C7e9FD387CE608e7dEDE87Bd44685e1021a66E` is byte-for-byte the source-exact Vault (hash `53982AE6B5E0351F0987249947732EC1A186616DCDCF52ED6FA045997F7BF629`). The pair was bound in transaction `0xfd42163092420265524d6b38258a393b0777a02a52bd7338f468277a48912688`, with custody disabled and no GEN attached.

The authorized snapshot parent `0xfd28fe8a7cc9ce707d86413d00c9e2ad8c2116197fd594b3cf85fce5260da385` emitted child `0x144194ce3ab7866106c6d56644f82dda4bda37d20c65a6c68bf312ebe2224310`; both finalized and child returned `true`. Vault state readback showed program 777, epoch 1, publisher `0x527da5f7022f14f7105e5f06cec1a8eff53556b5`, and the expected SHA/document digest. Repeating the same message ID and nonce produced finalized child `0x8a18f75603a94b90fa545bd47475df4a25514b7787da78296aa55ad2c0b199f3` returning `false`, with no duplicate mutation. A stale nonce emitted child `0x0ebe0cd6f534d1e801bc06e5a5eb45633b8f2909e967429471fcd44679c5dfc4`, which finalized with execution error `Registry nonce is stale or out of order`. A different contract spoof was rejected with `Only the paired Registry may send this message`, and program 888 remained absent. An unrelated wallet's attempt to rebind the probe Registry finalized with `Only the owner may bind the Vault once`; config did not change. Full transaction IDs and parent references are in [Studionet Evidence](STUDIONET_EVIDENCE.md).

The source-exact pair above has not itself emitted or processed the test message. Hosted message proof used a Registry test harness, so it proves the deployed Vault authentication/replay boundary and message serialization, not full source-exact Registry notification coverage. An initial numeric-only message ID was parsed by the CLI as an integer despite its string schema; that harness failure was corrected with a nonnumeric ID and is not treated as evidence of an address defect.

## Custody and lifecycle limitations

Both latest candidate pairs have custody disabled and have never received GEN. Do not send value to either. A separate isolated Vault with the current source and custody enabled was used for one 1-wei unknown-offer credit and one withdrawal; the recipient balance rose exactly 1 wei, but its record remains `UNKNOWN_DELIVERY` and the transfer liability stays pending. Other disposable Studionet probes retained value after a payable execution error, a no-calldata transfer, and a nonpayable method call without matching ledger liabilities. Failed-transfer recovery remains unproven.

No signed-source live program verification or Wallet A/B/C lifecycle has run. There is no valid offer funding, acceptance, revision, refund, material exit, maturity payout, or two-party recipient-balance proof for this pair. The isolated unknown-offer test is not escrow funding. GitHub source checks and real GenLayer semantic judgment have not been certified against a signed published commit.

## Release posture

Keep the production contract address unset and contract writes locked. The source-exact pair proves deployment, source integrity, and reciprocal pairing. The separate disposable proof pair proves authenticated child execution, duplicate no-op, stale-nonce and spoof rejection, and unauthorized-wallet rebind rejection. Neither clears custody failure or live economic lifecycle gates. The project remains NOT COMPLETE.
