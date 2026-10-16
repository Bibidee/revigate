# Implementation status

Recorded 2026-10-16 on `feat/revigate-clausebid-standard-release`, based on
`origin/main` `5922d7c15d67479d9a9838f2b88bd38b9f753aef`.

## Current architecture

`contracts/revigate.py` is the single Intelligent Contract. It retains signed
GitHub source authentication, GenLayer materiality consensus, acknowledgments,
and the historical agreement ledger. The current deployment is a disposable
Studionet test deployment with `custody_enabled=true` and `public_custody=true`.
That flag enables the controlled test only; it is not a production-safety claim.

## Local verification

- JavaScript tests: 23 passing.
- Direct Mode: 46 passing.
- TypeScript, ESLint and production build: passing.
- Source uses repository-local GenLayer CLI `0.39.1` only.
- The frontend accepts human GEN amounts and dates, gates actions from canonical
  offer state, records pending hashes, observes finality, and never replays a
  transfer automatically.

## Exact deployed source

- Network: GenLayer Studionet, chain 61999.
- Address: `0xb875126Ab537327d9E7E87488C89668C071d2997`.
- Deployment transaction: `0xc446c989dd4da9954d9e9aedb4eacf999d8462fa4681dcc0c17dba50a54b84fe`.
- Source SHA-256: `A7859429ACAEAEA10C5E376E5A3B851920C0BC5DB9C2C0FAF72D7EE793C5C0C2`.
- Attestation: exact local source match.

## Hosted funded demonstration

The signed baseline was registered and verified at epoch 1. A 0.000001 GEN
offer was funded, accepted by the nominated participant, and bound to the
exact baseline terms. The material candidate produced an actual `MATERIAL`
consensus and advanced the program to epoch 2. The participant reaffirmed the
new rules, material exit allocated 0.0008 GEN to publisher A and 0.0002 GEN to
participant B, and both controlled wallets submitted one withdrawal.

Canonical post-state is `MATERIAL_EXIT_ALLOCATED`, held `0`, credits `0`,
dispatched `1000000000000`, and accounted `1000000000000` wei. The observed
recipient balance deltas exactly match the two allocations and the contract
balance read `0`. The runtime still does not expose a separately verifiable
child transaction identity/finality record; transfer records therefore remain
`DISPATCHED_PENDING_EXTERNAL_SETTLEMENT`. Recipient deltas are observations,
not a certification of every exceptional transfer path.

Exact hashes and readbacks are in
[the public-enabled funded demo evidence](../evidence/single-contract/2026-10-16-public-enabled-funded-demo.json).

The corrected frontend was promoted to Vercel production as deployment
`dpl_AswPntt31tSXGzDGzDNK8oLQhLMU`, aliased at
`https://the-revigate.vercel.app`. The root, `/agreements` and `/about` routes
returned HTTP 200, and the current contract address was found in the deployed
JavaScript bundle.

## Release boundary

This is a public-enabled **Studionet test demo**, not a production custody
release. Do not accept user funds. Unsolicited native value, value attached to
unsupported methods, failed payable execution, and unavailable child execution
proof remain protocol-level limitations. No automatic transfer replay is
authorized. A real browser wallet-extension run and independent security review
were not completed in this automation pass.

The previous V4/Vault deployments and older funded evidence remain historical;
their addresses must not be substituted for the exact deployment above.

GitHub Actions CI run 120 passed for the final release tree at head `2aca3a1d2ee4202404331d0aa4b9ae133b580057`.
The current draft is [PR #5](https://github.com/Bibidee/revigate/pull/5).
