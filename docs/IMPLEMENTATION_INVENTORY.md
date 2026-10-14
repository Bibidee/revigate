# Implementation inventory

## Active product

Revigate contains one active Intelligent Contract: `contracts/revigate_registry.py`. It authenticates fixed GitHub rulebook commits, records participant acknowledgments, and classifies publisher submitted revisions. The active application contains no Vault, offer, escrow, deposit, credit, refund, payout, withdrawal, transfer, or cross contract message path.

The frontend reads canonical programs, reviews, material event pages, and wallet acknowledgment pages. It fetches rulebook text from the exact commit recorded by the Registry and verifies the normalized SHA-256 digest before rendering. Every write sends zero native value, persists the returned hash, refuses an identical pending action, waits for finality, and requires a matching canonical readback before reporting success.

## Registry controls

- Studionet chain identity is fixed to `61999`.
- Repository, branch, path, full SHA, branch ancestry, commit tree, Git blob identity, GitHub signature metadata, publisher manifest, UTF-8 normalization, clause structure, and source digest are checked.
- GitHub verification requires `verified=true`, `reason=valid`, and nonempty signature, payload, and verification timestamp fields.
- Revision requests have one pending review, a five minute cooldown, a three attempt cap, and a one day decision deadline.
- `MATERIAL`, `NONMATERIAL`, and `INCONCLUSIVE` remain distinct. Only successful decisions consume a candidate permanently. Only MATERIAL increments the epoch.
- Program, review, material event, and acknowledgment reads are bounded to 50 records.

## Automated evidence

As of 2026-10-14, JavaScript tests pass 10/10 and Direct Mode tests pass 22/22. TypeScript, lint, the Studionet source guard, and the production build pass. Direct Mode uses mocked GitHub and model providers and is not live validator proof.

## Live boundary

DNS and HTTPS connectivity to `https://studio.genlayer.com/api` are available and the RPC returned chain ID `0xf22f`. Registry V2 has not yet been deployed. Genuine GitHub verified fixture commits, hosted lifecycle results, real extension browser tests, fresh CI, and independent security review remain release gates. Production writes stay locked.

Historical custody material remains in explicitly archived documents and Git history as evidence for removing custody. It is not part of the active implementation.
