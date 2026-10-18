# Custody Failure Analysis

**Verdict: TESTNET DEMO ONLY. Production custody is not approved.** The active implementation is
the single `contracts/revigate.py` contract. The former two-contract Vault is
historical reference material only. This record separates behavior observed on
disposable Studionet contracts from the current source. No public user funds
were accepted.

The current exact-source disposable candidate is
`0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684`, source SHA-256
`ED52C6BC82B9A4990DB2A0FC9C6D2C531C0CAEF76BD013124D18CBD0705C6A88`.
The constructor is `custody_enabled=true`, `public_custody=false`. A controlled
555 wei test funding and material-exit regression has completed on this address;
no production or user funds were accepted and no withdrawal was submitted.

## Studionet behavior by route

Network: GenLayer Studionet, chain `61999`, RPC
`https://studio.genlayer.com/api`; repository-local CLI `0.39.1`.

| Route | What was observed | Classification | Disposition |
| --- | --- | --- | --- |
| Intended payable `fund_offer` with unknown offer | The pre-accounting-patch Vault source was deployed to an isolated probe; 1 wei to unknown offer 999999 finalized with execution SUCCESS and balanced caller credit. One withdrawal parent and child finalized, and the signer balance increased exactly 1 wei. | Supported payable method with ordinary validation rejection and one observed EOA delivery. The probe record remains UNKNOWN_DELIVERY. | The bounded return path was live-tested once on the pre-patch source; this does not bound failed execution or provide objective contract-side receipt recovery. See [Studionet evidence](STUDIONET_EVIDENCE.md). |
| Payable call that errors after crediting value | A disposable clone credited 1 wei in storage and deliberately raised an execution error. The value remained at the contract, while all storage accounting rolled back to zero. | Runtime execution failure after a supported payable entry point. | Critical: source ordering cannot restore state that the runtime rolls back. No automatic recovery or credit is claimed. |
| No-calldata value transfer | 1 wei reached a disposable clone without GenVM method execution; no ledger entry or wallet credit was created. | Unexpected/unsupported incoming route. | Studio does not execute the EVM Ghost Contract receive path, so a `__receive__` handler is not a verified fix. The source ledger reports native balance separately as unassigned surplus. |
| Value attached to nonpayable `create_offer` | The transaction finalized with execution error but credited 1 wei to the disposable clone; the offer and ledger stayed unchanged. | Unsupported through the application, but still a reachable public-contract transaction route. | Keeping the UI call nonpayable does not protect a public address from manual callers. The probe demonstrates that wrong-method value can strand and cannot be safely recovered by the current contract. |
| `withdraw_credit` to an ordinary EOA | One historical 1 wei child transaction was returned by the parent ID query with matching child hash, finalized status, Vault sender, EOA recipient and value. The separate historical EOA balance reading showed +1 wei. The current GenLayerJS read omitted the execution result and the RPC returned `Method not found` for `gen_getTransactionReceipt`. The contract record stayed `UNKNOWN_DELIVERY`. | One historically observed balance increase; current observer cannot prove execution success or attribute a balance delta generally. | Keep the observer at UNKNOWN unless exact execution evidence exists. Do not resend unknown transfers. Failed-child recovery, other recipient types, and a general objective receipt query remain unproven. |

The three failure probes left three wei unaccounted in disposable historical
clones; none used the current single-contract candidate. Exact transactions and
post-state reads are preserved in [Studionet evidence](STUDIONET_EVIDENCE.md).

## Current single-contract mitigation

The current single-contract change handles ordinary rejection on the supported
payable route. With custody enabled for a disposable test, `fund_offer` first records nonzero
`gl.message.value` as a refundable credit belonging to the caller. Unknown
offers, wrong funders, duplicate funding, expired funding, and wrong amounts
return a specific marker without raising after value has entered the method.
Only a valid exact-amount payment moves that credit into the offer's held
balance. `get_wallet_credit(Address)` exposes the wallet credit view required
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

The current single-contract candidate corrects the balance comparison in `get_ledger()`. Its
`backing_liabilities` and compatibility field `accounted_liabilities` are
`held + claimable`; `liability_shortfall` is the positive difference between
that amount and the observed Vault balance. `unassigned_surplus` is balance in
excess of those still-held claims. `transfer_pending` and `unreconciled` keep
emitted but unverified obligations visible; `outgoing_emitted` preserves the
cumulative emitted amount; `delivery_verified` and `delivery_failed_proven`
remain zero because the contract has no authenticated transition for either
state. `reconciled_total` includes held backing plus unresolved outgoing value,
and `reconciliation_delta` checks that against recorded incoming value.

The accounting correction passed Direct Mode regression tests and is included
in the exact-source single-contract deployment above. The current V5 hosted
readback now records Program 1 at epoch 3 and Offer 1 as
`MATERIAL_EXIT_ALLOCATED`: deposited 555, held 0, credits 555, dispatched 0,
accounted 555, publisher credit 444, participant credit 111, and native
contract balance 555. The later material event at `1792311710` produced exit
deadline `1792315310`, after the first event's deadline `1792311179` had
expired. The older `deposited=4,331`, `held=555`, `credits=0`,
`dispatched=3,776` readback belongs to an earlier disposable candidate and is
historical evidence. The earlier public-enabled demo is recorded separately in
`evidence/single-contract/2026-10-16-public-enabled-funded-demo.json`.
The formula does not recover value retained after a runtime rollback, no-calldata
incoming transfer, or value attached to a nonpayable method. Such retained value
is unassigned surplus and remains a production custody blocker.

The frontend now has a separate read-only observer status. It validates the
parent-listed child hash against the returned child identity and checks sender,
recipient, exact value and finalized status. It reports child execution only
when the runtime supplies an explicit successful execution result; child
finality alone is not recipient credit. The live pinned-SDK read returned
`result_name=NO_MAJORITY` for the EOA child and omitted the execution-result
field. A read-only `gen_getTransactionReceipt` request returned `Method not
found` on this Studionet endpoint, so the current live classification is
UNKNOWN with the exact child ID preserved. A separately recorded historical
balance delta remains separate evidence and is not generalized to this
observer. Pending, undetermined, cancelled, failed, duplicate and unknown
results remain distinct. No observer result updates contract state or
authorizes a retry.

## Connectivity diagnosis — 2026-10-14

The default restricted process reported DNS “Access is denied,” and its HTTPS
request could not resolve `studio.genlayer.com`. Environment proxy variables
were unset, Windows Internet Settings had proxy disabled/no PAC, and WinHTTP
reported direct access. An approved read-only request from the host resolved
`172.67.210.182` and `104.21.53.84`; HTTPS GET to `/api` returned HTTP 405,
which shows the RPC host is reachable but does not accept GET as a JSON-RPC
request. GenLayerJS read-only calls to the configured Studionet Registry and
Vault succeeded on chain 61999. This is a local sandbox DNS restriction, not a
Studionet outage. No alternate GenLayer network was used.

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

The latest reciprocal pair remains custody-disabled with zero ledger state; the
corrected Vault source has a separate, non-paired custody-disabled test
deployment with a zero initial ledger.
No user deposits, payout, or refund lifecycle is authorized by this evidence.
The ordinary unknown-offer route has now been live-tested once, but the release
gate remains failed until failed payable execution and no-calldata value have a
runtime-supported safe disposition, outgoing failures can be recovered without
resending unknown transfers, and recipient delivery can be reconciled by the
contract from independent evidence. The GenLayerJS observer is frontend-only;
it does not resolve the on-chain record or prove failed-transfer recovery. If the runtime cannot meet those
conditions, keep custody disabled and report that limitation.
