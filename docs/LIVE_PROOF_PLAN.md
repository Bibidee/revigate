# Real Studionet Acceptance and Proof Plan

Use GenLayer Studionet 61999 only, through the repository-local CLI 0.39.1 and https://studio.genlayer.com/api. The user has authorized unlocked-CLI deployment and lifecycle work. Do not send value to the current pair: the deployed contracts are custody-disabled test candidates and the runtime's incoming-value accounting failure remains unresolved. Do not fabricate transaction hashes, child receipts, browser results, or claimed finality.

## Latest live work (2026-10-14)

The deployed contract-source commit `ba3ad9a83178bede7b27864d7d5c5cdded872694`
is pushed and its GitHub Actions run 9 passed. The latest source-exact
custody-disabled pair is
Registry `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE` and Vault
`0xf390D8D77f21710679a72Fc11b84A5e85a318849`. Their deployment hashes are
`0x857f02cc8a12c79a2a5cd23cb92e987151f0f80ce5cbf1d8868e961ec2d34c22` and
`0x9e68dc1b03b76388701f36d333aac730ce29de85097568d36f0f337416c3db20`; bind
hash `0x55ff1283efcba6c28c1ddb71a2ff2567fd9df75839c458fff3b9de172e34ef4d`.
The deployed source hashes matched the repository files at that deployment
revision; the local Vault has since changed for the accounting correction.
Config is reciprocal, custody is disabled and the deployed Vault ledger was
zero.

A separate disposable Registry paired with the pre-accounting-patch source-exact Vault finalized
an authorized child snapshot, duplicate no-op, stale-nonce rejection, spoof
rejection and A0 unauthorized rebind rejection. A separate exact-source Vault
received one wei through unknown-offer `fund_offer`, returned a balanced caller
credit, and sent one finalized withdrawal child; the signer balance rose by one
wei. The Vault still records `UNKNOWN_DELIVERY`, and no retry was made. This
does not prove full funding, failed-transfer recovery or a two-wallet lifecycle.
See [Studionet Evidence](STUDIONET_EVIDENCE.md).

The production site `https://the-revigate.vercel.app/publish/` was checked in a
browser and shows no contract pair configured with all contract actions locked.
Production remains on source commit `f73bcb5d5b999224f5343ffb371c29150e57bb92`;
the current commit preview is READY but does not bind contract addresses.

## Earlier limited proof on a prior source revision

Source-exact pair: Registry `0x4C55E4e0ab00C8534B6d4A826620cdb506349B45`, Vault `0xdCa7E9DF49e2773FaEFAD6B27B612BC296C74751`; deploy transactions `0x73a64f695854b54eea242bb88921e768994bce875ce9adaf285c8ec2d14dc3ac` and `0xd573670ccc439863757fb9346e836c88809857608fe31260988cd8f1566e8545`; pairing transaction `0xf14c1fce80975470197d2d9287667644412cb95facf641158a34d9d1be6e2894`. Both deployed bytecodes match the local source exactly; reciprocal config reports chain 61999 and custody disabled. Do not send GEN to this pair.

A separate disposable Registry test emitter paired to the byte-identical source Vault proved an authenticated child, one canonical snapshot update, duplicate no-op, stale nonce rejection, spoof rejection, and unauthorized-wallet rebind rejection. See [Studionet evidence](STUDIONET_EVIDENCE.md) for exact transaction IDs and state readbacks. The source-exact Registry has not yet emitted the tested child itself.

A prior single-contract test proved one 1-wei unknown-offer credit and one EOA withdrawal balance increase. The transfer record remains UNKNOWN_DELIVERY; this proves one success path, not general receipt or recovery. No GEN was sent to the current Registry/Vault pair. Full historic values and reads are in [Studionet evidence](STUDIONET_EVIDENCE.md).

A separate disposable clone of the current contract was given a test-only payable method that credited 1 wei to the ledger and then deliberately failed. The transaction finalized with `value_credited=true`, leader execution `ERROR`/rollback, and the clone retained 1 wei while accounting state was zero. This is a reproduced critical failure. No further variations of this rollback probe are warranted until the custody architecture changes or GenLayer provides an atomicity/recovery guarantee.

A 1-wei no-calldata transfer to the same clone then finalized without GenVM execution and left another wei unaccounted. Studio cannot establish whether a GenLayer Chain `__receive__` handler would execute because Studio does not implement the ghost-contract layer. The current contract remains fail-closed; do not describe a receive handler as a remedy without a chain-supported test.

A 1-wei call carrying value to the nonpayable `create_offer` method also finalized with execution `ERROR` and `value_credited=true`; the disposable clone retained it without a liability. This closes the live T13 attempt as a failure. The three probe transactions and all post-state reads are recorded in [Studionet evidence](STUDIONET_EVIDENCE.md).

An earlier production deployment (`dpl_J4rL77NTRTwc2S4YkiVTKRvizkgv`, source `3ecf429a9dff768b9133dfce9a2243dfcafd6dbd`) was superseded. The current production deployment is `dpl_CPP5aU6zJyiJuwRmfLXzWx8wYriZ`, source `f73bcb5d5b999224f5343ffb371c29150e57bb92`; browser check at `/publish/` confirms no Registry/Vault address and all actions locked. The current candidate commit has a READY preview but no contract pair is bound. No production wallet lifecycle, account-switching, transaction-recovery, or canonical contract-read suite has been run.

An unrelated wallet's live attempt to replace the current Registry's bound Vault finalized with execution ERROR; the binding remained unchanged. This does not prove that another contract cannot impersonate the Registry, nor that an authenticated child message successfully reaches the Vault. An attempted helper contract for those cases failed with invalid_contract/absent_runner_comment.

This remains limited test evidence. No signed-source program verification or two-wallet lifecycle has run. The older single-contract and first-pair candidates described below or in [Studionet evidence](STUDIONET_EVIDENCE.md) are superseded and must not be used.

## Preflight
Verify CLI 0.39.1 as local dependency, target Studionet 61999 (`https://studio.genlayer.com/api`), correct fee profile and sufficient test GEN. Record Git commit SHA and contract source bytes SHA256. Create at least two unlocked/signed test wallets A/B; optionally a third attacker wallet C. Use a controlled public GitHub repository with **genuinely signed, verified** commits and manifest nominating A. Ensure no secrets in git.

## Scenario A — Baseline and normal full payout
- After custody and child-message blockers are resolved in a supported runtime, deploy the final Registry/Vault pair and prove both deployments plus authenticated child finality.
- A proposes/validates program with GitHub baseline SHA; record source digest/epoch 1.
- A creates separate named offer for B with 0.01 or other specifically authorized test GEN, deadline and 20% early exit policy; verify no value transferred during offer creation.
- A funds exactly; confirm finalized contract readback and actual held ledger.
- B acknowledges and accepts exact frozen rules; try A/third wallet acceptance negative tests.
- Advance or set realistic maturity without faking network time, then B claims allocation of 100%; B withdraws; verify actual recipient balance or child transaction independently. Record all transaction IDs, observed confirmations and any unknown-delivery gaps.

## Scenario B — Nonmaterial revision
Using a second funded accepted offer (or program state without changing a resolved offer), A submits signed typo-only candidate SHA. Review in separate tx; expect NONMATERIAL and unchanged epoch. Previously acknowledged B remains current; funding/maturity terms untouched.

## Scenario C — Material revision and early exit
Create a fresh funded accepted B offer; A requests a signed candidate that changes qualification from 14 to 60 days. GenLayer yields MATERIAL and epoch increments exactly once. The previous acknowledgment is stale, but original GEN maturity entitlement unchanged. B exercises the explicitly frozen 20% early exit within window: credit 20% to B and 80% to A. Both withdraw and confirm real delivery independently, no other party can withdraw. Confirm no second payout after eventual maturity.

## Scenario D — Indeterminate evidence + failure recovery
- Authentic source inaccessible, unsigned or malformed. A typed semantic inconclusive may finalize without epoch change; or an actual protocol failure leaves previously finalized PENDING request intact.
- Wait real 24h network time or use Direct Mode clock controls for automated deadline tests; invoke deterministic expiry, confirm old rules remain active and B's already accepted mature claim was never blocked.
- Do not falsify passage of time or mine fake Studionet blocks.

## Scenario E — Refund and mutual closure
- Fresh A funded unaccepted offer, B declines or acceptance expires; A gets exact credit and real refund.
- Fresh accepted offer, A proposes different closure split; B rejects/ignores, proposal expires and B still claims full maturity amount. If both approve exact digest, split executes once and is verified.

## Scenario F — Malicious/invalid funding
- Invalid fund attempt with wrong sender/value and valid `msg.value`: verify actual contract balance and sender-refundable credit or prove the attempt safely rejected without deposit. Direct Mode covers several invalid cases; live payable-error, nonpayable-value, and direct-transfer scenarios all failed accounting. The single-contract escrow is not deployable for user funds on this evidence.
- Attempt failed external transfer where possible safely without real fund risk (Direct Mode plus controlled live boundary), and do not overclaim detection or retry.

## Production browser acceptance

Partial route-only acceptance has been completed on https://the-revigate.vercel.app: all nine application routes rendered at desktop and phone viewport sizes; the expected page headings appeared and no page-level horizontal overflow was observed. The mobile navigation is horizontally scrollable. The release banner says escrow actions are disabled and no production-approved Studionet contract is bound. The production write gate now blocks every contract mutation outside explicit development opt-in.

The remaining acceptance requires a final signed source release and approved contract address, then wallet A/B flows, account/network switching, wallet rejection and provider absence, pending/provisional/finalized/error/readback states, canonical source links, browser logs, refresh recovery and verified recipient delivery. Do not enable funding or withdrawal while custody recovery remains unresolved.

## Evidence table for each transaction
`scenario | actor | contract | function | tx_hash | explorer URL | status | execution result | canonical state readback | before/after GEN value/balance | emitted child/reference | verified recipient credit status | timestamp | exact source commit`.

## Deployment fail conditions
A code change after deployment invalidates prior production certification: redeploy and re-run live evidence, update manifest/website/bindings. Do not claim COMPLETE when unverified money movement, wrong deployed source, failed tests, absent final browser verification, or no relevant live lifecycle.
