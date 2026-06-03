# Plan: budget + ledger redesign (stable, ledger-as-source-of-truth)

**Status:** Phase 1 + reconciliation IMPLEMENTED (dual-write, additive, not yet deployed).
Decision §9.1 resolved: **unified ledger** (`Transaction.kind: credit|debit`, accruals use `direction:"none"`).
Remaining (not started): admin UI repoint + revenue report, backfill/cutover, retire legacy collections, fulfillment-aware `createDeliveryNote` rendering.

**Implemented files:**
- `ledger/types.ts`, `ledger/services/postTransaction.ts`, `ledger/events.ts` — `kind` + debt types + `direction:"none"`.
- `ledger/subscribers/postDebitOnDeliveryNoteCreated.ts` — debit on DN created (B2B, fulfilled amount).
- `budget/services/applyLedgerProjection.ts` + `budget/subscribers/updateProjectionsOnTransactionPosted.ts` — orgBalances + revenueRollups projections.
- `budget/services/reconcileProjections.ts` + `budget/api/reconcileBudgetProjections.ts` (admin callable) + `budget/triggers/reconcileProjectionsSchedule.ts` (nightly) — rebuild/backfill/parity/self-heal.
- Tests: `applyLedgerProjection.test.ts` (7), `reconcileProjections.test.ts` (4).

---


**Why:** the current budget module is unstable. Debt is incurred at `order.placed` on the *original* `cartTotal`, but an order isn't final at placement — it gets **picked, edited, or cancelled**, and the amount changes. So debt is anchored to a moving target → stale debt, reversals that reverse the wrong amount, snapshots that drift with no self-correction, and noisy J5 over-reductions. Root cause: **debt is created too early, on the wrong amount.**

This redesign also unlocks **financial reporting** (total earned, per month/year, by payment method, per org) — which the current model can't do.

---

## 1. Core principles

1. **The ledger is the single source of truth** for all money movement — both **payments (credits, money in)** and **debts (debits, money owed)**.
2. **Debt is incurred at *fulfillment*** (delivery note / invoice), on the **fulfilled** amount — never at order placement.
3. **Balances + reports are projections** of the ledger (cached rollups), **rebuildable** by a nightly reconciliation job → self-healing, can't silently drift.
4. **J5 (card) orders never create debt** — they're paid at approve; the budget tracks credit/external orders only.

```
                 ┌─ direction:in, group by yearMonth   → Revenue reports
LEDGER (truth) ──┼─ direction:in, group by type        → J5 vs external split
                 └─ debits − credits, group by org      → Budget (accounts receivable)
```

---

## 2. The ledger transaction (extended)

Today the ledger records only **money in** (`hyp_capture`, `hyp_direct`, `hyp_j5_auth`, `manual`). Add a **debit** concept so AR lives in the same log.

`Transaction` (existing, extended):
```
{
  id, dedupKey,
  kind: "credit" | "debit",            // NEW: credit = money in/owed-reduced; debit = owed-increased
  type: "hyp_capture" | "hyp_direct" | "hyp_j5_auth" | "manual"   // payment instrument
      | "delivery_note" | "invoice" | "credit_note" | "adjustment", // NEW: debt sources
  amount,                               // integer agorot, always positive
  currency: "ILS",
  direction: "in" | "out",             // money flow (in=received, out=refund)
  payer: { organizationId?, clientId?, billingAccountId? },
  reference: { type: "order"|"refund"|"adjustment", id },
  createdAt,                            // epoch millis
  yearMonth,                           // "2026-06" Asia/Jerusalem (grouping key)
  actor, hyp?, ...
}
```
- **credit** rows reduce what an org owes (a payment) and/or count as revenue.
- **debit** rows increase what an org owes (a delivery note / invoice issued on credit terms).

> Decision needed: extend the existing `Transaction` with `kind`, or keep payments as-is and add a parallel debit entry. Recommended: one `Transaction` with `kind` — one log, simplest reporting.

---

## 3. Flows

### External (credit terms) — the only case with budget debt
```
order.placed              → nothing (no debt)
admin approves → delivery note created
   → post DEBIT transaction { kind:"debit", type:"delivery_note", amount: FULFILLED total, payer.org }
      → org owes the fulfilled amount (post-picking — stable, final)
payment recorded (manual / transfer)
   → post CREDIT transaction { kind:"credit", type:"manual", direction:"in", payer.org }
      → org debt reduced; counts as revenue
```

### J5 (card) — paid at approve, no debt
```
order.placed              → J5 hold (auth)  (hyp_j5_auth may be recorded for trace, not a debit)
admin approves → charge captures the card
   → post CREDIT transaction { kind:"credit", type:"hyp_capture", direction:"in", payer.org }
      → counts as revenue. NO debit was ever posted → budget untouched.
```
No more clamped over-reductions: J5 simply never creates AR debt.

### Cancel / refund
- Cancel a credit order **before** its delivery note → no debit existed → nothing to reverse.
- Refund after payment → post `{ kind:"credit"? }` ... actually a **refund** = money out: `{ direction:"out", type:"...refund" }`; and if the debt should be restored, a compensating debit. Keep reversal keyed to the specific document (not a blanket org adjustment).

---

## 4. Projections (rollups) — budget AND revenue

Instead of one `organizationBudgets` snapshot, maintain **rollup docs** updated as transactions post (and rebuilt nightly):

- **Org balance** `orgBalances/{orgId}` → `{ owed: Σdebits − Σcredits (clamp ≥0), totalDebits, totalCredits, updatedAt }` (the budget/AR view).
- **Revenue by month** `revenueRollups/{yearMonth}` → `{ totalIn, totalOut, net, byMethod: {hyp_capture, manual, ...}, byOrg: {...} }`.
- (Optional) **Org × month** for per-client statements.

All are **caches** — a scheduled **reconciliation job** recomputes them from the ledger (the existing `rollup*Schedule` pattern), so drift self-corrects.

**Reports answered directly from rollups:** total earned (all-time / per month / per year), J5-vs-external split, per-org revenue, outstanding AR per org.

---

## 5. Reconciliation (the stability guarantee)
- Nightly scheduled job: for each org, recompute `owed` by summing its ledger rows; overwrite `orgBalances`. Same for `revenueRollups` per month.
- Log any correction (`audit.reconcile.drift`) so drift is visible.
- Result: a missed/duplicated event can't cause lasting wrong numbers.

---

## 6. Idempotency (keep the good part)
- Deterministic dedup keys per source (already in place): subscriber `evt_{subscriber}_{eventId}`, api `idem_{key}`, external `hyp_{verifiedId}`.
- Debit on delivery-note: `dn_{deliveryNoteId}` (one debit per DN). Re-issue → ALREADY_EXISTS no-op.

---

## 7. Migration from current model
1. Ship the new ledger `kind`/types + projections **alongside** the current budget (dual-write or feature-flag).
2. **Backfill:** replay history into the new ledger — for each existing `budgetRecords` row, write the equivalent debit/credit transaction; for delivered/invoiced external orders with no record, derive a debit from the DN/invoice.
3. Run reconciliation → compare new `orgBalances` to old `organizationBudgets`; investigate diffs.
4. Cut admin UI over to the new projections.
5. Retire `increaseDebtOnOrderPlaced`, `reduceDebtOnOrderReversed`, `reduceDebtOnTransactionPosted`, `budgetRecords`, `organizationBudgets` once parity is confirmed (leave inert first).

---

## 8. What changes in code
- **Remove:** `increaseDebtOnOrderPlaced` (debt at placement).
- **Add:** debit posting at delivery-note/invoice creation (`createDeliveryNote`/`createInvoice` → post `kind:"debit"`); this also requires the **fulfillment-aware** DN (drop missing, render substituted — see `order-picking-flow.md`).
- **Keep/adapt:** payment → credit (today's `transaction_posted` path), now just "post a credit", budget reduction becomes a projection.
- **Add:** rollup updaters + nightly reconciliation jobs.
- **Core:** extend `Transaction` schema (`kind` + debt `type`s).

---

## 9. Decisions / open questions
1. **One `Transaction` with `kind`** (recommended) vs separate debit entity?
2. **Debit trigger:** delivery note, invoice, or both? (External flow currently creates a DN on approve; invoice is separate.) Likely **DN = debit** for credit orders, invoice references it.
3. **Refund semantics:** money-out credit + compensating debit, keyed to the document.
4. **VAT:** debit amount = fulfilled total **incl. VAT** (matches what the customer owes); revenue reports may want a VAT split (`amount` vs `vatAmount`).
5. **Rollup granularity:** month + org enough, or also day / billing-account?

---

## Related plans (this ties them together)
- `docs/plans/order-picking-flow.md` — fulfilled total (debit must use it).
- `docs/plans/invoice-flow-adaptation.md` — DN/invoice/receipt entities (where debits are posted).
- `docs/plans/budget-cart-edit-sync.md` — becomes **obsolete** under this design (debt is on the final amount, so no re-sync needed).
- `docs/plans/order-approve-flow.md` — approve is where the DN (→ debit) or charge (→ credit) happens.

## Key files (today)
- `functions/src/modules/budget/` — subscribers (`increaseDebtOnOrderPlaced`, `reduceDebtOnOrderReversed`, `reduceDebtOnTransactionPosted`), `services/applyBudgetEvent`, `internal/`.
- `functions/src/modules/ledger/` — `services/postTransaction`, `types.ts`, `events.ts`.
- `packages/core/lib/entities/{Budget,Ledger?,Order}.ts`.
- `functions/src/appApi` / `apps/store/src/pages/admin/AdminBudgetPage` — admin views (re-point to projections).
