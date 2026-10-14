> **ARCHIVED:** This document describes the removed escrow candidate and is retained only as historical security evidence. See [current status](IMPLEMENTATION_STATUS.md).

# Frontend Product, UI Specification and Transaction Experience

## Technology
Next.js App Router + TypeScript, browser-only GenLayer client for state-changing writes, ordinary injected EIP-1193 providers (MetaMask/Rabby compatible). No backend API routes, Next Server Actions for authority, Supabase, Firebase, cron, job queue, cloud AI, server signer, privileged external service or database. Purely static Vercel/Next deployment is acceptable. Verify current Next/React package versions against pinned runtime; Next can be static export only when dynamic routes/client reads are handled properly and build proves they work.

## Visual identity
An editorial reading-room rather than financial dashboard. Blue/ivory primary palette, restrained ink/teal accents, generous typography, document side-by-side compare with clause IDs, softly bordered agreement certificates, legible status hierarchy, spacious desktop and mobile single-column flows. Do **not** clone Vowmark's neon black board, Accordant's yellow acceptance workdesk, Crossbench's court/dispute interface or Patchbound's blueprint engineering workspace.

## Routes and content
`/` — Landing / Reading Room: what is a protected acknowledgment, current program cards, program statistics from bounded chain pages, factual status not promises.
`/publish` — Publisher Studio: program proposal, GitHub source/manifest preflight, verify original program, create named financial offer, fund in separate wallet step, view outgoing offers and revision submission.
`/program/[programId]` — Verified program rulebook: current **reviewed SHA** and epoch, original/mutable publication notice, clause sections, read-only wallet-free view, acknowledge current rules, pending review banner, history.
`/program/[programId]/revision/[reviewId]` — Before/after clause comparison with stable IDs, exact SHA and normalized digests, materiality outcome, difference highlights, original and candidate links, independent validator judgment description, unresolved warnings.
`/agreements` — Wallet role-aware outgoing (publisher) / incoming (participant) / accepted / matured / closed pages, bounded latest-first pagination with separate role lists and `Load older`.
`/agreement/[offerId]` — Financial certificate: exact A/B addresses, principal in GEN and wei, frozen acceptance digest, bound epoch/SHA, funding status, acceptance signature, maturity countdown, protected full claim, predefined exit option with precise A/B allocations, settlement credit/withdrawal/pending status, evidence/explorer links.
`/my-rules` — Wallet acknowledgments and whether still current for each program, including previous signatures in chronological history; distinct from escrow acceptance.
`/activity` — Locally remembered submitted hashes for current wallet/chain/address plus canonical chain reconciliation; refresh and account-switch recovery, manual poll retry without rebroadcast.
`/about` — Trust boundary, real-world limitations, why GenLayer, source host caveats and escrow transfer limitations.

## Wallet, error, fee and finality
- Connect/disconnect (app disconnect must not falsely claim to revoke extension account access), accountsChanged, chainChanged, wrong-network switch/add guidance, no snaps.
- Before funding, show exact GEN escrow `value` separately from protocol gas/fee estimate, lock conditions, beneficiary, deadlines and digest.
- Before acceptance, show full original rules and financial terms; require clear explicit signing action by B, never implicit from browsing.
- Every write exposes a human readable `draft -> wallet signature -> hash -> consensus -> ACCEPTED provisional -> FINALIZED execution result -> LATEST_FINAL canonical readback` progress rail.
- Transaction hash is recorded as soon as returned; tab refresh resumes monitoring same hash, never assumes timeout means no submission.
- For payout show extra rail `allocation -> withdrawal requested -> parent finalized -> outgoing delivery verification/unknown`. Never show 'Funds received' based solely on outgoing message or recipient button.
- Persist only nonauthoritative hash pointers scoped to contract address, chain, wallet and action. Re-read canonical state at startup; reject stale results after wallet/provider changes.
- Use exact values and integer math; never JavaScript float for GEN wei. Show rounding and splits before signing.
- Hide/disable actions by current role and contract state, yet enforce all guards in contract. Link direct explorer and fixed GitHub SHA.
- When source provider fails, show last successfully reviewed version and reason; no fake live freshness.

## Required UI components
`NavigationShell`, `WalletConnect`, `NetworkBanner`, `TransactionLifecycleRail`, `ProgramCard`, `RulebookReader`, `ClauseComparison`, `RevisionStatus`, `PublisherProgramWizard`, `OfferComposer`, `FundingConfirmation`, `OfferTermsCertificate`, `ParticipantAcceptance`, `ExitOptions`, `EscrowLedger`, `ReceiptEvidencePanel`, `WalletActivity`, `PaginationControls`, `ErrorBoundary`, accessible `Loading/Empty/Unknown` states.

## Responsive/accessibility quality
- Test 360px, 390px, tablet 768px and desktop 1280/1440px, no horizontal overflow, keyboard focus, buttons/forms with labels, text contrast, reduced-motion support, no text hidden behind sticky header.
- Before/after diff on mobile stacks vertically with labeled stable clause IDs, rather than tiny side-by-side text.
- Show disabled/rejected-wallet/network/backendless source failure states with actionable wording.
- Avoid a fake 'live now' badge when no verifiable fresh state.

## Interaction completeness
No inert CTA, no demo-only wallet action in production, no hardcoded example agreement presented as actual, no broken static dynamic routes, no secret keys in client environment, no unfunded offer mistaken as protected acceptance, no duplicated payout clicks, no missing loading/error/empty states.
