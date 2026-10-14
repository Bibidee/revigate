# Custody Failure Analysis

**Verdict: NOT COMPLETE. Custody stays disabled.** This record separates the
behavior observed on disposable Studionet contracts from the current local
source changes. No GEN was sent to the deployed two-contract candidate pair.

## Studionet behavior by route

Network: GenLayer Studionet, chain `61999`, RPC
`https://studio.genlayer.com/api`; repository-local CLI `0.39.1`.

| Route | What was observed | Classification | Disposition |
| --- | --- | --- | --- |
| Intended payable `fund_offer` with unknown offer | On a disposable single-contract candidate, 1 wei finalized with execution success, returned `REFUNDABLE_CREDIT_UNKNOWN_OFFER`, and produced a 1 wei wallet credit. A subsequent withdrawal child finalized and the EOA balance increased by exactly 1 wei. | Supported payable method with ordinary validation rejection. One successful refund path. | Useful precedent, but one success does not bound failed execution or prove generic receipt recovery. See [Studionet evidence](STUDIONET_EVIDENCE.md). |
| Payable call that errors after crediting value | A disposable clone credited 1 wei in storage and deliberately raised an execution error. The value remained at the contract, while all storage accounting rolled back to zero. | Runtime execution failure after a supported payable entry point. | Critical: source ordering cannot restore state that the runtime rolls back. No automatic recovery or credit is claimed. |
| No-calldata value transfer | 1 wei reached a disposable clone without GenVM method execution; no ledger entry or wallet credit was created. | Unexpected/unsupported incoming route. | Studio does not execute the EVM Ghost Contract receive path, so a `__receive__` handler is not a verified fix. The source ledger reports native balance separately as unassigned surplus. |
| Value attached to nonpayable `create_offer` | The transaction finalized with execution error but credited 1 wei to the disposable clone; the offer and ledger stayed unchanged. | Unsupported/misrouted call, not a legitimate funding action. | Keep offer creation nonpayable and show funding as a separate explicit action. The live probe still demonstrates that attaching value to the wrong method can strand it. |
| `withdraw_credit` to an ordinary EOA | One 1 wei external child transfer finalized and the independent EOA balance rose by exactly 1 wei. The contract's transfer record stayed `UNKNOWN_DELIVERY`. | Supported outgoing route; one observed successful delivery. | Do not resend on unknown status. Failed-child recovery, other recipient types, and a general objective receipt query remain unproven. |

The three failure probes left three wei unaccounted in a disposable clone; none
used the current Registry/Vault pair. Exact transactions and post-state reads
are preserved in [Studionet evidence](STUDIONET_EVIDENCE.md).

## Local Vault mitigation

The current local Vault change handles ordinary rejection on the supported
payable route. With custody enabled, `fund_offer` first records nonzero
`gl.message.value` as a refundable credit belonging to the caller. Unknown
offers, wrong funders, duplicate funding, expired funding, and wrong amounts
return a specific marker without raising after value has entered the method.
Only a valid exact-amount payment moves that credit into the offer's held
balance. `get_wallet_credit(Address)` now exposes the Vault credit view required
by the frontend, and its address argument is encoded as a GenLayer
`CalldataAddress`.

Direct Mode assertions cover these branches. This source change has not yet
been deployed or exercised live. It does not protect against protocol-level
execution failure, `UNDETERMINED`, no-calldata value, or nonpayable value. The
custody-disabled deployments reject the payable route before creating a
liability and must not receive GEN.

The Vault distinguishes user liabilities from unassigned surplus in
`get_ledger()`: `held + claimable + transfer_pending` are liabilities;
`unassigned_surplus` is excess native balance not assigned to a user; and
`liability_shortfall` reports liabilities above the observed native balance.
Surplus is never converted into a refundable credit without an executed,
authenticated accounting path. A failure that preserves value but rolls back
storage can therefore still create unassigned surplus, which is a blocker, not
a recovery mechanism.

## Comparison with existing implementations

### Vowmark

Vowmark's V4 deployment evidence records a rejected payable request that
returned a sentinel result while the transaction execution succeeded. The
commitment counter stayed unchanged, a 0.0001 GEN sender credit was recorded,
and the same wallet later withdrew that credit through a finalized transaction.
This is the basis for Revigate's pre-credit-and-return-marker mitigation for
ordinary invalid inputs. Vowmark's report also says the available runtime does
not provide a reliable child-delivery receipt; its UI/recipient confirmation
does not establish independent receipt by itself. This supports the bounded
deposit pattern, not complete custody certification.

Sources: [Vowmark V4 README](https://github.com/Bibidee/vowmark/blob/main/README.md),
[Vowmark deployment runbook](https://github.com/Bibidee/vowmark/blob/main/docs/DEPLOYMENT.md),
[Vowmark live V4 evidence](https://github.com/Bibidee/vowmark/blob/main/evidence/live_v4_final_submission_2026-10-10.md),
and [Vowmark rejected-value evidence](https://github.com/Bibidee/vowmark/blob/main/evidence/live_v4_final_rejected_value_2026-10-09.json).

### Accordant

Accordant's deployment documentation describes a payable engagement-creation
route, explicit held/claimable/pending-transfer states, and recipient
confirmation before its application reports settlement. Its live lifecycle
report is useful evidence for those flows. A participant's confirmation is
still an assertion by that participant; it does not prove a child receipt to
an independent observer. The available public proof record confirms the
recovery status label but does not replace a runtime guarantee against
post-credit rollback.

Sources: [Accordant deployment record](https://github.com/Bibidee/accordant/blob/master/docs/DEPLOYMENT.md),
[Accordant recovery proof label](https://github.com/Bibidee/accordant/blob/master/accordant-recovery-proof.txt),
and [Accordant contract source](https://github.com/Bibidee/accordant/blob/master/contracts/accordant.py).

## Release rule

The current deployed pair remains a custody-disabled test candidate with zero
ledger state. No user deposits, payout, or refund lifecycle is authorized by
this evidence. Do not enable production writes until the local mitigation is
deployed and live-tested, ordinary invalid payables reconcile to sender credit,
failed payable execution and no-calldata value have a runtime-supported safe
disposition, an outgoing failure can be recovered without resending unknown
transfers, and recipient delivery is independently observable. If the runtime
cannot meet those conditions, keep custody disabled and report that limitation.
