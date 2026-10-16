# Studionet evidence

## Current single-contract funded candidate — 2026-10-16

The current branch deploys one source-attested contract on GenLayer Studionet 61999. This is a disposable custody test; it is not production and no user funds were accepted.

| Item | Evidence |
|---|---|
| Contract | `0xedfE5a6354a518Fbb46111cBa9D3216DA5869b99` |
| Deployment | `0xe80bbd5229fa6c7f0c17cb39497e1a932e556f316d6f4c50fe16b4d4e9a4e54a` |
| Source SHA-256 | `5F49DDBA7C88DA98B584F02F28075B1B1DA54305F0C68105344108522F4C833A` |
| Config | chain 61999, version 5, custody enabled for test, public custody false |
| Signed baseline | `313dfb0ac2b20f32954dd0ffb08fa60214ae34da`, VERIFIED, epoch 1 |
| MATERIAL candidate | `376e447065b8a7efd1d26a60c6c9ac476bd1e567`, actual MATERIAL, epoch 2 |
| Funded offer | 1,000 wei accepted; material exit 800/200 |
| Refund | 777 wei unaccepted refund |
| Maturity | 555 wei allocated to participant |
| Withdrawals | participant +755; publisher +2,577 observed balance deltas |
| Final ledger | deposited 3,332; held 0; credits 0; dispatched 3,332; contract balance 0 |

Both withdrawal parents finalized successfully and returned one child ID. Both child records were FINALIZED with NO_MAJORITY and no execution-result field. The independent recipient deltas are preserved, but the child execution result remains unclassified. The contract therefore keeps external settlement pending and does not authorize replay. The duplicate withdrawal transaction finalized with execution ERROR.

Machine-readable evidence: [2026-10-16 funded lifecycle](../evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json).

## Release boundary

Public custody remains locked. The older V4/noncustodial and archived Vault sections below are historical and must not be read as the current contract or as proof that exceptional value-transfer paths are safe.

# Studionet Candidate Evidence

## Noncustodial Registry V4 deployment — 2026-10-15

The exact committed `contracts/revigate.py` source was deployed with zero attached value to `0x2E2065063b63F305512Ee66F0FEb305557c9143b`. Deployment transaction `0x89a3c601c97d936b5a068f3d62a5d623057f5d8349ca983fe871df9c300c94a6` reached `FINALIZED` with successful execution, `MAJORITY_AGREE`, and five `AGREE` votes.

The deployed source was fetched from Studionet and matched the local UTF-8 source byte-for-byte at SHA-256 `99DB611FC5552F26F22DC3DECC9F7A7676C0A676AD587D593D62792EDEE73064`. Canonical `get_config()` returned protocol `revigate-registry-v1`, chain `61999`, contract version `4`, custody `NONE`, escrow `NONE`, and transfer evidence `NONE`. Initial `get_program_page(0, 5)` returned no programs and cursor zero.

This proves deployment identity and clean initial Registry state. It accepts no application funds and does not rehabilitate the historical escrow deployment. Machine-readable deployment evidence is in `evidence/noncustodial/2026-10-15-registry-v4-deployment.json`.

### Registry V4 signed-source lifecycle (archived fixture)

The unlocked repository-local CLI completed the zero-value lifecycle on this exact V4 deployment using the genuinely GitHub-verified **archived** `revigate-rulebook-fixture-v2` commit chain and its nominated publisher `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`. This is the active V4 deployment evidence, but it is not the later Wallet A fixture described below.

| Action | Transaction | Final result |
|---|---|---|
| Register | `0xcb804849e1b6887da5ce777d77d1a0ad5843f2d88f0dd3ae84f5f289f5b20b3d` | Program 1, FINALIZED |
| Verify source | `0x21b7018b1073223f6b3968a4ed59772356993e6caed3510a983ac40d800472b4` | VERIFIED, epoch 1 |
| Assess NONMATERIAL | `0xb87b66fc63234ae3620d5838e3096a42fa8248210d54387853578067b50dbb42` | NONMATERIAL; epoch stayed 1 |
| Assess MATERIAL | `0xf1b2be8dbb138680056f83003d33e2bfaa3aebd85975541ab50f0380c75a0b69` | MATERIAL; epoch 2 |
| Assess ambiguous | `0x23635a0e7ce84e60eb9ea907dc2542dff2e6bc3b79f7241048d7136caac74ae9` | Actual MATERIAL; epoch 3 |

All eight lifecycle writes finalized with successful execution and majority agreement. Final canonical state is VERIFIED at SHA `14401f20f2d3eeeac537746966646809e5c01b8c`, digest `3a95f7e76cedba0bce0db531b97c17a0c0d842b967278d0768c2320ba1769631`, two material events and no pending review. Full machine-readable evidence is in `evidence/noncustodial/2026-10-15-registry-v4-lifecycle.json`.

## Current single-contract Wallet A lifecycle — 2026-10-15

The source-attested disposable contract
`0xD86A6C0a3949D2452bB8964e076983254375b5fE` completed a fresh signed source
lifecycle through the corrected public preview. All transactions used Wallet A
`0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5` and attached zero GEN.

| Action | Transaction | Result |
|---|---|---|
| Register corrected baseline | `0xd26927aecb3c4f48dbbc9a95e2b6688aa5b2738277f71023b741d016c848f4fa` | Program 3, correct path `rules/revigate-v2.md` |
| Verify baseline | `0x3e2b087cc0e993377e93f4ab59412ce0c0c45893a215879e3852840efb2db49c` | VERIFIED, epoch 1 |
| Request NONMATERIAL | `0x438c40e23536ddc426604bd726cd917f26ca3f402eb1f00ef3eb2669dc931e5c` | Review 1 |
| Assess NONMATERIAL | `0x9356e29b69c5ffed1d96b03d1e104d69a69fab9f93505636e74cf464a3d4d296` | Actual NONMATERIAL; one validator DISAGREE; epoch stayed 1 |
| Request MATERIAL | `0xd2017c0d4b5161360ebc2db254c6897e73cf29a31d67dc829261876dc38a0bbb` | Review 2 |
| Assess MATERIAL | `0x9cb332734cb483ea2ae72bec1c38efe57e530e5697dc0b62dc322f93f1b43d44` | Actual MATERIAL; epoch 2 |
| Request ambiguous | `0xa31f497bf11a463c5b4495511ee475abba6a6dc6818b2e6d1b5e76e188587b78` | Review 3 |
| Assess ambiguous | `0x5514cf142fe14a041138c55c85da8fd2849591d5ac9de8109b46abb78b61fff2` | Actual MATERIAL; epoch 3 |

Final canonical Program 3 state is VERIFIED with active SHA
`d35d438d0e45e58e3227f95135fa3a2abc523aed`, digest
`2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`,
two material events and no pending review. This proves the hosted semantic
lifecycle on the single-contract deployment. It does not clear the custody
blocker documented below.

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

## Historical Wallet A signed-fixture lifecycle on prior Registry V2 (2026-10-14)

This section records a genuine signed Wallet A fixture lifecycle on the prior
single-contract Registry V2 deployment. It is retained as source-authentication
and hosted-behavior evidence, but it does not attest the active V4 deployment
above and is not the current production contract. The old address
`0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` came from an earlier fixture and is
not a user wallet for this lifecycle. It is retained only where needed to keep
historical probes auditable; it was not used for the Wallet A lifecycle.

| Identity | Address |
|---|---|
| Wallet A (publisher, Rabby signer) | `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5` |
| Wallet B (participant) | `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54` |
| Network | GenLayer Studionet, chain `61999` |
| Registry | `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3` |

Publisher writes below were signed by Wallet A; the participant acknowledgment
was signed by Wallet B. Every write attached zero native value and recorded
`value_credited=false`. No escrow, Vault, deposit, credit, refund, payout, or
user funds were involved.

### Exact Registry deployment

The corrected Registry source is commit `46b749669c532bf85b3491d2ea6dd4bcee987422`,
Git blob `3e094b1b359cc7d451a209db79a2456cbc17bd`, SHA-256
`EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56`.
Deployment transaction
[`0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2`](https://explorer-studio.genlayer.com/tx/0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2)
finalized with `MAJORITY_AGREE`, successful execution, and exact source
attestation. `get_config` read back chain 61999, protocol
`revigate-registry-v1`, version 2, custody `NONE`.

### Program 3 baseline and revisions

The signed baseline is GitHub commit
[`b1c5254617155214e210a39dafd742fd33b102d6`](https://github.com/Bibidee/revigate/commit/b1c5254617155214e210a39dafd742fd33b102d6)
on branch `revigate-rulebook-wallet-a-web`. Its manifest nominates Wallet A.

| Action | Transaction | Canonical result |
|---|---|---|
| Register baseline | [`0xf14863cefa5c8c80526b55f1500cdc111c859f4fa0bfd670f93968a49433aa0b`](https://explorer-studio.genlayer.com/tx/0xf14863cefa5c8c80526b55f1500cdc111c859f4fa0bfd670f93968a49433aa0b) | Program `3`, finalized, zero value. |
| Verify baseline | [`0x6ee5b6bbb3f67d3971bbe965b7386a542872cc9ba6c1e43bbd0c6b0cfa59f048`](https://explorer-studio.genlayer.com/tx/0x6ee5b6bbb3f67d3971bbe965b7386a542872cc9ba6c1e43bbd0c6b0cfa59f048) | `VERIFIED`, epoch 1, active/baseline SHA `b1c5254617155214e210a39dafd742fd33b102d6`, digest `3a95f7e76cedba0bce0db531b97c17a0c0d842b967278d0768c2320ba1769631`. |
| Signed NONMATERIAL candidate | GitHub commit [`ee033cbef9450f58990b01eac77b5949453f2130`](https://github.com/Bibidee/revigate/commit/ee033cbef9450f58990b01eac77b5949453f2130), green `Verified` | Editorial-only change. |
| Request NONMATERIAL review | [`0xb0747438b5d83667b6aa551093aa9ff66240de0b75587a9d1aa6d0002934c82e`](https://explorer-studio.genlayer.com/tx/0xb0747438b5d83667b6aa551093aa9ff66240de0b75587a9d1aa6d0002934c82e) | Review `3`, finalized, zero value. |
| Assess NONMATERIAL review 3 | [`0x19f9190ef84f8e6e459796dcd7d6b641c5151396cae7945a60efa9c6c083f37c`](https://explorer-studio.genlayer.com/tx/0x19f9190ef84f8e6e459796dcd7d6b641c5151396cae7945a60efa9c6c083f37c) | Actual `NONMATERIAL`; active SHA became `ee033cbef9450f58990b01eac77b5949453f2130`, epoch remained 1, pending review 0. |
| Signed MATERIAL candidate | GitHub commit [`ecac64c4f95a527c9f587ab992d6e503d713bb11`](https://github.com/Bibidee/revigate/commit/ecac64c4f95a527c9f587ab992d6e503d713bb11), green `Verified` | R-01 changed to a mandatory 60-day eligibility rule. |
| Request MATERIAL review | [`0xd2dee5dbfce5b605aa7003554f25ba483565ecbf95d887120bc675a37614b4a3`](https://explorer-studio.genlayer.com/tx/0xd2dee5dbfce5b605aa7003554f25ba483565ecbf95d887120bc675a37614b4a3) | Review `4`, finalized, zero value. |
| Assess MATERIAL review 4 | [`0x18f4f7327ad2f68e7ac33ec6aa62eccd9013ffcf504ac941e9df5b5fdee74340`](https://explorer-studio.genlayer.com/tx/0x18f4f7327ad2f68e7ac33ec6aa62eccd9013ffcf504ac941e9df5b5fdee74340) | Actual `MATERIAL`; both sources `VERIFIED`; active SHA became `ecac64c4f95a527c9f587ab992d6e503d713bb11`, epoch 2. |
| Signed ambiguous candidate | GitHub commit [`d35d438d0e45e58e3227f95135fa3a2abc523aed`](https://github.com/Bibidee/revigate/commit/d35d438d0e45e58e3227f95135fa3a2abc523aed), green `Verified` | R-01 changed to “generally qualify after sufficient participation, subject to exceptional circumstances.” |
| Request ambiguous review | [`0x5f19d93b54db9740ffd8f9cc12144632cba4b7553205622a1b970870c9646cd9`](https://explorer-studio.genlayer.com/tx/0x5f19d93b54db9740ffd8f9cc12144632cba4b7553205622a1b970870c9646cd9) | Review `5`, finalized, zero value. |
| Assess ambiguous review 5 | [`0xc60c1c640fe1fc9803056e596e61bdfcdee05e60609ded5c7f38b82e163f6956`](https://explorer-studio.genlayer.com/tx/0xc60c1c640fe1fc9803056e596e61bdfcdee05e60609ded5c7f38b82e163f6956) | **Actual `MATERIAL`**, `MAJORITY_AGREE`; three validators completed `AGREE` and two were idle after quorum. Both sources `VERIFIED`; changed clause `R-01`. |
| Signed prompt-injection candidate | GitHub commit [`e097fb48f8f4576c6c50e9d83061c8c1ad965919`](https://github.com/Bibidee/revigate/commit/e097fb48f8f4576c6c50e9d83061c8c1ad965919), green `Verified` | The fixture says review-note instructions are untrusted rulebook evidence. |
| Request prompt-injection review | [`0x401839a7a5636320447d38b74222aa682ad42820535679a430a3be539d837be7`](https://explorer-studio.genlayer.com/tx/0x401839a7a5636320447d38b74222aa682ad42820535679a430a3be539d837be7) | Review `6`, finalized, zero value, Wallet A signer. |
| Assess prompt-injection review 6 | [`0x5b9a69827fde20433650f92545802424b69a6fb371a1c7b0b954d394f31c9427`](https://explorer-studio.genlayer.com/tx/0x5b9a69827fde20433650f92545802424b69a6fb371a1c7b0b954d394f31c9427) | **Actual `NONMATERIAL`**, `MAJORITY_AGREE`; two validators were idle after quorum. Both sources `VERIFIED`; changed ID `__PREAMBLE__`; assessment execution hash `0x5c33026ce427bb0f3b96ada4294b742ffb84c10466c5fe6b1e9bc6d16d328f6b`. |

Review 5 canonical result recorded candidate digest
`2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`, proof
digest `addbf2d8fd469c539e8caee0712aa2a8289e691707f12556a52bdef0f8798d66`,
and rationale that the vague eligibility and exception language materially
changed participant criteria and discretion.

Review 6 canonical result recorded base digest
`2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`,
candidate digest
`bcaf286d0941d768d0975457fdf20c0c8ce4d78f0c559819a2494f1ea1dbc123`,
candidate proof digest
`7f0d56069e630368dc269f58f565310e761e99ac58ff7efda24bfd983ad2afcc`,
and the actual outcome `NONMATERIAL`. The semantic rationale was:
“Preamble disclaimer added; no rules R-01–R-04 altered and no
eligibility/benefits/appeals elements changed.”

Final `get_program(3)` readback:

```json
{
  "status": "VERIFIED",
  "active_sha": "e097fb48f8f4576c6c50e9d83061c8c1ad965919",
  "baseline_sha": "b1c5254617155214e210a39dafd742fd33b102d6",
  "document_digest": "bcaf286d0941d768d0975457fdf20c0c8ce4d78f0c559819a2494f1ea1dbc123",
  "epoch": 3,
  "material_event_count": 2,
  "pending_review": 0,
  "publisher": "0x4a7d76b8c4668a3426d6d54ec24b41fa87b532f5"
}
```

### Browser boundary

The production browser is bound to the Registry-only frontend at
`https://the-revigate.vercel.app`, Studionet 61999, and Rabby account Wallet A.
The publisher page signed the current request and assessment above. The browser
observer conservatively labels the RPC wrapper `pending` or
`finalized-execution-unknown` when the endpoint omits an execution-name field;
the canonical receipt and `get_review`/`get_program` readbacks above are the
source of truth. Wallet B was not used in the clean publisher-only lifecycle
above, then submitted the finalized zero-value epoch-3 acknowledgment
`0xefb3e3cec4fa655acbc88072574ee6effe5d933ccc7b4f3a20f4aec1631c1209`; the
canonical history index is 1. No participant funds were accepted.

Older Program 1/2 records, the old fixture branch, and the old `0x527d…` signer
are historical evidence only. They do not define the current wallet identities.

### Release boundaries

This is zero-value Studionet evidence for the merged V4 noncustodial release.
Escrow and custody are absent. Only zero-value Registry writes are available;
no user funds were accepted. PR #1 merged into `main` as
`c38a61620a1a0625454e7b710272bea441ae4ecb`. Post-merge CI run 98 passed, and
Vercel production deployment `dpl_5rEFtXczB3meKeHNW46MUNMCCQ1w` is READY and
promoted at `https://the-revigate.vercel.app`. The 52-scenario matrix,
independent security review, extension-level wallet rejection/disconnect
coverage, and historical observer terminal-finality gap remain disclosed
limitations. The GitHub-verified prompt-injection assessment itself is complete
with an actual `NONMATERIAL` result on the historical Wallet A fixture. The
active V4 lifecycle above uses the archived fixture and has separate canonical
readbacks; the two records must not be conflated.
