# Plan — Fix payment confirmation & order-status transitions

Status: DRAFT for review (Philip). No code written yet.

## TL;DR

Paid orders are stuck at `status: pending` / `paymentStatus: pending_j5` because the
**storefront checkout still runs the legacy client-side payment path**, while the
**correct server-side, signature-verified, ledger-integrated path already exists and is
deployed but is never called**. The fix is primarily a **migration/cutover**, plus a
one-time **backfill** of already-paid orders. Very little net-new code.

Live evidence (prod `jsdev-stores-prod`, `balasistore_company/balasistore_store`):
`hbYRg7vlLsn3ySQcbYXI` (1,334.48 ₪) and `RgyCzLGlIVmZYglhWlfW` (3,364.08 ₪) — both
paid 2026-05-20 (HYP `CCode=0`, `errMsg=תקין`), still `pending_j5`.

---

## Problems

### P1 — Order status is written client-side from unsigned HYP params (security + correctness)
- **Current:** `apps/store/src/pages/store/OrderSuccessPage/OrderSuccessPage.tsx` reads
  `window.location.href` query params (HYP redirect) and calls client-side
  `appApi.onOrderPaid(payment)` (`apps/store/src/appApi/index.ts:~1628`), which writes the
  order doc directly.
- **Why wrong:** the HYP `Sign` is never verified. The order/payment state is set from
  spoofable URL params. (Maps to OWASP A01/A08 and §11 of the architecture brief.)

### P2 — Direct-link payment success never transitions the order to paid (THE bug)
- **Current:** `onOrderPaid` hard-codes
  `paymentStatus: store.paymentType === "external" ? "external" : "pending_j5"` and
  `status: "pending"` on **every** return — even a successful direct charge (`CCode=0`).
  Nothing else flips a direct-link order to `completed` (only the J5 capture path does).
- **Why wrong:** "use state machines, not booleans" (§5/principle #7). There is no guarded
  `authorized → paid` transition for the direct-charge case; the success result is ignored.

### P3 — Dual-write with no atomicity and no compensation
- **Current:** `onOrderPaid` does two sequential client writes (order doc, then
  `payments/{orderId}` doc). A crash/abort between them, or an order-write failure after the
  money was taken, leaves money captured with no consistent order state — and there is no
  compensation path.
- **Why wrong:** classic "payment succeeded but order not persisted" dual-write (§5/§7).

### P4 — Two competing sources of truth for money
- **Current:** legacy direct payments live in `{c}/{s}/payments/{orderId}`; the new flow
  records money in the ledger `{c}/{s}/transactions` (double-entry, idempotent). Today they
  diverge — the ledger has nothing for these orders.
- **Why wrong:** the ledger is meant to be the single immutable source of truth (§6); a
  parallel `payments` collection that drives status independently defeats that.

### P5 — Already-paid-but-pending orders need remediation (data)
- At least the two orders above; likely more for the same org / other balasistore orders.
- These customers **were charged**; the orders just never reflected it.

### Out of scope here (tracked separately in `TODO.md`)
- Firestore security-rules rewrite (the `if true` catchall — §11 A01).
- `emit()` call-site audit for true-outbox atomicity (only relevant once we touch those paths).

---

## Target flow (reuse what already exists — do NOT build new)

**Direct charge:**
`createHypDirectPaymentLink` (server, creates single-use link + HYP URL)
→ customer pays on HYP → redirect → **`recordHypDirectPayment`** (server: VERIFY `Sign`,
cross-check `Masof`, post `hyp_direct` transaction idempotent on `hyp_{Id}`, consume link)
→ **`markOrderPaidOnTransactionPosted`** maps `hyp_direct → completed`.

**J5 (auth + capture):**
J5 link → **`recordHypJ5Auth`** (posts `hyp_j5_auth` → `pending_j5`) → admin approve →
**`captureHypJ5`** (posts `hyp_capture` → `completed`).

All of these functions exist under `functions/src/modules/ledger/api/` and are exported in
`functions/src/index.tsx`. The storefront simply isn't calling them.

---

## Phased plan

### Phase 0 — Discovery / confirm (no code)
- Map every client call site of the legacy path: `OrderSuccessPage`, `PayRedirectPage`
  (`usePayRedirectPage.ts`), `AdminOrderPageNew.tsx` (`createPaymentRedirect`),
  `appApi.onOrderPaid`, `appApi`/`api.ts` `createPayment` / `createPaymentRedirect` /
  `getPaymentRedirect`.
- Confirm the **direct-vs-J5 discriminator** the new link flow expects (store config? a
  field on the created link record? `createHypDirectPaymentLink` vs the J5 link creator?).
- Decide the rollout unit: per-store flag (start with a test store, then balasistore).

### Phase 1 — Wire storefront checkout to the new server flow (behind a per-store flag)
- Replace `createPayment` link creation with `createHypDirectPaymentLink` (direct) /
  the J5 link creator, returning the HYP URL + link token.
- On redirect/success, call `recordHypDirectPayment` (or `recordHypJ5Auth`) with the HYP
  params **and the link token** — server verifies `Sign` and posts the ledger transaction.
- Delete the client-side order/`payments` writes from `onOrderPaid`; the order transition
  now comes only from `markOrderPaidOnTransactionPosted`.

### Phase 2 — Parity + cutover
- Run a test-store checkout end-to-end (success, failure, refresh/double-submit, expired
  link). Verify: ledger txn written once (idempotent `hyp_{Id}`), order → `completed`, no
  client status write.
- Flip balasistore to the new flow.

### Phase 3 — Backfill stuck orders (data remediation — needs explicit approval)
- These were already charged; **no new charge** — we only record the existing money fact and
  let status follow. For each affected order, post a `hyp_direct` transaction from its
  existing `payments/{orderId}` doc via `postTransaction` (dedup `hyp_{payment.Id}`), which
  triggers `markOrderPaidOnTransactionPosted → completed`.
- Scope: scan balasistore for orders with a `payments/{orderId}` doc where `payment.CCode==0`
  but order still `pending_j5`. Dry-run list first, approve, then run.
- Idempotent and safe to re-run (deterministic dedup id).

### Phase 4 — Deprecate legacy path
- Remove/disable `onOrderPaid`, legacy `createPayment`, and the `payments` status path once
  all stores are on the new flow and parity is confirmed. Keep `payments` docs read-only for
  history; ledger becomes the single source of truth.

---

## Risks & decisions needed

1. **Discriminator (direct vs J5):** must be unambiguous before Phase 1. Options: store
   config, link-record field, or HYP `SpType`. Decide in Phase 0.
2. **Backfill = writing money facts** (not charging). Confirm the policy that recording an
   already-captured HYP payment into the ledger is acceptable, and that `markOrderPaid`
   completing these orders won't auto-trigger an unwanted side effect (e.g. a second
   delivery note / invoice). Verify the order→completed subscribers before running.
3. **No double-charge / double-record:** rely on `hyp_{Id}` dedup; never post without it.
4. **Deploy gate:** functions + store deploy require explicit approval (no auto-deploy).
5. **Other stores:** confirm pecanis (`external`) and tester (`j5`) are unaffected before
   touching shared code paths.

## Suggested sequencing
Phase 0 → review gate → Phase 1–2 on a **test store** → review gate → balasistore cutover →
review gate → Phase 3 backfill (separate explicit approval) → Phase 4 cleanup.

## Pipeline
Per repo rules this is a bug + refactor: bug-postmortem (done informally here) → coder →
code-reviewer → security-auditor → ship. (Agents are paused this session by request; when
resumed, route Phase 1+ through the normal pipeline.)
