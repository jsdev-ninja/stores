# Payment ↔ Invoice Allocation — spec for Philip

**Owner:** David (app owner) request — written up by agent
**Project:** @jsdev-store (storebrix.com)
**Status:** Spec for review — implementation NOT started (RESTRICTED: core ledger/money logic)
**Related plans:** [`customer-debts-page-payments.md`](./customer-debts-page-payments.md) (invoice-level payments, already introduces `reference: { type: "invoice" }`), [`ledger-card-like-demo.md`](./ledger-card-like-demo.md)
**Reported from:** כרטסת לקוח modal, org "david balasi", 2026-06-26

---

## 0. What David is asking for

> "אני רוצה שיהיה אפשר **לשייך תשלום לחשבונית**."

The app owner wants a payment to be **allocated to the specific invoice it pays**, instead of just adding to a single global "total payments" bucket per organization. Today there is no link between a payment and an invoice, and that produces a wrong "יתרה לתשלום" (balance to pay).

---

## 1. The concrete bug that exposed this

In the כרטסת for **david balasi** the summary box shows:

| Field | Shown |
| --- | --- |
| סך חשבוניות (total accrued) | ₪86.73 |
| סך תשלומים (total settled) | ₪60.77 |
| **יתרה לתשלום (owed)** | **₪25.96** ❌ |

But the only open document in the card is **delivery note 70097 = ₪86.73**, which has **not** been paid. The ₪60.77 was a payment against a **different, already-closed invoice** (an invoice of ₪60.77 that was paid by its own ₪60.77 payment).

**Expected:** יתרה לתשלום = **₪86.73** (the open delivery note), because the ₪60.77 invoice and its ₪60.77 payment cancel each other out.

---

## 2. Why it comes out wrong today

The balance is a **single global running total per organization**, with no matching between a payment and the invoice it settled:

```
owed = max(0, totalAccrued − totalSettled)
     = max(0, 86.73 − 60.77) = 25.96   ← wrong
```

- `totalSettled` includes the ₪60.77 payment.
- `totalAccrued` does **not** include the ₪60.77 invoice/accrual (only the ₪86.73 delivery note is in the ledger as an accrual).
- So the orphan ₪60.77 payment "eats into" the unrelated open ₪86.73 debt.

**Code references:**
- Display + calc: `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` — `LedgerModal`, `owedAg = max(0, totalAccrued − totalSettled)` (~lines 1465–1482; render ~1609–1630).
- Data: `appApi.admin.getOrganizationBalance` → `functions/src/modules/documents/api/getOrganizationBalance.ts`.
- Entities: `packages/core/lib/entities/OrganizationBalance.ts` — `TOrganizationBalanceEntry` (`sign: "+"` accrual = delivery_note, `sign: "-"` settlement = ledger_payment) + `rollup` (`totalAccrued`, `totalSettled`, `owed`).

So there are really two problems feeding the same wrong number:
1. **No payment→invoice allocation** (David's actual request).
2. A **data gap**: a settlement (₪60.77 payment) exists with no matching accrual in `totalAccrued`. With a global net, that orphan payment silently reduces an unrelated open debt.

---

## 3. The fix David is asking for: allocate a payment to an invoice

Make every payment carry **which invoice (or delivery note) it pays**, and compute the balance **per document**, then sum the remainders. A payment can only reduce the document it is allocated to — never an unrelated open document.

```
For each invoice/delivery-note D:
    remaining(D) = D.total − Σ(payments allocated to D)
owed(org)       = Σ remaining(D)   over D where remaining(D) > 0
```

Applied to David's case:
- Invoice ₪60.77 − payment ₪60.77 = **0** (closed) → contributes 0.
- Delivery note 70097 ₪86.73 − payments ₪0 = **86.73** (open) → contributes 86.73.
- **owed = 86.73** ✅

### What that needs (developer territory)

- **A link on the payment.** Extend the AR settlement / ledger transaction to carry `reference: { type: "invoice" | "delivery_note", id }` (the related plan `customer-debts-page-payments.md` already proposes exactly this `reference` union — they should be unified). Requires a `@jsdev_ninja/core` bump.
- **A "record payment against this invoice" action** in the כרטסת UI, so an admin can mark *which* invoice a payment settles (and partial payments).
- **Per-document balance** in `getOrganizationBalance` (or a new per-invoice read), instead of only the global accrued−settled rollup.
- **Backfill / reconcile** existing data so historical payments get linked to their invoices, otherwise old orgs keep showing wrong balances. (Note the existing one-time AR backfill commit `9233532e` — this needs to be revisited so payments land allocated, not just netted.)

---

## 4. Why this is RESTRICTED (not done by the agent)

This touches the **ledger/money core**: `@jsdev_ninja/core` entity changes, the documents (AR) backend module, and a data backfill of historical payments. It affects every customer's balance and is irreversible if the data migration is wrong. **Needs Philip's design + approval before any code.**

---

## 5. Suggested smallest first step

Before the full allocation model, a low-risk improvement Philip may consider: surface the orphan-settlement case in the UI (when `totalSettled` has no matching accrual) so a wrong-looking `owed` is at least visible/flagged, rather than silently netting. But the real fix David wants is true **payment→invoice allocation** as in §3.
