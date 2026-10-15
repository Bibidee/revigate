# Test matrix status

The local suite currently passes 23 JavaScript tests and 52 Direct Mode tests.
The checks were rerun on 2026-10-15 after the latest browser evidence update:
23 JavaScript tests, 52 Direct Mode tests, typecheck, lint and production build
all passed.
The Direct Mode tests now target the single active `contracts/revigate.py` and
cover rulebook authentication, revision states, funding validation,
refundable credits, acceptance, refunds, exits, maturity, mutual closure,
withdrawal accounting and bounded pages.

The hosted 52-scenario matrix is **OPEN**. A real Brave/Rabby check passed
app-level disconnect, reconnect and refresh recovery. The corrected public
preview connected Wallet A on Studionet, checked the configured contract
identity, registered and verified Program 3, and completed actual NONMATERIAL,
MATERIAL and ambiguous assessments. The NONMATERIAL assessment included a
genuine validator disagreement. Account switching and the wrong-network guard
now have live PASS observations on the corrected preview; the network switch
was accepted, so a rejected switch and an actual Rabby transaction rejection
remain unrecorded. Mobile layout still needs fresh extension evidence.

The latest read-only Wallet B recheck read Program 3 as VERIFIED at epoch 3,
confirmed two material events and no pending review, and returned zero wallet
credit with an empty offer index. This is preserved in
`evidence/local-browser/2026-10-15-wallet-b-readonly-recheck.json`.

Payable failure recovery is a reproduced FAIL rather than an unexecuted test:
Studionet retained attached value while rolling back storage accounting after
an execution error. Wrong-method and no-calldata incoming value were also
retained without an attributable ledger credit. Outbound delivery has one
historical one-wei recipient delta, but ambiguous-delivery recovery is not
proved and no replay is authorized. These failures block funded testing on the
current candidate.
Local tests and the production UI check use no funded lifecycle and cannot
substitute for those hosted results.

No production funds were accepted. Production writes remain locked.
