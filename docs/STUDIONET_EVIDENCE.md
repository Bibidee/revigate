# Studionet Candidate Evidence

Recorded 2026-10-14. This is testnet evidence, not a production custody certification.

## Latest source revision and live proofs (commit `ba3ad9a83178bede7b27864d7d5c5cdded872694`)

Repository-local GenLayer CLI `0.39.1` was used on Studionet `61999`. The latest
source-exact pair is:

| Contract | Address | Deployment transaction | Source SHA256 | Receipt |
|---|---|---|---|---|
| Registry | `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE` | `0x857f02cc8a12c79a2a5cd23cb92e987151f0f80ce5cbf1d8868e961ec2d34c22` | `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F` | FINALIZED |
| Vault | `0xf390D8D77f21710679a72Fc11b84A5e85a318849` | `0x9e68dc1b03b76388701f36d333aac730ce29de85097568d36f0f337416c3db20` | `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F` | FINALIZED |

The one-time Registry bind finalized in `0x55ff1283efcba6c28c1ddb71a2ff2567fd9df75839c458fff3b9de172e34ef4d`.
Read-only attestation at deployment confirmed both deployed files matched the
then-current source byte-for-byte, the configs were reciprocal on chain 61999,
`custody_enabled=false` on both, address-typed reads succeeded, and the Vault
ledger and test-wallet credit were zero. The local Registry is unchanged, but
the local Vault now contains a ledger-accounting correction; its current SHA256
is `C7DF6C4F18D276CFB0D52BA863CA960FC0982163BEAE4E2FCCF91F24866A6F55`. That
source has not been deployed, so the deployed Vault remains at
`0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F`. This pair
received no GEN and is not a custody-enabled release.

The payable-credit change was exercised separately on an isolated disposable
Vault, not on the pair above. Its deployment `0x4652514810edc24346f8239fe847f36a47a27ef0e786508c1aafab22b9148948`
finalized at `0xfDA04A975d1467580C6c16eb8cCD576fec4076Af`; deployed code matched
the **pre-accounting-patch** Vault source hash
`0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F`, not the
current local candidate hash `C7DF6C4F18D276CFB0D52BA863CA960FC0982163BEAE4E2FCCF91F24866A6F55`.
It was configured with custody enabled only for this one-wei test and was not
paired or production-bound.

| Test | Transaction evidence | Finalized state |
|---|---|---|
| `fund_offer(999999)` with exactly 1 wei | `0x4e95c0fddd092d47dafae10243c9362d0a9058a4b2f645e7dba7bd55bcdf316a` | FINALIZED, execution SUCCESS, `value_credited=true`; Vault balance 1, received 1, claimable 1, caller credit 1, held 0, surplus/shortfall 0. |
| One `withdraw_credit(1)` | Parent `0xc27924f097aa08924a3275c59ca1c69b1cb4ceb92c45bd61fc2e0ed0c9b4a949`; child `0xa3a3c2c5384c52314ef2b56b78c70b782e3bb556cef9702a0784962b8905fbee` | Parent and child FINALIZED. The signer balance increased exactly 1 wei (`297999999999999999996` → `297999999999999999997`). Vault record remains `UNKNOWN_DELIVERY`, with transfer_pending 1, native balance 0, and liability_shortfall 1. No retry or second withdrawal was submitted. |

The `liability_shortfall=1` in this historical read was **not missing GEN**.
At that point, `held=0` and `claimable=0`; the full 1 wei had already been
emitted in a finalized child, and the recipient's balance increased by 1 wei.
The old formula incorrectly compared the empty Vault balance against
`held + claimable + transfer_pending`. The local candidate now compares the
Vault balance only with `held + claimable` and reports the emitted transfer as
an unresolved, separately tracked obligation. This accounting fix has not
been deployed; it does not alter the historical transaction or its
`UNKNOWN_DELIVERY` record.

On the pre-accounting-patch source, one ordinary invalid-offer payable route
created a matching refundable credit, and one emitted EOA transfer delivered
exactly one wei. It
does not prove rollback recovery, direct-transfer handling, nonpayable-value
handling, failed-transfer recovery, or objective contract-side delivery
reconciliation. The live payout intentionally remains an unresolved liability
because `UNKNOWN_DELIVERY` cannot be cleared from an independent receipt.

A fresh message-proof pair used a disposable Registry emitter and the
pre-accounting-patch Vault source (the same Vault source version used by the
deployed custody-disabled candidate pair):

| Contract | Address | Deployment transaction | Source SHA256 |
|---|---|---|---|
| Probe Registry | `0xB4c8ED40B96110F01ef25Ee44A9A06D0f0782D71` | `0xce789796728c5cfae7cbb73bc02058e735f4e26842e75e3f3f46f692fd6eac0d` | `BB780BC816BE98DE0A7DA8363E6A2E6737EF595816BE1C8A3227C22657C543CC` |
| Pre-accounting-patch Vault | `0x96e4C4c77B3B1C5BA0eBcFb5fe0B55000dc153A0` | `0xcf7348bb6559a32eb0e69190a9b960cfd15b7324c221d26019c7de45992f810a` | `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F` |

Both deployed sources were independently fetched and matched their local files.
The pair bind finalized in `0x997e56c422035f4f1f6d564346b097725ba080b8463d55887608665063fe2061`;
both configs report reciprocal addresses and custody disabled.

| Case | Parent | Child | Result |
|---|---|---|---|
| Authorized snapshot, message ID `c…c` and nonce 1 | `0x623180a95bbc76e0c985f4913c165617cda34bb9ed96a6ad6b383e151ce1aad6` | `0x1d5fb43bf224f180f6ce80066603771a4d5b3c9c750fc77ab993280c4fc0163e` | Both FINALIZED. Vault stored program 777, epoch 1, publisher `0x527da5f7022f14f7105e5f06cec1a8eff53556b5`, SHA `a…a`, digest `b…b`. No value was attached. |
| Duplicate message ID and nonce | `0x636a84b66c0f0f7ad99e9027a6a2507e8bc964bcb7b27fa7facc82a3a94a5044` | `0x6b28de41c16b781e7d432a14fac421def3d7e294df4b8906e2c5e864fa2be249` | Both FINALIZED; child execution SUCCESS returned `false`; before/after canonical snapshot is identical. |
| Stale nonce 1 with a new message ID | `0xcb20dd440a1382693ece715ef77d815784d8b88daef43afd8a8b54e49521f475` | `0xcf2c058788c5bf613c8a43368913866be8160e35b5a573da385556b9aa704b7c` | Both FINALIZED; child execution ERROR, `Registry nonce is stale or out of order`; program 777 remained unchanged. |
| Different contract impersonation | `0xbe5febd4615a8f54079850efb79ab8b50574bd784a6a9758d1d8b257532f0441` | `0xfbc5db059a6b42d0369da2bdd3cb43547e5fbcf567a8d498ed4b07b1c49687ce` | Both FINALIZED; child execution ERROR, `Only the paired Registry may send this message`; program 888 remained absent. The spoof emitter source SHA is `447637DAF7EED97DFCBABA90CA936DEB7C6EF9F8A00658C746421265EC3EFB2B`. |
| Unrelated-wallet rebind attempt (A0) | `0xeb76289545c4c716a56c24fd10569df7e7b61b0ae07e4f29e7fce54565a8127f` | — | FINALIZED with execution ERROR; Registry config was unchanged. |

The exact-source Registry still has not emitted a real notification from a
verified, signed publisher program. This harness proves the current Vault
message boundary, serialization, replay behavior, and rejected identities;
it is not a substitute for source verification or a financial lifecycle.
The exact probe sources are retained in
[`evidence/live-message-proof/`](../evidence/live-message-proof/) and are
reproducible with `scripts/prepare-live-message-probe.mjs`. Their SHA256 values
match the deployed probe Registry (`BB780BC816BE98DE0A7DA8363E6A2E6737EF595816BE1C8A3227C22657C543CC`)
and spoof contract (`447637DAF7EED97DFCBABA90CA936DEB7C6EF9F8A00658C746421265EC3EFB2B`).

## Historical deployment snapshot (superseded source revision)

- Repository-local GenLayer CLI: `0.39.1`; GenLayerJS: `1.1.8`.
- Network: GenLayer Studio / Studionet, chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- Active unlocked test signer: `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`.
- Local Git HEAD for that earlier deployment: `0c4de92062c2866612d8269078bc9ddd66fe0bd6`; branch `codex/revigate-remediation-2026-10-14`; its deployed source changes were uncommitted at deployment. This is not the source revision of the latest pair documented above.
- Contract source SHA256 immediately before deployment: `23D7BDE7F55990080B7C4AB761A3C19EFF8912AD44114B64D080604CDA6E0C58`.
- The CLI's account view reported 298 GEN before deployment. No private key or wallet secret is recorded here.

## Earlier source-exact pair (superseded by the latest revision above)

| Item | Registry | Vault |
|---|---|---|
| Address | 0x4C55E4e0ab00C8534B6d4A826620cdb506349B45 | 0xdCa7E9DF49e2773FaEFAD6B27B612BC296C74751 |
| Deployment transaction | 0x73a64f695854b54eea242bb88921e768994bce875ce9adaf285c8ec2d14dc3ac | 0xd573670ccc439863757fb9346e836c88809857608fe31260988cd8f1566e8545 |
| Receipt | FINALIZED | FINALIZED |
| Attached value | 0 | 0 |
| Local source SHA256 | 6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F | 53982AE6B5E0351F0987249947732EC1A186616DCDCF52ED6FA045997F7BF629 |
| Deployed bytes match local source | Yes | Yes |

Pairing transaction: `0xf14c1fce80975470197d2d9287667644412cb95facf641158a34d9d1be6e2894`. The read-only attestation script `scripts/attest-studionet-source.mjs` fetched each contract's deployed code, hashed it, compared exact UTF-8 bytes with local source, read both configs, and verified chain 61999, reciprocal addresses, and `custody_enabled=false`. The address-encoding verifier also checked the hosted schemas and performed address-typed read calls successfully. Both contracts have zero ledger liabilities and the pair has received no GEN.

- Registry config: chain 61999, protocol `revigate-registry-v1`, Vault `0xdca7e9df49e2773faefad6b27b612bc296c74751`, custody disabled.
- Vault config: chain 61999, protocol `revigate-vault-v1`, Registry `0x4c55e4e0ab00c8534b6d4a826620cdb506349b45`, custody disabled.

At the time of deployment, this fresh pair was the only pair in the report with both contracts byte-for-byte equal to the then-current local contract files. It is custody-disabled and has no financial lifecycle state. The Vault differs from the current local file after the later accounting correction. The pairing/configuration transaction does not count as proof of Registry notification child execution.

## Earlier hosted message pair (historical; its Vault source predates the latest revision above)

To exercise an emitting method without adding test code to the release pair, a disposable Registry probe was deployed with one owner-gated test emitter added to the then-current Registry source. Its paired Vault was byte-for-byte the Vault source before the later accounting correction. Both deployments and the Registry-to-Vault instructions used zero attached value; both contracts had custody disabled.

| Item | Registry probe | Paired Vault |
|---|---|---|
| Address | 0x01170B19d49581Be9987C95937082b9ec06Ca046 | 0x11C7e9FD387CE608e7dEDE87Bd44685e1021a66E |
| Deployment transaction | 0xee85895e2e2e2d935239be032f896a3f371eedafab50bf120d1d81b941503888 | 0x1daedb049e047c21c7458a51acb590c6caeaabcb0e809f00e2c9c5decc671079 |
| Source SHA256 | BB780BC816BE98DE0A7DA8363E6A2E6737EF595816BE1C8A3227C22657C543CC | 53982AE6B5E0351F0987249947732EC1A186616DCDCF52ED6FA045997F7BF629 |

The probe pair bind transaction was `0xfd42163092420265524d6b38258a393b0777a02a52bd7338f468277a48912688`. On-chain config returned the reciprocal addresses and custody disabled. An unrelated unlocked wallet attempted to replace the Registry's Vault address in transaction `0xa63ccb9b749d41f077697634b9539d6f6bb43b5abd2d154cc257cfc4dd5e498f`; it finalized with execution ERROR (`Only the owner may bind the Vault once`), and subsequent config remained unchanged.

The actual live snapshot/message results were:

| Case | Parent | Child | Result and canonical readback |
|---|---|---|---|
| Authorized Registry snapshot | `0xfd28fe8a7cc9ce707d86413d00c9e2ad8c2116197fd594b3cf85fce5260da385` | `0x144194ce3ab7866106c6d56644f82dda4bda37d20c65a6c68bf312ebe2224310` | Both FINALIZED; child returned `true`; Vault stored program 777, epoch 1, publisher `0x527da5f7022f14f7105e5f06cec1a8eff53556b5`, SHA `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, document digest `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`. Zero value attached. |
| Duplicate same message ID/nonce | `0xd4f0f78a95e996be0a2dda1be37985b43a9edda8dabf936ff4575ccc9b5930cb` | `0x8a18f75603a94b90fa545bd47475df4a25514b7787da78296aa55ad2c0b199f3` | Both FINALIZED; child returned `false`; stored program snapshot remained unchanged. |
| Stale/out-of-order nonce | `0xfe15f4a9a6577d9b4afdc7616f2ee1a4826ec83cd8a117c1c8370fbd2adc0243` | `0x0ebe0cd6f534d1e801bc06e5a5eb45633b8f2909e967429471fcd44679c5dfc4` | Parent FINALIZED; child FINALIZED with execution ERROR `Registry nonce is stale or out of order`; no value attached. |
| Different contract impersonation | `0xb45612dd0139f31326195c25314192c9a795133eb311e615108f2bd6500361d6` | `0xb426bda84e67e114cf5081b0f579a8b6210d6c7fee883d129f56cf74c00e9bfc` | Spoof contract `0x9F010AE46E332ca19e86ebe57522Ce468Dfbe17d`, source SHA `447637DAF7EED97DFCBABA90CA936DEB7C6EF9F8A00658C746421265EC3EFB2B`; child rejected with `Only the paired Registry may send this message`; program 888 remained absent. |

The initial harness attempt with a numeric-only hexadecimal message ID was coerced by the CLI into an integer despite the string schema and failed with a type error. That was a harness serialization error, not evidence that the publisher address caused the failure. A corrected nonnumeric message ID produced the successful child above. Separately, the source fix now declares publisher/participant/wallet arguments as GenLayer `Address` where appropriate and the frontend encodes address arguments as `CalldataAddress`; live schema inspection and address-encoded read calls passed.

This proves the authenticated child path, duplicate no-op, stale nonce rejection, spoof rejection, and unrelated-wallet bind rejection on a disposable message-test pair. It does not prove the source-exact pair emitted a message, any two-wallet financial lifecycle, or custody safety. The release pair and probe pair remain custody-disabled and have received no GEN.

## Superseded earlier two-contract pair

Registry `0x4EECe12604bC7444e571999D9F92b951Fcc0F740` and Vault `0xB2ce7E67d2A7766Bb62993aDd37636f0163fAAc5` were deployed earlier in this sequence (transactions `0xa70dae8864a58749081a3379be2cf031736d6d8580ac44756e71f679ad893558` and `0xf8fe9162f92506d643b25166183f52ae0a63b821c918d20485fa60d7b0f3792c`). They are superseded and are not the current source-exact pair or the hosted message-proof pair. Do not use them as final release evidence.

## Historical single-contract test deployment (superseded)

| Item | Evidence |
|---|---|
| Test-only contract | `0xADd4e39E7A7b4Bd80D93D24d16f677545a55301E` |
| Deployment transaction | [`0x98ef3b13f93ba2a3cb7e3b4c290382a9d4874c4761de3c613a85162b08f99ce4`](https://explorer-studio.genlayer.com/tx/0x98ef3b13f93ba2a3cb7e3b4c290382a9d4874c4761de3c613a85162b08f99ce4) |
| Final receipt | `FINALIZED`; result `MAJORITY_AGREE`; leader execution `SUCCESS`; five validator votes agreed. |
| Deployed source | Retrieved through `gen_getContractCode`; decoded bytes were 51,179 bytes and exactly matched local `contracts/revigate.py`. |
| SHA256 | `23D7BDE7F55990080B7C4AB761A3C19EFF8912AD44114B64D080604CDA6E0C58` |
| Schema/config | `fund_offer` is payable; `get_config` returns chain 61999, contract version 1, protocol `revigate-v1`. |
| Initial reads | Program and offer pages empty; ledger `deposited=0`, `credits=0`, `held=0`, `withdrawn_or_pending_delivery=0`, `accounted=0`; native contract balance 0. |

An explicit CLI `finalize` call returned the RPC error `'dict' object has no attribute 'args'`. No retry was made. The subsequent repository-local CLI receipt read reported the deployment `FINALIZED`, and the finalized-source read succeeded. The failed finalize attempt is not treated as proof of finality; the receipt is.

## One-wei unknown-offer payable test

- Method: `fund_offer(999999)` with exactly `1 wei`; no offer with that ID existed.
- Transaction: [`0xb8ca1da8feecd22164791daa2963deefa4bb7a84d50381f0358d972bbb73e8dc`](https://explorer-studio.genlayer.com/tx/0xb8ca1da8feecd22164791daa2963deefa4bb7a84d50381f0358d972bbb73e8dc).
- Final receipt: `FINALIZED`, leader execution `SUCCESS`, returned `REFUNDABLE_CREDIT_UNKNOWN_OFFER`, `value_credited=true`.
- Signer balance: `298000000000000000000 wei` before; `297999999999999999999 wei` after the deposit.
- Contract balance after deposit: `1 wei`.
- Final contract reads: signer credit `1`; ledger `deposited=1`, `credits=1`, `held=0`, `withdrawn_or_pending_delivery=0`, `accounted=1`.

This proves the ordinary unknown-offer path becomes a refundable credit for this successful transaction and that the balances reconcile. The separate disposable-clone probe below does induce a payable execution error and shows the incoming value outlives its rolled-back accounting. Failed child-transfer recovery and a protocol-undetermined payable result remain untested.

## One-wei withdrawal and independent recipient readback

- Method: `withdraw_credit(1)` from the same signer; submitted once, with no automatic retry.
- Parent transaction: [`0x9213da42a2c1afbfbe63c701066332c388e3f9f26bfc6b3c53f63ad6666aec74`](https://explorer-studio.genlayer.com/tx/0x9213da42a2c1afbfbe63c701066332c388e3f9f26bfc6b3c53f63ad6666aec74).
- Parent receipt: `FINALIZED`, leader execution `SUCCESS`, returned transfer ID `1`; `value_credited=false`.
- Triggered transfer transaction: [`0x6bd88a053b4db62fa5b04f2710de1fc46cff19457772cfdd31b14939dca35b68`](https://explorer-studio.genlayer.com/tx/0x6bd88a053b4db62fa5b04f2710de1fc46cff19457772cfdd31b14939dca35b68), `FINALIZED`, from the test contract to the signer, value `1 wei`.
- Signer native balance: `297999999999999999999 wei` before the child transfer and `298000000000000000000 wei` after; independent delta `+1 wei`.
- Contract native balance: `1 wei` before the withdrawal and `0 wei` after.
- Final contract reads: signer credit `0`; ledger `deposited=1`, `credits=0`, `held=0`, `withdrawn_or_pending_delivery=1`, `accounted=1`.
- `get_transfer(1)` reports recipient signer, amount `1`, status `UNKNOWN_DELIVERY`.

This proves one successful 1-wei transfer reached one controlled EOA on the current test-only source. The contract does not update its record after child finalization; its `UNKNOWN_DELIVERY` status is not objective proof of either success or failure. Failed-message recovery, other recipient types, and a general receipt mechanism remain unresolved. Do not resend an unknown transfer or accept escrow deposits on this evidence.

## Explicit payable execution failure after accounting (disposable clone)

This probe used a fresh disposable clone of the current contract, with two test-only methods appended. Its source SHA256 is `C35D61AE0B8DC7F3C4E619E4AE9BBA592F92CCBF63FC95A79A490BC5322643F6`; the unchanged base contract within it is `23D7BDE7F55990080B7C4AB761A3C19EFF8912AD44114B64D080604CDA6E0C58`. No call was made to the existing candidate contract, and no candidate escrow balance was exposed.

| Item | Evidence |
|---|---|
| Disposable probe contract | `0x819Ce44739a2ed252B5f45a863cA6e65f4fF7fC3` |
| Deployment transaction | [`0x3fa7c0cfa5fd89f6c88e9028d03bd3cdc302b09dfcb116a87cd1514f41752a8f`](https://explorer-studio.genlayer.com/tx/0x3fa7c0cfa5fd89f6c88e9028d03bd3cdc302b09dfcb116a87cd1514f41752a8f) |
| Deployment finality | `FINALIZED`, `MAJORITY_AGREE`, leader execution `SUCCESS` |
| Funding transaction | [`0xc8ce725d43a2aed58a84aa17cf26e0e2c84e2b3296510d7b7c2b875d81e4d7ff`](https://explorer-studio.genlayer.com/tx/0xc8ce725d43a2aed58a84aa17cf26e0e2c84e2b3296510d7b7c2b875d81e4d7ff); signer sent exactly `1 wei` to the ephemeral test wallet; receipt `FINALIZED`, `value_credited=true` |
| Test wallet | `0x6cE9C71ec861E9eeD1eEe977eeaaC46ab2386AED` |
| Payable transaction | [`0x88c321ad0a8544ed8d9a4f2dae2d37b9799503e1b7639e1cd781854d9f8ebbd5`](https://explorer-studio.genlayer.com/tx/0x88c321ad0a8544ed8d9a4f2dae2d37b9799503e1b7639e1cd781854d9f8ebbd5); value `1 wei` |
| Payable receipt | `FINALIZED`, consensus `MAJORITY_AGREE` with five agreeing validators, leader result `rollback` with payload `REVIGATE_TEST_PAYABLE_FAILURE_AFTER_CREDIT`, execution result `ERROR`, `value_credited=true` |

The test method first added the incoming value to `total_deposited` and the sender's refundable credit, then deliberately raised an execution error. After finalization, independent reads showed the test contract balance increased from `0` to `1 wei`, while `total_deposited=0`, `total_credits=0`, `wallet_credit=0`, `held=0`, and `withdrawn=0`. The wallet and contract balance reads after the transaction were `0` and `1 wei` respectively. The earlier funding receipt shows the signer-to-wallet transfer value was exactly `1 wei`; the SDK's immediate pre-call wallet balance read also returned `0`, so that intermediate EOA balance snapshot is not treated as a reliable reconciliation. The contract-side result is unambiguous: one credited wei remains in the disposable clone with no recorded liability or recovery path.

This reproduces an irreversible accounting gap on Studionet when a payable call finalizes with an execution error after state changes: storage rolls back, but the incoming value remains. The test value is stranded in the disposable clone; no rescue or second withdrawal was attempted. This is a **critical platform-level custody blocker**, not a passing recovery test. Contract ordering alone cannot guarantee safety when a post-credit execution error can roll back all accounting state. Do not accept escrow funds on this runtime. The current candidate source was not changed or redeployed for this probe.

## Unexpected direct incoming value (same disposable clone)

After the failed payable probe, the unlocked test signer sent exactly 1 wei directly to the clone address, without method calldata.

| Item | Evidence |
|---|---|
| Transfer transaction | [`0x12cef169f2863694df4f1400cec57f75011b1fe2f3f368b3386eb2b85dc7f251`](https://explorer-studio.genlayer.com/tx/0x12cef169f2863694df4f1400cec57f75011b1fe2f3f368b3386eb2b85dc7f251) |
| Sender / recipient | Test signer `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` → disposable clone `0x819Ce44739a2ed252B5f45a863cA6e65f4fF7fC3` |
| Receipt | `FINALIZED`, result `NO_MAJORITY`, value `1 wei`, `value_credited=true`; no GenVM method execution |
| Contract balance | `1 wei` before → `2 wei` after |
| Accounting readback | `deposited=0`, `credits=0`, `held=0`, `withdrawn=0`, sender credit `0` |
| Signer balance | `297999999999999999999 wei` before → `297999999999999999998 wei` after |

The direct transfer added a second unaccounted wei to the disposable clone. This does not establish __receive__ behavior: the direct send was handled as a plain transfer, not a GenVM call. GenLayer's current documentation says Studio simulates balances without EVM/ghost contracts, so a receive handler cannot be validated as a recovery mechanism on this network. Do not add one and claim it solves the issue without a working runtime test. The failed-call and no-method cases together leave 2 wei unaccounted in this disposable test contract; neither involved the candidate address or user funds.

## Value attached to a nonpayable offer call (same disposable clone)

A third fresh wallet received exactly 1 wei, then submitted create_offer with value 1 wei. In the current contract, create_offer is declared @gl.public.write, not payable. The test used nonexistent program ID 999999, so the method returned an execution error before creating an offer.

| Item | Evidence |
|---|---|
| Wallet funding transaction | [0x8d380069bb0a4003463612b6c3698e2019ab55bdc08884dbabe5b4f0f41fe90a](https://explorer-studio.genlayer.com/tx/0x8d380069bb0a4003463612b6c3698e2019ab55bdc08884dbabe5b4f0f41fe90a), signer → 0xB4c13008d636d3D5A4017B993499bb13E943A984, FINALIZED, 1 wei, value_credited=true |
| Nonpayable call transaction | [0x120c46833362ffb892c6573d419a5d813ea5a4338c96a0316c17a395b25c03d7](https://explorer-studio.genlayer.com/tx/0x120c46833362ffb892c6573d419a5d813ea5a4338c96a0316c17a395b25c03d7) |
| Receipt | FINALIZED, MAJORITY_AGREE, execution ERROR, value_credited=true, requested value 1 wei |
| Contract balance | 2 wei before → 3 wei after |
| Accounting readback | deposited=0, credits=0, held=0, withdrawn=0, wallet credit 0 |

The transaction was accepted with value despite targeting a nonpayable method, and the value remained in the clone after the method failed. This is a live T13 failure; the Direct Mode nonpayable-value assertion does not model this chain behavior. Together, the explicit payable error, direct transfer, and nonpayable call left 3 wei unaccounted in the disposable clone. The current candidate address and user funds were not touched.

## Boundaries and superseded deployments

- The only live successful accounting path tested was one wallet, one unknown-offer refundable credit, and its one-wei withdrawal. Three separate minimum-value probes on a disposable clone reproduced unaccounted value. No program was verified, and no signed-source two-wallet lifecycle, material revision, acceptance, refund allocation, early exit, maturity payout, or Wallet C negative case ran.
- The payable-error, direct-value, and nonpayable-call probes above are a separate test-only clone and deliberately demonstrate three unaccounted incoming wei. They do not fix custody or certify the candidate.
- The source for this historical test address was uncommitted at deployment. The address is not configured in production and must not hold user funds.
- An earlier candidate at `0x2bb820945Be33f06c0F0E66dEC3c620cDAA6f995` (tx `0x5c4c535ef7ea5d297369243ee845781546ca7e9da53b700db69f8c300c6c64ed`, source hash `F110ACF95D892DFA76E90239605C5E2E7E47C1EE79E862723BD0BFF719820206`) is superseded because its source differs from the current worktree.
- An earlier deployment at `0x89b4B9620Ef81268CE7cE729Bb14a041a1479188` had a storage defect; no user funds were sent to it. Do not use either older address.
- GenLayer documents that failed internal child value-transfer transactions do not automatically return the value, and Studio does not implement Ghost Contracts for external messages. This contract has no internal value-bearing child transfer path; the live external EOA success case above does not establish failed-delivery recovery. See [GenLayer value transfers](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers) and [messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages).

## 2026-10-14 read-only connectivity, source and child observer recheck

The default restricted process returned DNS “Access is denied” for
`studio.genlayer.com`; proxy environment variables were unset, Windows
Internet Settings had proxy disabled/no PAC, and WinHTTP was direct. With the
approved host network path, DNS resolved `172.67.210.182` and `104.21.53.84`.
HTTPS GET `https://studio.genlayer.com/api` returned HTTP 405 (the JSON-RPC
endpoint expects POST), and read-only GenLayerJS calls succeeded. This
identifies a local sandbox DNS restriction, not a Studionet outage. No other
GenLayer network was used.

The repository has no `gltest.config.yaml`. The Direct Mode test runner logs
its local simulator default (`http://127.0.0.1:4000/api`, `localnet`); those
tests do not submit network transactions. The corrected Vault deployment used
the repository-local CLI wrapper, pinned at `0.39.1`, with
`--rpc https://studio.genlayer.com/api`. GenLayerJS identified that endpoint
as Studionet chain `61999`. No other remote GenLayer network was configured or
used. The pinned CLI's `write` action hardcodes `value: 0n`; it cannot submit a
payable accounting probe.

Read-only source attestation of the configured pair on chain 61999:

| Contract | Address | Deployed SHA256 | Local source match | Config |
|---|---|---|---|---|
| Registry | `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE` | `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F` | Yes | Reciprocal Vault `0xf390D8D77f21710679a72Fc11b84A5e85a318849`; custody disabled |
| Vault | `0xf390D8D77f21710679a72Fc11b84A5e85a318849` | `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F` | No | Reciprocal Registry `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE`; custody disabled |

The local corrected Vault remains SHA256
`C7DF6C4F18D276CFB0D52BA863CA960FC0982163BEAE4E2FCCF91F24866A6F55` and is
not deployed. No contract write, deployment, pairing or value transfer was
made during this read-only recheck.

The live read-only observer queried parent
`0xc27924f097aa08924a3275c59ca1c69b1cb4ceb92c45bd61fc2e0ed0c9b4a949` and
received child ID
`0xa3a3c2c5384c52314ef2b56b78c70b782e3bb556cef9702a0784962b8905fbee` from
that parent. The returned child hash matched the requested ID; status was
`FINALIZED`, sender was the disposable Vault
`0xfDA04A975d1467580C6c16eb8cCD576fec4076Af`, recipient was the test signer
`0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`, and value was `1 wei`. The
response contained `result_name=NO_MAJORITY` and no execution-result field.
The GenLayer RPC returned `Method not found` for the documented
`gen_getTransactionReceipt` method on this endpoint. Therefore the current
observer classification is `UNKNOWN`; it does not infer execution success or
recipient credit. A separately recorded historical before/after EOA balance
delta of +1 wei remains evidence for that one event only and is not returned
or attributed by the current observer.

## 2026-10-14 corrected Vault source deployment and readback

Using the repository-local GenLayer CLI `0.39.1` and active test signer
`0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`, the corrected local Vault was
deployed to a fresh isolated Studionet address. The deployment attached zero
GEN (`value_credited=false`) and finalized with `MAJORITY_AGREE`.

| Item | Result |
|---|---|
| Contract | `0xcd13bfa0f323a806020790949D7454F26544daE7` |
| Deployment transaction | [`0x314423da5145348606dd0519c5832b7f1e41affef457aabb87eebca261c35071`](https://explorer-studio.genlayer.com/tx/0x314423da5145348606dd0519c5832b7f1e41affef457aabb87eebca261c35071) |
| Finality / consensus | `FINALIZED` / `MAJORITY_AGREE` |
| Deployed source SHA256 | `C7DF6C4F18D276CFB0D52BA863CA960FC0982163BEAE4E2FCCF91F24866A6F55` |
| Local source SHA256 | `C7DF6C4F18D276CFB0D52BA863CA960FC0982163BEAE4E2FCCF91F24866A6F55` |
| Source comparison | Exact byte-for-byte match |
| `get_config` | Chain 61999; protocol `revigate-vault-v1`; custody disabled; Registry field points to `0x5c09ffa32c1cdab36f3e1340cf94ac254eaed9be` |
| `get_ledger` | Every field is zero, including `native_balance`, `backing_liabilities`, `liability_shortfall`, `unassigned_surplus`, and `reconciliation_delta` |
| Pairing / application binding | Not reciprocal to the existing Registry configuration; not bound to the frontend |

This deployment proves that the corrected source compiles, finalizes, and is
readable byte-for-byte on Studionet. The zero-state ledger readback does not
exercise the revised backing formula against nonzero liabilities. The pinned
CLI's public `write` command has no value option and hardcodes `value: 0n`, so
it cannot submit the one-wei payable accounting check. No payable write or
escrow lifecycle was submitted from this corrected-source test address. The
previously deployed reciprocal pair remains on the earlier Vault source.

## 2026-10-14 Registry V2 deployment and signed rulebook lifecycle

This is the current Registry V2 test deployment and supersedes earlier statements in this file that Registry V2 was not deployed. The deployment and all following Registry writes used GenLayer Studionet 61999 and the repository-local GenLayer CLI `0.39.1`, configured explicitly with `https://studio.genlayer.com/api`. The configured test signer was `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`. Every transaction in this lifecycle had `value_credited=false`.

### Source-exact deployment

| Item | Result |
|---|---|
| Source commit | `4971823c43d1b552215475573e81e1da89a979c7` |
| Contract file | `contracts/revigate_registry.py` |
| Git blob | `fd246b3766bdb4be78819f116513435f56d73a66` |
| Local SHA-256 | `169F2569CC7374B94A7CD0059D002A87480B8E62D60F18BCE42A22E0CD50F2EF` |
| Deployed address | `0xBB15E0F4Ad5e61AE1374ed1EA3E32f2172EA6D3F` |
| Deployment transaction | [`0xad9f68174094e34fd971d31314a097d783ed717fe4f07b9524ebd49beca9ec97`](https://explorer-studio.genlayer.com/tx/0xad9f68174094e34fd971d31314a097d783ed717fe4f07b9524ebd49beca9ec97) |
| Receipt | `FINALIZED`, `MAJORITY_AGREE`, five votes agree, leader execution `SUCCESS` |
| Value | `0`, `value_credited=false` |
| Deployed source comparison | Exact byte-for-byte match with the contract file at the source commit |
| Canonical `get_config` | Chain 61999; protocol `revigate-registry-v1`; version 2; custody `NONE` |

### Baseline and acknowledgment

| Action | Transaction | Canonical result |
|---|---|---|
| Register baseline | `0xc4069ee95a663fb183e801b6c31912a0737573cf11380b2b9187a5f7d9db6e52` | Program 1; publisher is the nominated test wallet; repository `bibidee/revigate`; fixture branch `revigate-rulebook-fixture-v2`; fixed manifest and rulebook paths. |
| Verify baseline | `0xb2ef13b3191e01b884f7a59cc6ffa6a86520da83fe24ecdcf976bfa0365cccd9` | Finalized; canonical program `VERIFIED`, baseline SHA `313dfb0ac2b20f32954dd0ffb08fa60214ae34da`, epoch 1, digest `ca32895d80580ab3a3ddc771e1836da0a8a1e4d3fa2d3ebe85fb047ba7883170`. |
| Publisher acknowledgment | `0x96d42b7cbc90339dda4f0c16752139450b30fbbe1cbe89d12b49b296c46a46b0` | Finalized; readback matched the publisher wallet, epoch 1, baseline SHA, and baseline digest. |

### Signed revisions and actual hosted outcomes

The fixture signatures and publisher nomination are independently recorded in [rulebook fixture evidence](RULEBOOK_FIXTURE_EVIDENCE.md). The outcomes below are hosted transaction results; fixture names do not determine or substitute for an outcome.

| Fixture | Request / assessment | Actual outcome and canonical readback |
|---|---|---|
| NONMATERIAL, commit `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10` | Request `0xb33c3f63d957b00ac2a90883d6dec2898234287347745f72ad87afc73e3b2ffa`; assessment `0xfb6cb52f1145c564ef2b3feae7a728cdccc8f970118987b2c8041e9628ebd624` | Finalized as `NONMATERIAL`. Program readback after assessment: status `VERIFIED`, active SHA `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10`, digest `55fa1674d3523cb117b08643556f06ea39085790266ba047fe430fc0cf2ae3a4`, epoch 1, `pending_review=0`, material-event count 0. |
| MATERIAL, commit `376e447065b8a7efd1d26a60c6c9ac476bd1e567` | Request `0xe87dfeb08031474f41c442c116c196788571740e633e253540f5d529d95cdfe2`; assessment `0xbc87505c4131907777fd7ea3a9c8d38fa762bbdbcbabf09984cfa4159a31bf0b` | Finalized assessment result `INCONCLUSIVE`. Canonical result records `base_source_status=INCONCLUSIVE` and `candidate_source_status=INCONCLUSIVE`; each reason is `commit request failed with HTTP status 403`. Program stayed on the NONMATERIAL SHA/digest at epoch 1, with no pending review. This is not a semantic MATERIAL verdict. |
| Ambiguous, commit `14401f20f2d3eeeac537746966646809e5c01b8c` | Initial request `0x5b32091c5e36b98acb0ad193ebf53dde25c69a2bad25fc3dc4e3216cb53c8552` | Finalized with `MAJORITY_AGREE` consensus but execution `ERROR` on all five validators. Validator results decoded to `A review is pending or the publisher cooldown is active`; canonical state had no pending review. The preceding material request timestamp was `1791997634`; this request was timestamped `1791997772`, 138 seconds later, inside the contract's 300-second publisher cooldown. No review was created. |
| Ambiguous after cooldown, commit `14401f20f2d3eeeac537746966646809e5c01b8c` | Request `0xb85625fdb851b9bb1c4708bdb9ee34581e21bc59e3ed8f8d19419f48d1b82d5a`; review 3 assessment `0x6829dae057666682f4775dd0bfd001e0b95017380c9ce6ae0d8abdbe1654bcc9` | Request finalized and returned review ID 3. Assessment finalized with `MAJORITY_AGREE`; three executions completed with `INCONCLUSIVE`, while two validator executions were cancelled after quorum. Canonical review 3 is `INCONCLUSIVE`; both source lookup reasons are HTTP 403. The ambiguity itself was not semantically assessed. |

Final canonical program readback: `VERIFIED`; active SHA `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10`; digest `55fa1674d3523cb117b08643556f06ea39085790266ba047fe430fc0cf2ae3a4`; epoch 1; `pending_review=0`; material-event count 0. The existing deployment successfully verified the baseline, but hosted source authentication later returned HTTP 403 for both revisions' base and candidate commit requests. The response establishes the status code, not the underlying reason for the provider denial.

## 2026-10-14 source correction and hosted probe status

The current local Registry source correction is commit
`46b749669c532bf85b3491d2ea6dd4bcee987422`. Its contract file has Git blob
`3e094b1b359cc7d451a209db79a2456cbc17bd` and SHA-256
`EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56`.
It stores authenticated source snapshots, classifies GitHub provider errors,
and applies bounded retry timing based on response headers. This paragraph
records the historical state before the corrected deployment documented below;
the address and deployment transaction above attest only source commit `4971823`.

A disposable, zero-value GitHub diagnostic contract at
`evidence/github-access-diagnostic/github_api_probe.py` was deployed at
`0x1d89559F621AEb81b53E7004Fe54BfBe1D5c9a02`. Deployment transaction
`0x45aa328c86e642173a3a331e0c25d0030100fa1808c3d80c1530a4ff8418f8ae`
finalized `MAJORITY_AGREE`: four validators agreed, one was idle, execution
succeeded, and `value_credited=false`. Deployed-source readback exactly
matched the local source, SHA-256
`82328DAF235D06A2C790AE093D916E4E69EF3EA6F37F03378981ECDD91396F1D`.

Probe transaction
`0x2add2cd295c1cbcfc2753631582947d4ef59b266eef77bb377cc7d74469c0228`
finalized `MAJORITY_DISAGREE` after four rounds, with three disagreeing votes
and two validators cancelled after quorum. The leader and completed validator
executions each succeeded and observed HTTP 200 from both the signed fixture
commit endpoint and GitHub's rate-limit endpoint. The captured rate-limit
response reported a core limit of 60 with 42 remaining.

The disagreement does not indicate another provider denial. The probe
truncated the successful commit body to 512 bytes before attempting JSON
parsing, so its separate `sha` field was empty. Because the validator requires
that field to equal the expected commit SHA on HTTP 200, it returned false.
The evidence proves that the two public URLs were reachable during this run
and that the earlier 403 did not recur. It cannot establish why the historical
403 occurred, so that cause remains **unknown**.

There is no new Registry source attestation or current-source lifecycle in
this correction record. The diagnostic address is not the Registry and does
not attest corrected Registry source `46b7496`. The hosted baseline and
NONMATERIAL outcomes, and the actual INCONCLUSIVE outcomes for MATERIAL and
ambiguous fixtures, remain valid only for the earlier deployed Registry.

## 2026-10-14 corrected Registry deployment and lifecycle

The corrected Registry source at commit `46b749669c532bf85b3491d2ea6dd4bcee987422` was deployed with the repository-local CLI to `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`. Deployment transaction `0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2` finalized `MAJORITY_AGREE` with execution `SUCCESS` and `value_credited=false`. Source readback exactly matched local SHA-256 `EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56` and Git blob `3e094b1b359cc7d451a209db79a2456cbc17bd`. `get_config` returned chain 61999, contract version 2, protocol `revigate-registry-v1`, custody `NONE`.

| Action | Transaction | Final result |
|---|---|---|
| Register signed baseline | `0xc48d0fffa186b9c35ec1e7181b2902feb7a1f9b48019d4795609f5cab255fe09` | Program 1, finalized successfully, zero value. |
| Verify baseline | `0xad3ee46ca318d710c1a957d4f47a51c4c464d00f0cbb2025f980eaede6f86db8` | `VERIFIED`, epoch 1, baseline SHA `313dfb0ac2b20f32954dd0ffb08fa60214ae34da`. |
| Request material revision | `0x1deee7091023f61e2797fe526cae9521e5ef8a7d34fff07826cab49fd2f45f52` | Review 1 created. |
| Assess material revision | `0xeae537a1354d3335cb9c721eb6225edd4ffe71a52e7629d75b819a4c6756df1f` | Actual `MATERIAL`; canonical review sources `VERIFIED`; active SHA advanced to `376e447065b8a7efd1d26a60c6c9ac476bd1e567`, epoch 2. |
| Request ambiguous revision after cooldown | `0x79c27d3aed9bdd7bfeb6073764b91d5fe3108744083bb930a77369b559493a12` | Review 2 created and finalized successfully. |
| Assess ambiguous revision | `0x37bff50bff4456cb062fda7a210d6a4f3a8ac8d37d9585d4f08c4b78f37ab866` | Actual `MATERIAL`, `MAJORITY_AGREE`; three validators agreed and two were idle after quorum. Both sources were `VERIFIED`. |

Canonical review 2 records candidate digest `3a95f7e76cedba0bce0db531b97c17a0c0d842b967278d0768c2320ba1769631`, proof digest `5c8e51d5b8d47f5b57de572bb1643769df42be42965b2504dee1e8d545f559aa`, changed clause `R-01`, and rationale that replacing the 60-day rule with vague sufficient participation plus discretion changed eligibility criteria. Final `get_program(1)` returned `VERIFIED`, active SHA `14401f20f2d3eeeac537746966646809e5c01b8c`, epoch 3, material-event count 2, `pending_review=0`, and `provider_retry_at=0`.

This current lifecycle supersedes the older deployment's HTTP 403 outcomes for release-gate verification. It does not prove the cause of those historical 403 responses. Production writes remain locked, no funds were accepted, and no merge or production promotion occurred.

### Release boundaries

This is a zero-value Studionet test deployment, not a production deployment. No user funds were accepted, production writes remain locked, and no merge or production promotion occurred. These transactions show actual baseline verification, acknowledgment, and one NONMATERIAL transition. They do not demonstrate a hosted MATERIAL result, a semantic ambiguous-language result, validator disagreement, or prompt-injection handling. The full outcome ledger is in [the T01–T52 matrix](TEST_MATRIX.md); the verdict remains **NOT RELEASED**.

## 2026-10-14 live browser validation

The public noncustodial frontend at `https://the-revigate.vercel.app` was exercised in Brave against Studionet chain 61999. The reading room, publisher, acknowledgments, activity, about, and `/program/1/` routes all loaded over HTTPS. The browser read the exact canonical Program 1 record (`VERIFIED`, epoch 3, active SHA `14401f20f2d3eeeac537746966646809e5c01b8c`, digest `3a95f7e76cedba0bce0db531b97c17a0c0d842b967278d0768c2320ba1769631`, `pending_review=0`, material-event count 2).

Wallet B `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54` signed the zero-value `acknowledge_rules` action for Program 1, epoch 3. Transaction `0xb3c62284235bddd5f785f4c8c47bb9da0f4e924c0c675ec89328def5b199f140` finalized on the Registry. The transaction sender and recipient were checked, `value_credited=false`, and the canonical acknowledgment history readback showed the epoch 3 SHA and digest. The browser observer conservatively labeled the RPC response `finalized-execution-unknown` because this endpoint omitted `txExecutionResultName`; the receipt itself had `statusName=FINALIZED`, `result_name=MAJORITY_AGREE`, leader payload `true`, successful validator executions, and no retry was submitted.

The browser also read canonical review 1 (`376e447065b8a7efd1d26a60c6c9ac476bd1e567`) and review 2 (`14401f20f2d3eeeac537746966646809e5c01b8c`). Both showed `base_source_status=VERIFIED`, `candidate_source_status=VERIFIED`, and actual `MATERIAL` outcomes. Review 1 recorded the 14-to-60-day eligibility change; review 2 recorded the ambiguous discretion change in `R-01`.

The connected Rabby account during the publisher-page check was `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`. Program 2 is owned by that address but remains `PROPOSED`; its existing verification transaction `0xb3d5a978732741af0b0ad04b65cd6f271aca6ef46a87f48262ede91b3ed8b43b` finalized `MAJORITY_AGREE` with execution `INCONCLUSIVE` because the signed manifest nominates the different publisher `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`. No retry was submitted. The successful publisher lifecycle for Program 1 therefore remains bound to the manifest wallet `0x527d…56b5`; a browser publisher write from that account is still unverified.

These browser checks used zero native value. They do not prove wallet-extension account switching, network switching, rejection handling, or independent security review. Production writes remain locked and the release verdict remains **NOT RELEASED**.

## 2026-10-14 source correction and hosted probe status

The current local Registry source correction is commit
`46b749669c532bf85b3491d2ea6dd4bcee987422`. Its contract file has Git blob
`3e094b1b359cc7d451a209db79a2456cbc17bd` and SHA-256
`EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56`.
It stores authenticated source snapshots, classifies GitHub provider errors,
and applies bounded retry timing based on response headers. This duplicate
historical record predates the corrected deployment documented below; the
address and deployment transaction above attest only source commit `4971823`.

A disposable, zero-value GitHub diagnostic contract at
`evidence/github-access-diagnostic/github_api_probe.py` was deployed at
`0x1d89559F621AEb81b53E7004Fe54BfBe1D5c9a02`. Deployment transaction
`0x45aa328c86e642173a3a331e0c25d0030100fa1808c3d80c1530a4ff8418f8ae`
finalized `MAJORITY_AGREE`, and deployed-source readback exactly matched local
SHA-256 `82328DAF235D06A2C790AE093D916E4E69EF3EA6F37F03378981ECDD91396F1D`.
Probe transaction
`0x2add2cd295c1cbcfc2753631582947d4ef59b266eef77bb377cc7d74469c0228`
finalized `MAJORITY_DISAGREE`, although both endpoints returned HTTP 200 and
the rate-limit response reported 42 of 60 core requests remaining. The
disagreement came from truncating the commit response before JSON parsing,
which left the comparison SHA empty. The earlier 403 did not recur, but its
historical cause remains **unknown**.

There is no new Registry source attestation or current-source lifecycle in
this correction record. The diagnostic address is not the Registry and does
not attest corrected Registry source `46b7496`. The hosted baseline and
NONMATERIAL outcomes, and the actual INCONCLUSIVE outcomes for MATERIAL and
ambiguous fixtures, remain valid only for the earlier deployed Registry.
