# Revigate

Revigate is a GenLayer application for authenticated rulebooks, participant acknowledgments, revision materiality and native GEN offers in one Intelligent Contract. The active source is `contracts/revigate.py`; the earlier Registry candidate is retained under `contracts/archive/` as historical evidence.

## Current contract model

The single contract binds a publisher-funded offer to a verified rulebook epoch. It supports exact-value funding, participant acceptance, decline and expiry refunds, material exits, maturity allocation, mutual closure, wallet credits and one-use withdrawal records. Every financial transition conserves the contract ledger. Outbound transfer records deliberately remain `UNKNOWN_DELIVERY` until an independent recipient balance observation exists.

The payable entry point credits nonzero payments before ordinary validation so wrong amount, wrong sender, duplicate and late funding can become an explicit wallet credit. This is a bounded application mitigation. It does not prove that protocol-level execution rollback or unsolicited native transfers are recoverable on Studionet. Production custody stays locked until those runtime paths and recipient delivery are independently verified.

## Active implementation

- `contracts/revigate.py` — the only deployable contract.
- `components/contract-workbench.tsx` and `lib/genlayer.ts` — wallet actions, native-value submission and canonical transaction recovery.
- `tests/direct/` — source-authentication, revision and escrow state tests.
- `docs/IMPLEMENTATION_STATUS.md` — exact release state and evidence.

Network: GenLayer Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`. Never send funds to archived addresses.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
```

Repository: [Bibidee/revigate](https://github.com/Bibidee/revigate)
