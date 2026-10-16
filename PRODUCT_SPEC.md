# Revigate product specification

## Product

Revigate is a public record of authenticated program rules. A publisher nominates its wallet in a manifest committed alongside a bounded Markdown rulebook. The Registry verifies the signed GitHub commit and records the exact source digest. Participants can acknowledge a reviewed epoch. Later signed commits can be assessed for material change by GenLayer validators.

## Non-custodial boundary

The product never accepts or holds GEN or any other asset. It does not create financial agreements, promise token entitlements, calculate settlements, issue refunds or initiate transfers. A rulebook may describe an off-protocol benefit, but Revigate only records the source and revision assessment.

## Outcomes

- `MATERIAL`: the active source changes and the program epoch advances.
- `NONMATERIAL`: the active source changes without advancing the epoch.
- `INCONCLUSIVE`: the active source and epoch remain unchanged.

Acknowledgment history is append-only. Material history is bounded and page-oriented reads are bounded.
