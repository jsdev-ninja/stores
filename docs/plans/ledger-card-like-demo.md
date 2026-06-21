# Plan: Customer ledger card "like the demo" — full כרטסת

**Status:** Proposed — needs Philip's approval. Requested by David (owner).
**Trigger:** David compared the Balasi admin demo's customer ledger
(`כרטסת לקוח`) to our live one and asked to make ours **identical to the demo**.

> ⚠️ Owner-restricted. The remaining gap is the **financial/accounting heart** of
> the ledger (real balances, invoices/receipts/credits, debit/credit, document-
> creation buttons). Per CLAUDE.md the owner cannot ship money/ledger logic →
> **needs developer sign-off**. The display-only parts are already shipped (below).

---

## Already shipped (owner-safe, live)

Frontend-only, in `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` (`LedgerModal`):

- **Per-account selector** at the top — "כל החשבונות" + a chip per billing account
  (name + number); filters the rows/totals by `order.billingAccount.id`
  ([stores#92](https://github.com/jsdev-ninja/stores/pull/92)).
- **"מספר לקוח"** header now lists the account numbers.
- **"חשבון" column** on each ledger row showing the document's billing account
  ([stores#94](https://github.com/jsdev-ninja/stores/pull/94)).

These reuse data already on the order (`order.billingAccount`). No money logic touched.

## What the demo shows that we still lack

From the demo modal (`demo/.../admin.html`):

1. **Financial summary box** (top-left): `סך חשבוניות`, `תעודות משלוח לא מחויבות`,
   `סך תשלומים`, `יתרה לתשלום`. Live shows `—` for all of these.
2. **Unified document list** — one table mixing **תעודות משלוח + חשבוניות + קבלות +
   זיכויים**, with per-row **חיוב / זיכוי** (debit/credit) amounts and the document
   type as a colored badge. Live loads **only** delivery notes; the
   חשבוניות / קבלות / זיכויים tabs are hard-coded to `(0)`.
3. **Tab counts** (`תעודות משלוח (13)`, `חשבוניות (3)`, `קבלות (1)`, `זיכויים (0)`).
4. **Action buttons**: `+ תעודת משלוח`, `+ קבלה`, `+ זיכוי`, plus
   `הפק חשבונית מרוכזת` (the consolidated-invoice button already works).

## Key finding — the backend data already exists

The accounts-receivable model is already built and is **exactly the shape the demo
needs**. No new schema is required for the summary + debit/credit table.

- **Endpoint:** `documents.getOrganizationBalance` (`functions/src/modules/documents/api/getOrganizationBalance.ts`)
  — admin-claim gated, tenant-scoped, takes `organizationId` (+ optional date range),
  returns `{ rollup, entries }`. **Already exported** from the module's `index.ts`.
- **Rollup** (`TOrganizationBalanceRollup` in `packages/core/lib/entities/OrganizationBalance.ts`)
  maps 1:1 to the summary box:
  - `totalAccrued` → **סך חשבוניות** (total billed)
  - `totalSettled` → **סך תשלומים** (total paid)
  - `owed` → **יתרה לתשלום** (outstanding)
  - `credit` → overpayment credit (if any)
- **Entries** (`TOrganizationBalanceEntry[]`) are the unified ledger table rows:
  - `sign` `"+"` / `"-"` → **חיוב / זיכוי** column
  - `kind` (`accrual` / `settlement` / `adjustment`) + `source`
    (`delivery_note` / `ledger_payment` / `manual` / `order_reversal`) → the row's **סוג** badge
  - `document` `{ type: delivery_note | invoice, number }` → **מס׳ מסמך**
  - `billingAccountId` → **the existing per-account filter applies to the full ledger too**
  - `amount` (agorot) + `createdAt` (millis) → amount + date columns

So the bulk of the demo is reachable by **wiring an existing endpoint into the
client**, not by new accounting logic.

## Work required

**Client (the main piece):**
1. Add `appApi.admin.getOrganizationBalance(organizationId, …)` to
   `apps/store/src/appApi/index.ts` (today only `getDeliveryNotes` exists there).
2. In `LedgerModal`: call it on open, render the **summary box** from `rollup`, and
   render the **entry ledger** as the unified table (debit/credit, type badge, account,
   date). Wire the real **tab counts**. Keep the existing per-account filter
   (entries carry `billingAccountId`).

**Backend / decisions for Philip:**
3. **Firestore rules / access:** confirm admin read path for `organizationBalance`
   (endpoint is admin-gated; verify no rules gap for the rollup + entries collections).
4. **קבלות (receipts) & זיכויים (credit notes) as documents:** the AR entry ledger
   already represents payments (`settlement`) and reversals (`order_reversal`) as
   rows. Decide whether the demo's "קבלה" / "זיכוי" rows should be **derived from AR
   entries** (+ `ledger.transactions` for receipt detail) or require **standalone
   receipt/credit-note documents**. Credit-note documents do **not** appear to exist
   yet (`functions/src/modules/documents/api` has `createInvoice`, `createDeliveryNote`,
   `recordInvoicePayment`, `getOpenInvoices` — no credit note).
5. **Action buttons** map to money operations:
   - `+ תעודת משלוח` → `createDeliveryNote` (exists)
   - `+ קבלה` → `recordInvoicePayment` / `postManualTransaction` (exist) — confirm UX
   - `+ זיכוי` → **needs a credit-note flow (likely new)** — scope with Philip.

## Recommended split

- **Phase 1 (low risk, mostly client):** wire `getOrganizationBalance` → summary box +
  unified debit/credit table + real tab counts + per-account filter. This alone makes
  the ledger look ~like the demo and is read-only (no money mutation).
- **Phase 2 (needs accounting decisions):** the `+ קבלה` / `+ זיכוי` create buttons and
  whether credit notes become real documents.

## Files

- `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` — `LedgerModal`.
- `apps/store/src/appApi/index.ts` — add admin `getOrganizationBalance` caller.
- `functions/src/modules/documents/api/getOrganizationBalance.ts` — existing endpoint.
- `packages/core/lib/entities/OrganizationBalance.ts` — rollup + entry schema.
- `apps/docs/docs/modules/ledger.md` — ledger/AR module reference.
