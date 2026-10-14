# Studionet Candidate Evidence

Recorded 2026-10-14. This is testnet evidence, not a production custody certification.

## Network, source and signer

- Repository-local GenLayer CLI: `0.39.1`; GenLayerJS: `1.1.8`.
- Network: GenLayer Studio / Studionet, chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- Active unlocked test signer: `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`.
- Local Git HEAD at deployment: `5fb3a6d58e2d9c8247570ba7d885592100aa436c`; branch `codex/revigate-remediation-2026-10-14`; remediation source was uncommitted.
- Contract source SHA256 immediately before deployment: `23D7BDE7F55990080B7C4AB761A3C19EFF8912AD44114B64D080604CDA6E0C58`.
- The CLI's account view reported 298 GEN before deployment. No private key or wallet secret is recorded here.

## Current two-contract pair, pairing and source attestation

| Item | Registry | Vault |
|---|---|---|
| Address | 0x4EECe12604bC7444e571999D9F92b951Fcc0F740 | 0xB2ce7E67d2A7766Bb62993aDd37636f0163fAAc5 |
| Deployment transaction | 0xa70dae8864a58749081a3379be2cf031736d6d8580ac44756e71f679ad893558 | 0xf8fe9162f92506d643b25166183f52ae0a63b821c918d20485fa60d7b0f3792c |
| Receipt | FINALIZED, MAJORITY_AGREE | FINALIZED, MAJORITY_AGREE; leader execution SUCCESS |
| Attached value | 0 | 0 |
| Local source SHA256 | 5602F7DEDA868864900D0336E3D25509DDCA6564998E0181C997A2842A4255FA | A6090229AF3F3140A83576C44FC2F13954411F89C617D9FE2283FF827D148EFD |
| Deployed bytes match local source | Yes | Yes |

The read-only attestation script at scripts/attest-studionet-source.mjs fetched each contract's deployed code, hashed it, compared exact UTF-8 bytes with local source, read both configs, and verified chain 61999, reciprocal addresses, and custody_enabled=false. The final on-chain reads returned:

- Registry config: chain 61999, protocol revigate-registry-v1, Vault 0xb2ce7e67d2a7766bb62993add37636f0163faac5, custody disabled.
- Vault config: chain 61999, protocol revigate-vault-v1, Registry 0x4eece12604bc7444e571999d9f92b951fcc0f740, custody disabled.
- Vault ledger: liabilities 0, held 0, claimable 0, transfer pending 0, recipient delivery claims 0, unreconciled 0, native balance 0, unassigned surplus 0, shortfall 0.

The Registry was bound once to the Vault. Reciprocal on-chain configuration confirms the pair, but the bind transaction hash was not captured in the local CLI output and is not supplied here. Configuration readback alone does not prove a child message finalized in the Vault.

An unrelated unlocked wallet attempted to call bind_vault with a replacement address. Transaction 0xa97042009c493ab8d2a84018a7d2c8fb1c755865b4ff833cb956dd043f6eb5ef finalized with MAJORITY_AGREE, leader execution ERROR, and value_credited=false. A subsequent get_config retained the original Vault address. This is a live negative for unauthorized Registry rebinding only.

The pair received no GEN and remains a disposable custody-disabled test pair. There is no successful hosted proof of authenticated Registry-to-Vault child execution, exactly-once canonical update, duplicate handling, or delayed/out-of-order behavior. A separate live helper probe intended to test contract impersonation finalized with execution ERROR and invalid_contract absent_runner_comment; no impersonation conclusion is claimed.

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
- The current source was uncommitted at deployment. This test address is not configured in production and must not hold user funds.
- An earlier candidate at `0x2bb820945Be33f06c0F0E66dEC3c620cDAA6f995` (tx `0x5c4c535ef7ea5d297369243ee845781546ca7e9da53b700db69f8c300c6c64ed`, source hash `F110ACF95D892DFA76E90239605C5E2E7E47C1EE79E862723BD0BFF719820206`) is superseded because its source differs from the current worktree.
- An earlier deployment at `0x89b4B9620Ef81268CE7cE729Bb14a041a1479188` had a storage defect; no user funds were sent to it. Do not use either older address.
- GenLayer documents that failed internal child value-transfer transactions do not automatically return the value, and Studio does not implement Ghost Contracts for external messages. This contract has no internal value-bearing child transfer path; the live external EOA success case above does not establish failed-delivery recovery. See [GenLayer value transfers](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers) and [messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages).
