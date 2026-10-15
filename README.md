# Revigate

Revigate is a GenLayer application for authenticated rulebooks, participant acknowledgments and revision materiality in a noncustodial Registry. The active source is `contracts/revigate.py`; the former native-GEN escrow source is retained under `contracts/archive/` and historical evidence.

## Current contract model

The active contract authenticates GitHub rulebook sources, verifies revisions and records wallet acknowledgments. It has no payable method, native-value ledger, offer state, wallet credit or withdrawal path. Writes always use zero native GEN. Unsolicited network transfers are outside the application accounting model and are not recoverable through Revigate.

The historical escrow candidate is not deployable for user funds because Studionet retained value across failed payable execution and unsupported transfer routes. Removing native custody is the release safety decision; the old deployment must never be used for deposits.

## Active implementation

- `contracts/revigate.py` — the only deployable contract.
- `components/contract-workbench.tsx` and `lib/genlayer.ts` — wallet actions, native-value submission and canonical transaction recovery.
- `tests/direct/` — source-authentication, revision and noncustodial Registry state tests.
- `docs/IMPLEMENTATION_STATUS.md` — exact release state and evidence.

Network: GenLayer Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`. Never send funds to archived addresses.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
```

Repository: [Bibidee/revigate](https://github.com/Bibidee/revigate)
