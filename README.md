# Revigate V1

Revigate is a backendless GenLayer application for versioned program rules and participant-specific GEN entitlements. The product name, npm package, Python project, and contract are named `revigate`.

## Release status

**NOT COMPLETE.** A separate Registry and Vault have been implemented and deployed to Studionet 61999 with custody disabled. Their deployed source bytes match the local files and each stores the other's address. A disposable Registry emitter paired with the current-source Vault proved an authorized child update, duplicate no-op, stale nonce rejection, spoof rejection, and unauthorized rebind rejection; the exact-source Registry has not yet emitted a child from a verified signed program. The site at [the-revigate.vercel.app](https://the-revigate.vercel.app) remains unbound with contract actions locked.

Studionet probes have shown that value can remain in a contract without a ledger entry after a payable error, a no-calldata transfer, and value sent to a nonpayable method. In a separate one-wei test on the current Vault source, an unknown-offer payable call created a balanced caller credit and a withdrawal child increased the test EOA balance by one wei. The contract record remained `UNKNOWN_DELIVERY`; that does not establish failed-transfer recovery or receipt by arbitrary contract recipients. No GEN was sent to either custody-disabled candidate pair. Do not use any candidate to hold user funds.

## Repository layout

- `contracts/revigate_registry.py`, `contracts/revigate_vault.py`: two-contract implementation candidate.
- `contracts/revigate.py`: preserved single-contract candidate and historical test source.
- `components/contract-workbench.tsx`, `lib/genlayer.ts`: browser wallet, GenLayerJS reads/writes, finality observation, and recovery by the same transaction hash.
- `protocol/accounting.py`: reference accounting model, not production custody logic.
- `tests/direct/`: GenLayer Direct Mode tests against the contract source.
- `evidence/live-message-proof/`: retained test-only Registry emitter and spoof-contract source used for the recorded hosted message proofs.
- `docs/`: product constraints, risk register, release gates, and current evidence.
- `.github/workflows/ci.yml`: reproducible Node/Python checks for pushes and pull requests.

## Network and toolchain

- Studionet only: chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- Repository-local GenLayer CLI is pinned to `0.39.1`; the `npm run cli` wrapper refuses parent or global binaries.
- GenLayerJS is pinned to `1.1.8` and its Studionet chain definition is used for browser access.
- Node.js 20+ and Python 3.12+ are required.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
npm audit --omit=dev --audit-level=high
npm run cli -- --version
npm run cli -- network info
```

`npm run preflight` checks the network lock, TypeScript, ESLint, Node helpers, the Python accounting model, GenLayer Direct Mode, and the production build (the current app routes are prerendered). It does not replace the live Studionet custody proofs, the full 52-scenario matrix, browser wallet acceptance, or an independent production audit.

## Deployment gates

The repository is [Bibidee/revigate](https://github.com/Bibidee/revigate), and Vercel serves the public site at [the-revigate.vercel.app](https://the-revigate.vercel.app). The current pair's addresses, finalized deployment transactions, source hashes, and reciprocal configuration are recorded in [the migration report](docs/TWO_CONTRACT_MIGRATION.md) and [Studionet evidence](docs/STUDIONET_EVIDENCE.md). Contract release remains blocked until custody failure recovery, authenticated child-message proof, the full adversarial matrix, independent audit, signed source publication, branch protection, and live two-wallet tests pass. Read [the current evidence and open gates](docs/IMPLEMENTATION_STATUS.md) before any use.
