# LESSONS

Mistakes and non-obvious fixes from past sessions. Read before starting work.

## Money / HYP payment amount must be `.toFixed(2)` at the boundary

**Symptom:** HYP rejects payment with the red error
"תשובת חברת האשראי: סכום הפריטים אינו תואם לסכום לחיוב" (items sum ≠ charge amount),
off by ~1 agora.

**Root cause:** JS float drift. `16.87 + 24.90 === 41.769999999999996`. If the HYP
`Amount` is serialized with `.toString()`, it sends the long float string; HYP
truncates it (→ 41.76) while summing the `heshDesc` line items (each `.toFixed(2)`)
to 41.77 → mismatch → rejection.

**Fix:** always send `Amount` as `.toFixed(2)` (2-decimal rounded) so it matches the
line items, which are already `.toFixed(2)`. In `modules/payments/api/createPayment.ts`:
`Amount: adjustedAmount.toFixed(2)` (NOT `.toString()`).

**Why it recurs:** this has regressed during refactors (e.g. the May 29 2026 v2
migration, commit 507d7a1, dropped the `.toFixed(2)`). Any code that builds a HYP
amount or sums line items must round at the boundary. The project convention is
integer agorot internally — convert to shekels with `.toFixed(2)` only at the HYP
call site, and keep `Amount` and `heshDesc` item prices rounded the SAME way.

**Note:** the current `Amount` is generated when the payment form is built at
checkout. An already-generated HYP form has the amount baked in — fixing the code
requires a NEW checkout/payment form to take effect (and a deploy).
