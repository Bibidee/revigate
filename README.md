# Revigate

Revigate is one GenLayer Studionet application and one source-attested Intelligent Contract. The contract combines authenticated GitHub rulebooks, GenLayer materiality consensus, participant acknowledgments, and a deploy-gated native GEN agreement ledger.

## Current contract

- Source: `contracts/revigate.py`
- Network: GenLayer Studionet, chain `61999`
- Protocol: `revigate-registry-v1`
- Contract version: `5`
- Financial mode: constructor-gated `SINGLE_CONTRACT_ESCROW`
- Production mode: public financial writes remain locked; `public_custody` is a frontend availability flag and does not prevent unsolicited network transfers

A custody-enabled disposable Studionet deployment has completed source verification, funded acceptance, MATERIAL exit allocation, unaccepted refund, and the 444 wei maturity payout. Offer 3's separate 555 wei maturity-allocation transaction was accepted by five validators; its post-transaction canonical readback is recorded as pending while the RPC is unavailable. The exact address, receipts and canonical readbacks are in [the funded lifecycle evidence](evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json) and [the Offer 3 claim evidence](evidence/single-contract/2026-10-16-offer-3-maturity-claim.json). The public frontend points at this candidate, but public financial writes remain locked and no user funds are accepted.

The supported payable route accounts the value before ordinary offer validation and returns typed refundable-credit outcomes for invalid offer, sender, deadline, amount and duplicate cases. Withdrawals consume credit once and create a pending external-settlement record. Recipient evidence is recorded as an assertion only; the contract does not infer an EOA balance delta or authorize retries. Unsolicited no-calldata transfers, value sent to nonpayable methods, and failed external delivery remain protocol-level hazards and keep public custody locked.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
```

Repository: [Bibidee/revigate](https://github.com/Bibidee/revigate)
