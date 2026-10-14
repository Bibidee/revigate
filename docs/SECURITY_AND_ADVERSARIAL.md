> **ARCHIVED:** This document describes the removed escrow candidate and is retained only as historical security evidence. See [current status](IMPLEMENTATION_STATUS.md).

# Security Threat Model and Adversarial Hardening

## Assets
Locked participant GEN, refund credits, wallet authority, accurate rulebook epoch/digest, authenticated publication provenance, honest consensus, transfer receipts and canonical public history.

## Attack scenarios with expected protection
1. Random wallet pretends to be A or B: derive caller from `msg.sender`, reject rights escalation, view-only public reads allowed.
2. B recipient address zero/same as A or malformed: reject before offer creation.
3. A requests withdrawal of B's matured credit: reject; beneficiary allocation immutable.
4. A changes future rules to reduce already locked payout: old entitlement preserved exactly; GenLayer classification cannot change amount.
5. A publishes program rules after B signed, but withholds onchain submission: V1 **cannot discover off-chain source change**; explicitly disclose latest reviewed commit and do not claim automatic monitoring. Existing escrow remains protected.
6. A inserts arbitrary wallet in GitHub manifest: only wallet nominated in baseline verified commit can successfully register via its own signed transaction; provider ownership/authenticity remains an explicit external trust assumption.
7. Unrelated repo, fork or unrelated full SHA: must not pass canonical repo, verified signature and ancestry checks.
8. Fake GitHub JSON or signature fields in Markdown: content is never used as provider metadata.
9. GitHub API HTTP 429/500/404, truncated response, redirect, repo transfer or mismatch: INCONCLUSIVE / do not advance epoch.
10. Markdown prompt injection asks validator to output NONMATERIAL: data isolation and negative tests; validator independently reproduces and compares materiality.
11. Leader says NONMATERIAL but validator independently finds MATERIAL: reject consensus equivalence, preserve pending review if no finalization.
12. A floods request/review to make rules unavailable: publisher-only request, one pending, per-program cooldown, deterministic expiry; existing accepted economic actions never blocked.
13. B submits acceptance using stale epoch or rewritten terms digest: reject onchain and frontend, display clear path to inspect current reviewed terms.
14. Extra, wrong sender or repeat payable funding: sender-refundable credit or safe rejection without unaccounted GEN (must prove live).
15. Attempt to cancel after acceptance: impossible via contract even if UI shows stale state.
16. Attempt to claim twice (maturity after early exit, double withdrawal, overlapping closure): enforce one allocation and one transfer request per credit unit.
17. Partial rounding exploit: `A+B==original` in wei; floor B, remainder A.
18. B sends early-exit claim outside original first-material change window: reject, leave maturity entitlement.
19. A opens closure to trap B matured funds: maturity takes precedence, timed-out closure nonblocking.
20. User changes account/network between async reads: discard stale request results; wrong chain blocks writes and resets relevant caches.
21. Transaction accepted then errors: UI must show execution failure and not claim success.
22. Failed message delivery after parent finalized: track separate delivery, prevent blind duplicate sends.
23. Multiple program/offer indexes exceed thousands: bounded pagination and state correctness after concurrent append.
24. Off-chain screenshot claims 'paid' but recipient didn't receive: child finality alone never means recipient credit; require a separately observed balance delta and preserve its attribution limits.
25. User supplies address to browser local storage to steal authority: local storage never authoritative; identity derived from wallet provider and onchain.
26. Compromised Vercel app: no backend signer/admin keys; show public contract and chain address; does not prevent user phishing, therefore audit package/dependency and transaction details.
27. Negative exit_bps, huge uint, overflow, timestamp wrap or invalid date ordering: deterministic precise bounds, test fuzzer.
28. Unicode confusables in rulebook headers conceal changed clause: reject invalid canonical form or treat semantic ambiguity as INCONCLUSIVE.
29. Same candidate SHA submitted again after conclusive review: replay rejected.
30. Forged recipient confirmation: cannot prove payment delivery, and must not release liability twice or erase unknown transfer.

## Required test styles
Unit/property tests over pure state helpers; GenVM Direct Mode tests using production source; simulator cases for nondeterminism; negative validator judgments including lying leader and evidence conflicts; browser UI/transaction tests; real Studionet two-wallet economic tests; mutation test that kills variants such as removing caller guard, skipping exact digest check and changing payout bps.

## Security release principle
Security is about demonstrable invariants, not achieving arbitrary 5/5 scores or a specific number of tests. Any unresolved HIGH/CRITICAL fund loss, double allocation, unauthorized withdrawal, publisher rewrite or missed recovery is a release blocker. Report remaining medium/low limitations with precise scope and reproducible evidence.
