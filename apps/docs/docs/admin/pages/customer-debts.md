---
sidebar_position: 1
title: Customer Debts (חובות לקוחות)
---

# Customer Debts — חובות לקוחות

**Route:** `admin.budget`
**File:** `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx`
**Drill-through:** `admin.budgetOrganization` (same file, separate export — see [Per-organization ledger](#per-organization-ledger))

The list of every **unpaid delivery note** so the store owner can see who owes
money and convert any DN into an invoice in one click.

:::tip Why this matters
A delivery note is a credit-terms accrual — the customer has received goods
but hasn't paid. Until an invoice is issued and paid, the value of that DN is
**open debt**. This page is the operator's daily worklist for chasing that
debt.
:::

## What you see

```
┌────────────────────────────────────────────────────────────────────┐
│ חובות לקוחות                                                       │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐                      │
│ │ סה"כ חוב פתוח      │ │ מס׳ תעודות פתוחות  │                      │
│ │ ₪ ##,###.##        │ │ #                  │                      │
│ └────────────────────┘ └────────────────────┘                      │
├────────────────────────────────────────────────────────────────────┤
│ [search]  [company filter ▼]                                       │
├────────────────────────────────────────────────────────────────────┤
│ חברה │ מס׳ תעודה │ תאריך הנפקה │ פריטים │ סכום פתוח │ פעולות       │
│ ─────┼───────────┼─────────────┼────────┼───────────┼──────────── │
│ row  │ row       │ row         │ row    │ row       │ [👁] [📄+]   │
└────────────────────────────────────────────────────────────────────┘
```

## What it does

| Element | Source | Notes |
| --- | --- | --- |
| **סה"כ חוב פתוח** KPI | sum of `dnTotal(o)` across all unpaid rows | not the filtered subset — total openness |
| **מס׳ תעודות פתוחות** KPI | count of unpaid rows | |
| **Search** | client-side over DN number + company name | |
| **Company filter** | populated from `appApi.admin.listOrganizations()` | |
| Row → **חברה** | `companyName(o)` — `orgNameById.get(o.organizationId)` → falls back to `o.deliveryNote?.companyDetails?.name` → `—` | |
| Row → **מס׳ תעודה** | `dnNumber(o)` — `o.deliveryNote?.number` or `o.ezDeliveryNote?.doc_number` | |
| Row → **תאריך הנפקה** | `fmtDate(dnDate(o))` (Hebrew locale) | |
| Row → **פריטים** | `dnItemCount(o)` — DN items length, falls back to cart items length | |
| Row → **סכום פתוח** | `fmtMoney(dnTotal(o))` (orange/danger color) — `o.deliveryNote?.total` or `o.cart?.cartTotal` | money is stored in shekels for legacy records — no agorot conversion here |
| **👁 צפה** | direct link to `dnPdf(o)` — `deliveryNote.link` or `ezDeliveryNote.pdf_link` | |
| **📄+ הפק חשבונית** | opens the `invoiceDetails` modal | gated — see [Create-invoice action](#create-invoice-action) |

**Sort:** newest DN first (`dnDate(b) - dnDate(a)`).

**Empty state:** wallet icon + `אין חובות פתוחים 🎉`.

## How it works

### 1. Fetch

```ts
appApi.admin.getDeliveryNotes({
  fromDate: Date.now() - 365 * 24 * 60 * 60 * 1000,  // 12 months back
  toDate:   Date.now(),
})
```

The endpoint queries Firestore `orders` scoped to the active store and
company (`storeId`, `companyId`), filtered to `ezDeliveryNote.success === true`
and `date` within the range, sorted by `date desc`.

The 12-month window is the only cap. DNs older than 12 months still unpaid
will not appear here — they're rare in practice but worth knowing if a tenant
carries old debt.

### 2. Filter to unpaid

```ts
const isUnpaid = (o: TOrder) => {
  const s = dnStatus(o);
  return s !== "paid"
    && s !== "cancelled"
    && !o.invoice          // no legacy invoice
    && !o.ezInvoice        // no EZcount invoice
    && dnNumber(o) !== "—";
};
```

A DN counts as **unpaid** when its status is anything other than `paid` or
`cancelled` AND no invoice (legacy or EZcount) has been issued yet AND a
delivery-note number actually exists.

:::caution EZcount-only DNs
`dnStatus(o)` reads from `o.deliveryNote?.status` — EZcount-only DNs (no
embedded `deliveryNote` object) return `undefined`. The filter deliberately
accepts `undefined` as "not paid" so EZcount-only DNs appear here. This is
the inverse of the original implementation, which required `"pending"` and
silently dropped EZcount-only records.
:::

### 3. Render

Client computes:

- **KPIs** from the unfiltered unpaid set (`unpaid`)
- **Table rows** from the company / search-filtered subset (`filtered`)

Reload happens on mount and after any successful invoice creation.

## Create-invoice action

The **הפק חשבונית** button only renders when ALL of:

```ts
dnNumber(o) !== "—"
&& !o.invoice
&& !o.ezInvoice
&& !!o.ezDeliveryNote?.doc_uuid
```

The `doc_uuid` gate is what limits this to EZcount-managed DNs — the modal
needs that uuid to call EZcount and create an invoice linked to the DN.

When clicked, opens the shared `invoiceDetails` modal with:

```ts
{
  selectedOrders: [o],
  linkedDeliveryNote: {
    docUuid: o.ezDeliveryNote?.doc_uuid ?? "",
    number:  dnNumber(o),
  },
  requireAllocation: (o.cart?.cartTotal ?? 0) >= 5000,
  onInvoiceCreated:  () => loadUnpaidDeliveryNotes(),
}
```

- `requireAllocation` — Israeli law (`חשבונית ישראל`) requires an allocation
  number for invoices ≥ ₪5,000. The modal enforces this.
- `onInvoiceCreated` — re-fetches the 12-month window and re-applies the
  unpaid filter. The successfully-invoiced row disappears.

The modal itself is shared with `AdminDeliveryNotesPage` — same payload, same
behavior. See `apps/store/src/pages/admin/AdminDeliveryNotesPage/AdminDeliveryNotesPage.tsx`
for the reference implementation.

## Per-organization ledger

The `admin.budgetOrganization` route renders `AdminBudgetOrganizationPage`
(exported from the same file). It is **not** part of the customer-debts list
flow — it predates this page and shows the per-org transaction ledger with:

- One row per `delivery_note` / `payment_received` / `credit_note` transaction
- Billing-account filter
- Manual credit-note / debit-note creation modal
- Running balance summary

Accessed from elsewhere in the admin app (the previous Budget list used to
link there with a "צפה" button). The route still works.

## Money & time conventions

- **Money** — legacy data is stored in **shekels** (not agorot) for
  `dnTotal` / `cart.cartTotal`. The helpers display it directly. New money
  fields per the project rule should be agorot — but this page reads
  pre-existing fields.
- **Time** — `o.date` and `o.deliveryNote.date` are epoch millis. `fmtDate`
  handles both seconds and millis (`< 1e12` → seconds) for safety.

## Out of scope (deliberate non-features)

- ❌ No aging buckets (0-30 / 31-60 / 60+) — no `dueDate` math
- ❌ No reminder action — sending the customer a reminder is not part of this
  page
- ❌ No bulk-create-invoice for multiple DNs
- ❌ No per-customer roll-up — that view lives on the org ledger page

These were deliberate scope decisions. If they come back into scope, the
demo at `demo/balasi-store-site-2026-06-12/admin.html` (DEBTS VIEW) has
references for an aging-bucket UI.

## Related

- **Delivery notes page** (`admin.deliveryNotes` route, `AdminDeliveryNotesPage.tsx`) — same data shape, full month-by-month view including paid DNs. Reference implementation for the helpers used here.
- [Ledger module](/modules/ledger) — the append-only money source of truth, where invoice payments land
- [Event system](/architecture/event-system) — `documents.delivery_note_created` and `documents.invoice_created` events fire when DNs and invoices are created
