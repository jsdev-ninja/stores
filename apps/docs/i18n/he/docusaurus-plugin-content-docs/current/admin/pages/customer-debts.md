---
sidebar_position: 1
title: Customer Debts (חובות לקוחות)
---

# Customer Debts — חובות לקוחות

**Route:** `admin.budget`
**File:** `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx`
**Drill-through:** `admin.budgetOrganization` (same file, separate export — see [Per-organization ledger](#per-organization-ledger))

The list of every **unpaid invoice** so the store owner can see who owes
money and record a payment in one click. Each recorded payment writes a
manual ledger transaction, issues an EZcount receipt linked to the
invoice, and marks the invoice as paid on the order doc.

:::tip Why this matters
A delivery note alone is informational. A formal **invoice** issued on
credit terms is the actual receivable. Until a receipt is issued, the
invoice is **open debt**. This page is the operator's daily worklist for
collecting on that debt.
:::

:::caution Single full payment per invoice (this iteration)
Partial payments are **not yet supported**. The "סכום ששולם" field in the
modal is locked to the full invoice total. A future iteration will add
partial-payment support — see [Out of scope](#out-of-scope).
:::

## What you see

```
┌────────────────────────────────────────────────────────────────────┐
│ חובות לקוחות                                                       │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐                      │
│ │ סה"כ חוב פתוח      │ │ מס׳ חשבוניות פתוחות│                      │
│ │ ₪ ##,###.##        │ │ #                  │                      │
│ └────────────────────┘ └────────────────────┘                      │
├────────────────────────────────────────────────────────────────────┤
│ [search]  [company filter ▼]                                       │
├────────────────────────────────────────────────────────────────────┤
│ חברה │ מס׳ חשבונית │ תאריך הנפקה │ סכום │ פעולות                  │
│ ─────┼─────────────┼─────────────┼──────┼───────────────────────── │
│ row  │ row         │ row         │ row  │ [👁 PDF] [רישום תשלום]   │
└────────────────────────────────────────────────────────────────────┘
```

## What it does

| Element | Source | Notes |
| --- | --- | --- |
| **סה"כ חוב פתוח** KPI | sum of `row.total` across all open-invoice rows | shekels |
| **מס׳ חשבוניות פתוחות** KPI | count of open-invoice rows | |
| **Search** | client-side over `invoiceNumber` + `organizationName ?? customerName` | tolerant of undefined fields |
| **Company filter** | populated from `appApi.admin.listOrganizations()` | filters by `row.organizationId` |
| Row → **חברה** | `row.organizationName ?? row.customerName ?? "—"` | `organizationName` is currently always undefined from the backend; falls back to `customerName` from the EZcount payload |
| Row → **מס׳ חשבונית** | `row.invoiceNumber` (EZcount doc_number) | |
| Row → **תאריך הנפקה** | `row.issueDate` (epoch millis) | Hebrew locale |
| Row → **סכום** | `row.total` (shekels) | danger/orange color |
| **👁** | external link to `row.invoicePdfLink` | EZcount-hosted PDF |
| **רישום תשלום** | opens the [`RecordInvoicePaymentModal`](#record-payment-modal) | |

**Sort:** newest invoice first (`issueDate desc`).

**Empty state:** wallet icon + `אין חובות פתוחים 🎉`.

## How it works

### 1. Fetch open invoices

```ts
appApi.admin.getOpenInvoices()
// Returns: { success: true, data: OpenInvoiceRow[] } | { success: false, error }
```

Backend file: `functions/src/modules/documents/api/getOpenInvoices.ts`

The endpoint queries Firestore `orders` scoped to the active store and
company. A row is "open" iff it has an EZcount invoice (`ezInvoice.success
=== true`) AND `invoicePaidAt` is unset.

Each `OpenInvoiceRow` is enriched server-side with `invoiceNumber`,
`invoicePdfLink`, `issueDate`, `total`, and customer/organization fields.

:::info `organizationName` is currently always undefined
The backend skips the extra `organizations` Firestore read for now. The
page falls back to `customerName` from the EZcount `calculatedData`. A
follow-up will batch-read organizations and populate this field.
:::

### 2. Record a payment

```ts
appApi.admin.recordInvoicePayment({
  orderId,
  paymentMethod: "cash" | "check" | "bank_transfer" | "credit_card",
  paymentDate: <epoch millis>,
  note?: string,
  idempotencyKey: `inv-pay-${orderId}`,
})
```

Backend file: `functions/src/modules/documents/api/recordInvoicePayment.ts`

What it does, atomically (from the caller's perspective):

1. **Tenant check** — verifies the order belongs to the caller's
   companyId/storeId. Failure → `tenant_mismatch`.
2. **Idempotency** — if `invoicePaidAt` is already set, returns the
   existing receipt with `success: true`. Re-submits are no-ops.
3. **Posts a `manual` ledger transaction** via `postManualTransaction`:
   - `amount`: invoice total × 100 (integer agorot)
   - `reference: { type: "invoice", id: invoiceUuid }` — the `"invoice"`
     reference type is new in this iteration; postManualTransaction now
     verifies the invoice's tenant via `verifyInvoiceBelongsToTenant`
   - `payer`: organizationId + clientId + billingAccountId from the order
   - `idempotencyKey`: `inv-pay-{orderId}`
4. **Calls EZcount** to create a `RECEIPT` (DOC_TYPE = 400) linked to the
   invoice as `parent: invoiceUuid`. The payment line carries the
   payment-method code (cash=1, check=2, bank_transfer=3, credit_card=4
   per `services/ezCountService/paymentTypes.ts`).
5. **Marks the order paid** — sets `invoicePaidAt` to `paymentDate` and
   stores the EZcount receipt response on `o.ezReceipt`. Same shape as
   `o.ezInvoice`.

If EZcount fails AFTER the ledger write succeeded, the endpoint returns
`{ success: false, code: "ezcount_failed" }` but the ledger transaction
stays. The next call (same `idempotencyKey`) dedups the ledger write and
retries the receipt.

### 3. Record-payment modal

File: `apps/store/src/widgets/Modals/RecordInvoicePaymentModal.tsx`
Registered as `modalApi.openModal("recordInvoicePayment", { row, onPaymentRecorded })`.

Visible summary:

- **לקוח** — `row.customerName ?? row.organizationName`
- **סכום החשבונית** — `row.total` (₪)
- **שולם עד כה** — ₪0 (no partial payments this iteration)
- **יתרה לתשלום** — equals `row.total`

Form:

| Field | Default | Notes |
| --- | --- | --- |
| סכום ששולם | invoice total | **Read-only** — locked to the invoice total. Hint: `תשלום חלקי לא נתמך כרגע` |
| תאריך תשלום | today | HTML `<input type="date">` |
| אמצעי תשלום | המחאה / שיק | Dropdown: מזומן · המחאה / שיק · העברה בנקאית · כרטיס אשראי |
| הערה | empty | Optional textarea |

On submit → calls `recordInvoicePayment`. On `success: true` → toast
`תשלום נרשם בהצלחה — קבלה {receipt.doc_number} הופקה`, closes modal,
parent re-fetches the list (the paid row disappears).

### Error codes mapped to UI strings

| Code | Hebrew message shown inline |
| --- | --- |
| `invoice_missing` | חשבונית לא נמצאה |
| `already_paid` | החשבונית כבר שולמה (modal closes, list reloads) |
| `ezcount_failed` | החיוב נשמר אבל יצירת הקבלה נכשלה. נסה שוב מאוחר יותר. |
| `ledger_failed` | שמירת התשלום נכשלה. נסה שוב. |
| `tenant_mismatch` | אין הרשאה לחשבונית הזו. |
| `amount_mismatch` | אי התאמה בסכום. |

## Schema additions

`@jsdev_ninja/core` bumped `0.16.0 → 0.17.0`. Two additive fields on
`TOrder`:

```ts
invoicePaidAt?: number;    // epoch millis; set when admin records full payment
ezReceipt?: EzInvoice;     // EZcount receipt response — same shape as ezInvoice
```

Plus a new `"invoice"` value in the `reference.type` union of `TTransaction`
and `TransactionPostedPayload`. Existing callers using `"order"` /
`"refund"` / `"adjustment"` are unaffected.

## Per-organization ledger

The `admin.budgetOrganization` route renders `AdminBudgetOrganizationPage`
(exported from the same file). It is **not** part of the customer-debts
list flow — it predates this page and shows the per-org transaction
ledger with delivery notes, payments, and credit notes, plus a manual
credit-note / debit-note creation modal. Untouched by this iteration.

## Money & time conventions

- **Money**: invoice totals are stored as **shekels** (legacy data). The
  page displays them as-is via `fmtMoney`. The backend converts to integer
  agorot only at the `postManualTransaction` boundary.
- **Time**: epoch millis everywhere. The EZcount call formats to DD/MM/YYYY
  at the boundary, mirroring `createInvoice` / `createDeliveryNote`.

## Out of scope (deliberate)

This iteration deliberately excludes:

- ❌ **Partial payments** — modal is locked to the full invoice total
- ❌ **Reminders** — no "send reminder" action
- ❌ **Aging buckets / due dates** — no `dueDate` math, no 0-30 / 31-60 columns
- ❌ **Org-level AR settlement on invoice payments** — `documents.settleOnTransactionPosted` currently only handles `reference.type === "order"`. Invoice-typed transactions DO write to the ledger and DO close the invoice, but the per-organization AR balance (used elsewhere) won't reduce until the subscriber is extended. Follow-up tracked in [docs/plans/customer-debts-page-payments.md](https://github.com/jsdev-ninja/stores/blob/main/docs/plans/customer-debts-page-payments.md) §2.5.
- ❌ **Supplier invoices** — this page is customer-facing only
- ❌ **Bulk pay** — one invoice at a time

## Related

- **Delivery notes page** (`admin.deliveryNotes`, `AdminDeliveryNotesPage.tsx`) — companion view: month-by-month delivery notes with status pills and create-invoice action.
- [Ledger module](/modules/ledger) — the append-only money source of truth; receives the manual transaction this page writes.
- [Event system](/architecture/event-system) — `documents.invoice_created` fires when an invoice is created (no AR effect today). The recorded payment fires `ledger.transaction_posted`, picked up by `documents: settleOnTransactionPosted` (today only for `reference.type === "order"`).
- Backend: `functions/src/modules/documents/api/recordInvoicePayment.ts` · `getOpenInvoices.ts`
- Receipt service: `functions/src/services/ezCountService/index.ts` (`createReceipt`, `DOC_TYPE.RECEIPT = 400`)
