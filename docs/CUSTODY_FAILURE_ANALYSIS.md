# Custody Failure Analysis

**Verdict: NOT COMPLETE. Custody stays disabled.** This record separates the
behavior observed on disposable Studionet contracts from the current local
source changes. No GEN was sent to the deployed two-contract candidate pair.

## Studionet behavior by route

Network: GenLayer Studionet, chain `61999`, RPC
`https://studio.genlayer.com/api`; repository-local CLI `0.39.1`.

| Route | What was observed | Classification | Disposition |
| --- | --- | --- | --- |
| Intended payable `fund_offer` with unknown offer | The pre-accounting-patch Vault source was deployed to an isolated probe; 1 wei to unknown offer 999999 finalized with execution SUCCESS and balanced caller credit. One withdrawal parent and child finalized, and the signer balance increased exactly 1 wei. | Supported payable method with ordinary validation rejection and one observed EOA delivery. The probe record remains UNKNOWN_DELIVERY. | The bounded return path was live-tested once on the pre-patch source; this does not bound failed execution or provide objective contract-side receipt recovery. See [Studionet evidence](STUDIONET_EVIDENCE.md). |
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

Direct Mode assertions cover these branches. The pre-accounting-patch Vault
source was deployed byte-for-byte to a separate isolated Vault
`0xfDA04A975d1467580C6c16eb8cCD576fec4076Af` with custody enabled only for a
controlled one-wei probe. `fund_offer(999999)` finalized with execution success;
the Vault recorded `received=1`, `claimable=1`, `wallet_credit=1`,
`unassigned_surplus=0`, and `liability_shortfall=0`. This closes the specific
ordinary unknown-offer path for that single live transaction.

One withdrawal then finalized with a finalized child transfer and an
independently observed +1 wei signer balance delta. The old contract still
records `UNKNOWN_DELIVERY` and `transfer_pending=1`. Its `liability_shortfall=1`
was a **false-positive accounting classification**, not missing GEN: the
Vault's current held and claimable amounts were both zero, the emitted child
had already debited the Vault, and the recipient balance rose by exactly one
wei. No retry was sent. The isolated probe is not a paired candidate or release
deployment.

The current local candidate corrects the balance comparison in `get_ledger()`. Its
`backing_liabilities` and compatibility field `accounted_liabilities` are
`held + claimable`; `liability_shortfall` is the positive difference between
that amount and the observed Vault balance. `unassigned_surplus` is balance in
excess of those still-held claims. `transfer_pending` and `unreconciled` keep
emitted but unverified obligations visible; `outgoing_emitted` preserves the
cumulative emitted amount; `delivery_verified` and `delivery_failed_proven`
remain zero because the contract has no authenticated transition for either
state. `reconciled_total` includes held backing plus unresolved outgoing value,
and `reconciliation_delta` checks that against recorded incoming value.

The accounting correction has passed Direct Mode regression tests but has not
been deployed. The custody-disabled source-exact pair and the isolated live
probe still run the prior ledger formula; the one-wei discrepancy above is
historical evidence for the bug. This change does not recover the one wei
stranded after a payable execution rollback, no-calldata incoming transfers,
or value attached to a nonpayable method. Such retained value is unassigned
surplus, not a shortfall in correctly backed held claims, and remains a custody
blocker until recovery is proved.

The frontend now has a separate read-only observer status. GenLayerJS can query
the parent and triggered child transactions; one matching finalized successful
child is reported as external delivery evidence. Missing or delayed child data
stays unknown. A failed child is not treated as proof the recipient received
nothing, and duplicate matching children are called out. No observer result
updates contract state or authorizes automatic retries. The Studionet RPC could
not be reached from this session, so the new observer path still needs runtime
verification against the pinned SDK/network combination.

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

The latest source-exact pair remains custody-disabled with zero ledger state.
No user deposits, payout, or refund lifecycle is authorized by this evidence.
The ordinary unknown-offer route has now been live-tested once, but the release
gate remains failed until failed payable execution and no-calldata value have a
runtime-supported safe disposition, outgoing failures can be recovered without
resending unknown transfers, and recipient delivery can be reconciled by the
contract from independent evidence. The GenLayerJS observer is frontend-only;
it does not resolve the on-chain record or prove failed-transfer recovery. If the runtime cannot meet those
conditions, keep custody disabled and report that limitation.
