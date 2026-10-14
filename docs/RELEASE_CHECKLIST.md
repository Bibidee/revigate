# Revigate V1 release checklist

**Current verdict: NOT COMPLETE.** Studionet deployment evidence is preserved.
The corrected Vault is deployed on a separate custody-disabled test address,
but the main reciprocal pair still uses the earlier source. Custody failure
recovery, a signed two-wallet lifecycle, complete browser acceptance,
independent audit and branch protection remain open.

## Source and local verification

- [x] Revigate Registry/Vault implementation and `revigate` branding.
- [x] Lockfiles and local dependencies present; clean install previously passed.
- [x] Repository-local GenLayer CLI `0.39.1`; production network guard restricts
  writes to Studionet chain `61999`.
- [x] Current local `npm run preflight` with host permissions: network guard, TypeScript, lint, 32
  JavaScript, 8 Python, 93 Direct Mode tests, and production build of all 10
  routes passed. The sandboxed prerender worker fails `EPERM` creating `.next`
  directories.
- [x] GitHub Actions run 11 passed for candidate implementation commit
  `8aa8f9674383c1df6d3c2a582e3b9883cdfd6b14`, including clean dependency
  installation, full preflight, and production dependency audit.
- [x] GitHub's Vercel check is green for the candidate implementation commit;
  the Vercel details endpoint returned 403, so its exact preview URL/state was
  not independently inspected. Production remains locked and unbound.
- [x] Full `npm audit`: zero vulnerabilities with UUID `11.1.1` override;
  GenLayer CLI `0.39.1` and Dockerode `4.0.12` retained.
- [ ] Complete T01–T52 evidence matrix. Current counts: 27 PASS, 20 PARTIAL,
  2 FAIL, 2 BLOCKED, 1 NOT EXECUTED.
- [ ] Fresh independent hostile production audit.

## Studionet candidates and tests

- [x] Latest deployed source-exact pair (before the local accounting patch)
  deployed and finalized on Studionet 61999:
  Registry `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE`, Vault
  `0xf390D8D77f21710679a72Fc11b84A5e85a318849`.
- [x] Exact deployed source hashes, reciprocal config, custody-disabled state,
  zero ledger, and address-encoded `get_wallet_credit` read verified.
- [x] Fresh disposable emitter Registry paired with the previously
  source-exact Vault:
  authenticated child, duplicate no-op, stale nonce, spoof rejection, and
  unrelated-wallet rebind rejection finalized with expected state.
- [x] Isolated one-wei unknown-offer payable path returned to a balanced caller
  credit; one withdrawal child finalized and recipient EOA balance increased
  by one wei. The reported one-wei shortfall was a false positive, not missing
  GEN, because the old calculation counted emitted value as still Vault-backed.
- [x] Deploy the corrected Vault source to a separate custody-disabled test
  address and attest exact source SHA256, finalized transaction, config, and
  zero initial ledger readback. The contract is not paired or app-bound.
- [ ] Exercise the corrected backing formula against nonzero live liabilities.
  The pinned CLI `write` command hardcodes `value: 0n`, so no payable test was
  submitted. Read-only RPC is reachable from the approved host path.
- [ ] Resolve failed payable execution and no-calldata value retention; a
  nonpayable-value route remains unsafe as well.
- [ ] Recover failed outgoing transfers and reconcile delivery from objective
  evidence without resending an unknown transfer.
- [ ] Run signed-source live program verification and full Wallet A/B/C
  lifecycle with funding, acceptance, revision, refund, material exit, maturity
  payout, and recipient balances.
- [ ] Prove the actual source Registry emits authenticated notifications from a
  verified signed program; the current hosted emitter is a test harness.
- [ ] No critical custody risk remains.

## Frontend and release controls

- [x] Production `https://the-revigate.vercel.app/publish/` browser check shows
  no pair configured and all contract actions locked.
- [x] Current commit preview `dpl_9PkMxvVokGXKEJDeSB6YCDqoBwBo` is READY.
- [PARTIAL] Offline fake-wallet coverage now exercises account/network races,
  rejection, finality classes, pre-hash rejection, persisted hash recovery,
  and address-scoped storage. Actual browser-wallet extension interaction,
  visual route checks, and refresh in a real browser remain outstanding.
- [ ] Production contract binding to an approved final pair; keep addresses
  unset and all writes locked.
- [x] Existing remediation branch pushed; PR #1 is open as a draft; GitHub
  Actions run 9 passed for commit `ba3ad9a83178bede7b27864d7d5c5cdded872694`.
- [ ] Signed source commit. Current commit is unsigned; no local signing key or
  configuration is available. No signed rulebook manifest/source has been
  published or verified.
- [ ] Main branch protection and required status checks. Branch-protection API
  returned 403; repository rulesets list was empty.

Keep the production address unset and contract mutations locked until all
critical custody, message, source and lifecycle gates pass. A deploy, build,
pairing transaction, or isolated one-wei result does not clear those gates.

Status definitions:
- COMPLETE requires all critical custody, source, lifecycle, frontend and
  release requirements to be proven.
- COMPLETE WITH MANUAL ACTION is only for a safe verified release with a
  specific noncritical external action remaining.
- NOT COMPLETE applies while custody, source identity, lifecycle, audit, or
  another critical requirement is missing.
