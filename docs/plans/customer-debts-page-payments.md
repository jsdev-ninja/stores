# Customer Debts Page — Invoice-Level Payments

**Owner:** plan author = software-architect agent
**Project:** @jsdev-store (storebrix.com)
**Status:** Draft for review — implementation NOT started
**Replaces:** the current `AdminBudgetPage` list export (DN-level "open notes" listing)
**Related plans:** `ar-organization-balance.md` (org-level AR), `invoice-flow-adaptation.md` (EZcount invoices)

---

## 0. TL;DR

Replace the existing customer-debts page (currently lists *open delivery notes*) with an **invoice-level outstanding-balance** view that supports recording partial payments. The page lists invoices where `outstanding > 0`, exposes a "רישום תשלום" modal, and drops invoices once the balance hits zero.

**Two phases, ship-A-first recommended:**

- **Phase A — frontend only**: pivot the existing list from DNs to invoices, full-only payments via `postManualTransaction`, no schema change. Ships in 1 PR, ~1 day. *Does not support partial payments* (binary paid/unpaid). Safe under app-owner (David) supervision because there is no contract change.
- **Phase B — invoice paidAmount tracking**: adds `o.invoicePaidAmount` field on the order, a new subscriber to maintain it, and a new `getOpenInvoices` callable so per-invoice partial payments are first-class. ~3–4 days. Requires a `@jsdev_ninja/core` bump (developer-only territory).

The single most important architectural decision: **invoice-level payment state lives on the order doc as `o.invoicePaidAmount: number` (integer agorot)**, populated by a new `documents.updateInvoicePaidAmountOnTransactionPosted` subscriber. It is *additive* to the existing org-level AR roll-up — it does not replace it.

---

## 1. Target Architecture

### Money flow (Phase B target)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ "רישום תשלום" modal (admin) — invoice context: order + EZ invoice number       │
└──────────────────────────────────┬─────────────────────────────────────────────┘
                                   │ submit
                                   ▼
                appApi.admin.recordInvoicePayment({                              
                  invoiceDocUuid, orderId, amountAgorot,                         
                  paymentDate, paymentMethod, note                                
                })                                                              
                                   │
                                   ▼
                ┌──── ledger.postManualTransaction (existing) ────┐               
                │   type: "manual", direction: "in"               │              
                │   reference: { type: "invoice", id: invDocUuid }│ ← NEW UNION  
                │   payer: { organizationId, clientId, ba }       │              
                │   idempotencyKey: `inv-pay-{uuid}-{nonce}`      │              
                └──────────────────┬──────────────────────────────┘              
                                   │ Firestore txn writes transaction doc        
                                   │ + emits ledger.transaction_posted            
                                   ▼
                  ┌────────────────────────────────────────────┐                 
                  │ Subscribers fan-out (3 subscribers, idemp.)│                 
                  └─┬───────────────────┬──────────────────────┬─┘                
                    │                   │                      │                 
                    ▼                   ▼                      ▼                 
       markOrderPaidOnTx       settleOnTx (existing)    updateInvoicePaid (NEW)  
       — sets order.payment    — posts "-" AR entry     — increments              
         Status = completed      `settle_{txId}` →        o.invoicePaidAmount    
         (existing, unchanged)   reduces org rollup       by tx.amount, idempotent
                                                          via lastAppliedTxIds   
                                                                                 
       Page refresh:                                                              
         appApi.admin.getOpenInvoices() — query orders where                      
            ezInvoice.success == true AND                                         
            (invoiceTotalAgorot - invoicePaidAmount) > 0                          
         → invoice falls out of list when balance hits 0                          
```

**Where per-invoice state lives:** on the **order doc** as a sibling to `o.invoice` / `o.ezInvoice`. This avoids mutating the EZcount payload (which is generated by an external service) and reuses the tenant-scoped order doc that every consumer already knows how to query and authorize.

**Why a separate subscriber instead of extending `settleOnTransactionPosted`:** the AR subscriber settles at **organization** granularity (one settlement entry per ledger transaction, applied to a per-org rollup). Invoice-level tracking is **document-granularity** — different shape, different write target, different idempotency story. Keeping them separate honours single-responsibility and avoids the AR rollup leaking invoice-shaped concerns.

---

## 2. Contracts

### 2.1 New: `appApi.admin.getOpenInvoices`

Frontend method on `apps/store/src/appApi/index.ts`. Mirrors `getDeliveryNotes` in shape.

```ts
type GetOpenInvoicesInput = {
  /** epoch millis — inclusive lower bound on order.date */
  fromDate: number;
  /** epoch millis — inclusive upper bound on order.date */
  toDate: number;
};

type OpenInvoiceRow = {
  orderId: string;
  invoiceNumber: string;            // ezInvoice.doc_number | invoice.number
  invoiceDocUuid: string;           // ezInvoice.doc_uuid (Phase B requires this)
  invoiceDate: number;              // epoch millis (ezInvoice.date | order.date)
  pdfLink: string | null;           // ezInvoice.pdf_link
  /** Integer agorot — server-computed, authoritative */
  invoiceTotalAgorot: number;
  paidAmountAgorot: number;         // 0 if field missing on order
  outstandingAgorot: number;        // max(0, total - paid)
  organizationId: string | null;
  organizationName: string | null;
  customerName: string | null;      // ezInvoice.calculatedData.client_name fallback
  itemCount: number;
};

type GetOpenInvoicesResult =
  | { success: true; data: OpenInvoiceRow[] }
  | { success: false; error: string };
```

The query lives on the **frontend** (`listV2` with `where`) — matches the `getDeliveryNotes` precedent (line 572 in `apps/store/src/appApi/index.ts`). No backend callable needed for read.

Filter clauses:

```ts
where: [
  { name: "storeId",           operator: "==", value: storeId },
  { name: "companyId",         operator: "==", value: companyId },
  { name: "ezInvoice.success", operator: "==", value: true },
  { name: "date",              operator: ">=", value: fromDate },
  { name: "date",              operator: "<=", value: toDate },
]
```

Filtering by outstanding > 0 happens client-side (Firestore can't AND a computed difference). At realistic volume (hundreds of invoices/year per store) this is fine. If we ever exceed ~1k open invoices, we add a denormalized `o.invoiceOutstandingAgorot` field and filter server-side.

### 2.2 Extended: `postManualTransaction` reference union

**Decision: extend the existing union, do NOT add a separate `invoiceId` field.** Reasons:

1. The reference union is the established discriminator for routing in subscribers (`storedTx.reference.type === "order"`). Adding a parallel `invoiceId` would create two ways to express "what this payment is for" — a classic fan-out trap (see CLAUDE.md fan-out discussion in similar plans).
2. The new subscriber needs to filter on `reference.type === "invoice"` in one branch. The discriminated union gives type narrowing for free.
3. An invoice payment **is also** a payment against the underlying order. The order-paid subscriber can be updated to map `reference.type === "invoice"` → look up order via `o.ezInvoice.doc_uuid == reference.id` (one extra Firestore query inside the subscriber, fine).

**Change in `functions/src/modules/ledger/api/postManualTransaction.ts`:**

```ts
const InputSchema = z.object({
  amount: z.number().int().positive(),
  idempotencyKey: z.string().min(1).max(200),
  reference: z
    .object({
      type: z.enum(["order", "refund", "adjustment", "invoice"]),  // ← + invoice
      id: z.string().min(1),
    })
    .optional(),
  payer: z.object({
    organizationId: z.string().nullish(),
    clientId: z.string().nullish(),
    billingAccountId: z.string().nullish(),
  }).optional(),
});
```

**Mirror change in `functions/src/modules/ledger/types.ts`** (Transaction schema's reference field) so `TransactionSchema.parse(...)` accepts the new type at write time.

**Mirror change in `functions/src/modules/ledger/events.ts`** (`TransactionPostedPayload.reference`) so subscribers can switch on the type.

**Frontend mirror in `apps/store/src/lib/firebase/api.ts`** — `postManualTransaction` wrapper:

```ts
async function postManualTransaction(params: {
  amount: number;
  idempotencyKey: string;
  reference?: {
    type: "order" | "refund" | "adjustment" | "invoice";  // ← + invoice
    id: string;
  };
  payer?: { organizationId?: string; clientId?: string; billingAccountId?: string };
}) { … }
```

### 2.3 New field on Order: `invoicePaidAmount` (sibling to `invoice` / `ezInvoice`)

**Decision: add `invoicePaidAmount: number` (integer agorot) directly on the order doc**, NOT inside `o.invoice.*` or `o.ezInvoice.*`.

Reasons:

- `o.ezInvoice` is **the verbatim EZcount response**. Mutating it would (a) make replays from EZcount risky if they ever re-fetch & overwrite, (b) violate the schema validator if EZcount tightens its types.
- `o.invoice` (legacy) is largely deprecated for new stores. Putting the field there means the new code only works for the legacy path.
- A top-level sibling is the same pattern as `lastPaymentTransactionId` (already added by `markOrderPaidOnTransactionPosted`).

**Schema change in `packages/core/lib/entities/Order.ts`:**

```ts
export const OrderSchema = z.object({
  // … existing fields …
  invoice: InvoiceSchema.optional(),
  ezInvoice: EzInvoiceSchema.optional(),
  ezDeliveryNote: EzDeliveryNoteSchema.optional(),

  // NEW: integer agorot, total amount paid against the invoice attached
  // to this order. Maintained by documents/updateInvoicePaidAmountOnTransactionPosted.
  // Absent (undefined) means "no payment recorded since field was introduced" — treat as 0.
  invoicePaidAmount: z.number().int().nonnegative().optional(),

  // NEW: array of ledger transactionIds whose amounts have already been folded
  // into invoicePaidAmount. Idempotency gate for the subscriber.
  // Bounded growth: realistically <10 transactions per invoice in normal use;
  // schema does not enforce a cap but logging will alert if length > 100.
  invoicePaidAppliedTxIds: z.array(z.string()).optional(),

  updatedBy: z.string().optional(),
  updatedAt: z.number().optional(),
});
```

Both fields are **optional and additive** — no backfill needed, no breaking change.

### 2.4 New: `documents.updateInvoicePaidAmountOnTransactionPosted` subscriber

**Trigger:** `ledger.transaction_posted`
**Acts only when:** `tx.reference.type === "invoice"` AND `tx.direction === "in"` AND `tx.type ∈ {manual, hyp_capture, hyp_direct}`.

Pseudocode:

```ts
export const updateInvoicePaidAmountOnTransactionPosted = subscribe(
  { name: "documents-update-invoice-paid", type: LedgerEventTypes.transactionPosted, payloadSchema: TransactionPostedPayload },
  async (event, ctx) => {
    const { transactionId, reference, direction, type, amount } = event.payload;
    if (reference?.type !== "invoice") return;
    if (direction !== "in") return;
    if (!RECEIVED_MONEY_TYPES.has(type)) return;
    const storedTx = await getTransactionById(ctx.companyId, ctx.storeId, transactionId);
    if (!storedTx) throw new Error(/* retry */);

    // Find the order that owns this invoice. ezInvoice.doc_uuid is the
    // reference.id for EZcount invoices; invoice.id for legacy.
    const orderId = await findOrderByInvoiceUuid(ctx.companyId, ctx.storeId, storedTx.reference.id);
    if (!orderId) {
      logger.error("documents.updateInvoicePaid: no order found for invoice uuid", { … });
      return; // do not poison the queue
    }

    // Transactional update with idempotency gate
    await db.runTransaction(async (txn) => {
      const ref = db.doc(orderPath(ctx.companyId, ctx.storeId, orderId));
      const snap = await txn.get(ref);
      if (!snap.exists) throw new Error(/* retry */);
      const order = snap.data() as TOrder;
      const applied = order.invoicePaidAppliedTxIds ?? [];
      if (applied.includes(storedTx.id)) return; // idempotent replay
      const next = (order.invoicePaidAmount ?? 0) + storedTx.amount;
      txn.update(ref, {
        invoicePaidAmount: next,
        invoicePaidAppliedTxIds: [...applied, storedTx.id],
        updatedAt: Date.now(),
      });
    });
  },
);
```

Idempotency: the **applied-tx-ids array on the order doc** is the dedup gate. We cannot use `.create()` of a sibling doc because we're updating an existing order, not creating something new. The array stays bounded (one entry per *invoice payment* — typically 1–3, never more than ~10 in normal use). At >100 entries the subscriber logs a warning so we can investigate (probable bug, not legitimate use).

Tenant scoping: `companyId` and `storeId` come from `ctx`, never from payload. The order doc path is built via `FirebaseAPI.firestore.getPath`. Cross-tenant orderId reuse is impossible because the path is tenant-scoped.

### 2.5 Existing subscriber update: `markOrderPaidOnTransactionPosted`

Currently filters `reference.type !== "order"` → skip. After Phase B, it must also handle `reference.type === "invoice"`. Map invoice → order via a single `findOrderByInvoiceUuid` Firestore query, then proceed as today.

This is the smallest change that preserves the existing guarantees (order gets `paymentStatus: completed` once fully paid). Required because some callers will move from "mark this order paid" to "record this invoice payment" — without this update, the order's `paymentStatus` would never get flipped for invoice-routed payments.

**Alternative considered, rejected:** keep `markOrderPaidOnTransactionPosted` order-only and *also* emit a synthetic `transaction_posted` with `reference.type === "order"`. Rejected because it would double-emit, double-account in AR, and mess with `detectDuplicateCharges`.

### 2.6 Recommended idempotency key strategy for invoice-targeted payments

`idem_inv-pay-{invoiceDocUuid}-{nonce}` where `nonce` is generated client-side per modal submit (UUID v4). This:

- Prevents double-click double-charges (same nonce → same `idem_*` doc id → ALREADY_EXISTS on second write).
- Allows multiple **deliberate** partial payments on the same invoice (each submit has its own nonce).
- Embeds the invoice uuid for log-readability.

Why not `inv-pay-{invoiceDocUuid}-{Date.now()}` like the order-paid flow uses (`order-paid-{orderId}`)? Because that one is *binary* (paid or not) — a second click is always a bug. For invoices, a second click might be a legitimate second partial payment, so we use a per-attempt UUID instead of per-invoice singleton.

---

## 3. Backend Work (ordered)

> All paths are absolute under `/Users/philbro/workspace/@jsdev-store/`.

### B-1. Extend `postManualTransaction` reference union — S

**File:** `functions/src/modules/ledger/api/postManualTransaction.ts`
- Add `"invoice"` to `InputSchema.reference.type` enum (line 13).
- No other logic change — the value flows through `postTransaction` to the doc untouched.

### B-2. Extend `Transaction` and `TransactionPostedPayload` schemas — S

**Files:**
- `functions/src/modules/ledger/types.ts` — add `"invoice"` to the `reference.type` enum on `TransactionSchema`.
- `functions/src/modules/ledger/events.ts` — add `"invoice"` to `TransactionPostedPayload.reference.type` (it forwards from the stored tx).

**Why both:** `postTransaction` parses against `TransactionSchema` before write, and the event payload is parsed against `TransactionPostedPayload` on subscribe. Both must accept `"invoice"` or the new flow will reject at type-parse time.

### B-3. Add new subscriber: `updateInvoicePaidAmountOnTransactionPosted` — M

**New file:** `functions/src/modules/documents/subscribers/updateInvoicePaidAmountOnTransactionPosted.ts`

Implements §2.4. Helper `findOrderByInvoiceUuid` queries `orders` where `ezInvoice.doc_uuid == uuid` (Firestore composite index needed: `(companyId, storeId, ezInvoice.doc_uuid)`; or use `collectionGroup` per established pattern — see CLAUDE.md note about lookup-by-opaque-token). The query must be tenant-scoped (companyId + storeId from `ctx`).

**Export from `functions/src/modules/documents/index.ts`** and **wire in `functions/src/index.tsx`** alongside the other subscribers.

### B-4. Update `markOrderPaidOnTransactionPosted` to handle invoice references — M

**File:** `functions/src/modules/orders/subscribers/markOrderPaidOnTransactionPosted.ts`

Two paths:

```ts
// Existing:
if (payload.reference?.type !== "order") { /* skip non-order */ return; }
const orderId = payload.reference.id;

// New:
let orderId: string;
if (payload.reference?.type === "order") {
  orderId = payload.reference.id;
} else if (payload.reference?.type === "invoice") {
  const found = await findOrderByInvoiceUuid(companyId, storeId, payload.reference.id);
  if (!found) {
    logger.error("markOrderPaidOnTransactionPosted: no order found for invoice uuid — will retry", { … });
    throw new Error(/* retry */);
  }
  orderId = found;
} else {
  return; // refund, adjustment — not our concern
}
// … existing logic unchanged from here
```

Extract `findOrderByInvoiceUuid` into a shared helper at `functions/src/modules/orders/internal/findOrderByInvoiceUuid.ts` (or `documents/internal/` and re-export — same helper used by B-3 to avoid duplication).

### B-5. Add `invoicePaidAmount` + `invoicePaidAppliedTxIds` to Order schema — S

**File:** `packages/core/lib/entities/Order.ts`

Both optional. Bump `packages/core/package.json` minor (e.g. `1.x.0 → 1.(x+1).0`), and update the consumer pins per CLAUDE.md:

- `apps/store/package.json` → bump `@jsdev_ninja/core` to new version
- `functions/package.json` → same

### B-6. Composite Firestore index for `ezInvoice.doc_uuid` lookup — S

**File:** `firestore.indexes.json`

Add composite index:

```json
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "companyId",          "order": "ASCENDING" },
    { "fieldPath": "storeId",            "order": "ASCENDING" },
    { "fieldPath": "ezInvoice.doc_uuid", "order": "ASCENDING" }
  ]
}
```

Without this, `findOrderByInvoiceUuid` errors at runtime.

### B-7. Migration / backfill — NOT NEEDED

**Decision: no migration.**

- Existing legacy invoices with `o.invoice.status === "paid"` already have `paymentStatus === "completed"` set on the order. They never had `invoicePaidAmount`, but `outstanding` is computed as `total - (paid ?? 0)` — a missing field is treated as 0, so a fully-paid legacy invoice would *re-appear* in the list. **Counter-measure:** the `getOpenInvoices` frontend filter excludes orders with `paymentStatus === "completed"` AND `invoicePaidAmount === undefined`. This is the only piece of legacy compatibility logic.
- New invoices start tracking `invoicePaidAmount` from day-1 of Phase B deploy.
- Cancelled invoices (`o.invoice.status === "cancelled"`) are excluded by `paymentStatus !== "cancelled"` filter client-side. EZcount equivalents don't have a status field — assume EZcount invoices are never cancelled (they'd be issued a credit note instead).

---

## 4. Frontend Work (ordered)

### F-1. Rewrite list export in `AdminBudgetPage.tsx` — M

**File:** `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx` — **only the `AdminBudgetPage` export (lines 136–370)**. Do NOT touch `AdminBudgetOrganizationPage` (the drill-through view) — that page consumes the org-level AR roll-up and remains correct as-is.

Changes:

- Replace `loadUnpaidDeliveryNotes` with `loadOpenInvoices`. Call `appApi.admin.getOpenInvoices({ fromDate: now - 365d, toDate: now })`.
- Drop all DN-specific helpers (`dnNumber`, `dnPdf`, `dnDate`, `dnItemCount`, `dnTotal`, `dnStatus`, `isUnpaid`). Replace with invoice equivalents (`invNumber`, `invPdf`, etc.) — operating on `OpenInvoiceRow`.
- Columns (Hebrew, right-to-left):

  | uid           | label              | content                                                |
  | ------------- | ------------------ | ------------------------------------------------------ |
  | `company`     | חברה               | `row.organizationName ?? row.customerName ?? "—"`      |
  | `number`      | מס׳ חשבונית        | `row.invoiceNumber`                                    |
  | `date`        | תאריך הנפקה        | `fmtDate(row.invoiceDate)`                             |
  | `total`       | סכום החשבונית      | `fmtMoneyFromAgorot(row.invoiceTotalAgorot)`           |
  | `paid`        | שולם עד כה         | `fmtMoneyFromAgorot(row.paidAmountAgorot)`             |
  | `outstanding` | יתרה לתשלום        | `fmtMoneyFromAgorot(row.outstandingAgorot)` (danger)   |
  | `actions`     | (empty)            | "צפה" (PDF link) + "רישום תשלום" (opens modal)         |

- KPI strip: 2 cards
  - "סה"כ חוב פתוח" — `sum(row.outstandingAgorot) → shekels` (danger color)
  - "מס׳ חשבוניות פתוחות" — `rows.length`
- Filters: company select (existing) + free-text search on `invoiceNumber` and `organizationName/customerName`.
- Sort: descending by `invoiceDate`.
- Remove the legacy "הפק חשבונית" inline button — that flow lives on `AdminInvoicesPage` and shouldn't be duplicated here.
- Action button "רישום תשלום" calls `modalApi.openModal("recordInvoicePayment", { row, onSaved: () => loadOpenInvoices() })`.

**Helper:** add `fmtMoneyFromAgorot(n: number)` to convert integer agorot → shekel-formatted string. Place inside the file (matches `fmtMoney` convention) — do NOT add to `packages/core` (single-use).

### F-2. Add `appApi.admin.getOpenInvoices` — S

**File:** `apps/store/src/appApi/index.ts`

Insert after `getDeliveryNotes` (~line 615). Use the same `FirebaseApi.firestore.listV2<TOrder>` pattern with the where clauses from §2.1. Map each `TOrder` → `OpenInvoiceRow` in the success path. Filter `outstandingAgorot > 0` client-side after the map.

```ts
getOpenInvoices: async ({ fromDate, toDate }: { fromDate: number; toDate: number }) => {
  if (!isValidAdmin) return;
  const result = await FirebaseApi.firestore.listV2<TOrder>({ /* see §2.1 */ });
  if (!result?.success) return result;
  const rows = (result.data ?? [])
    .map((o) => mapOrderToOpenInvoiceRow(o))
    .filter((r) => r !== null)
    .filter((r) => r.outstandingAgorot > 0);
  return { success: true, data: rows };
},
```

`mapOrderToOpenInvoiceRow` is a local pure helper. It:

- Returns `null` if neither `o.ezInvoice?.doc_uuid` nor `o.invoice?.id` is present (defensive — should be redundant given the `where` clause).
- Computes `invoiceTotalAgorot = Math.round((o.cart?.cartTotal ?? o.ezInvoice?.calculatedData?.price_total ?? 0) * 100)`. **Legacy data lives in shekels** (`cart.cartTotal` is a float ILS); convert at the boundary, per `accrueOnDeliveryNoteCreated.ts` line 89 precedent. Same shekel→agorot pattern.
- Reads `paidAmountAgorot = o.invoicePaidAmount ?? 0`.
- `outstandingAgorot = Math.max(0, invoiceTotalAgorot - paidAmountAgorot)`.
- Excludes orders where `o.paymentStatus === "completed" && o.invoicePaidAmount === undefined` (legacy-paid invoices that pre-date Phase B).
- Excludes orders where `o.invoice?.status === "cancelled"`.

### F-3. Add `RecordInvoicePaymentModal` — M

**New file:** `apps/store/src/widgets/Modals/RecordInvoicePaymentModal.tsx`

Pattern: copy structure of `InvoiceDetailsModal.tsx` (form-heavy, modal-API-driven, uses `@heroui/react`, validates client-side, calls `FirebaseApi.api.postManualTransaction`).

Props:

```ts
type Props = {
  row: OpenInvoiceRow;
  onPaymentRecorded?: () => void;
};
```

Form fields (matching the demo verbatim, see `demo/balasi-store-site-2026-06-12/admin.js:7640-7676`):

| Field           | Type                | Default                            | Validation                                  | Label                |
| --------------- | ------------------- | ---------------------------------- | ------------------------------------------- | -------------------- |
| `amountShekels` | number, step 0.01   | `outstandingAgorot / 100`          | `> 0`, `<= outstandingShekels + 0.01`       | סכום ששולם           |
| `paymentDate`   | date (yyyy-mm-dd)   | today (Israel TZ, per existing pattern) | required                                | תאריך תשלום          |
| `paymentMethod` | select              | `bank_transfer`                    | required                                    | אמצעי תשלום          |
| `note`          | text                | empty                              | optional                                    | הערה                 |

`paymentMethod` enum (English keys, Hebrew labels) — see §5.7 for justification:

| Key             | Hebrew label   |
| --------------- | -------------- |
| `bank_transfer` | העברה בנקאית   |
| `check`         | המחאה          |
| `credit_card`   | אשראי          |
| `cash`          | מזומן          |
| `bit`           | ביט / Pay      |

Read-only summary block at top of modal:

```
לקוח:           {row.organizationName ?? row.customerName}
סכום החשבונית:  ₪{fmtMoneyFromAgorot(invoiceTotalAgorot)}
שולם עד כה:     ₪{fmtMoneyFromAgorot(paidAmountAgorot)}
יתרה לתשלום:    ₪{fmtMoneyFromAgorot(outstandingAgorot)}   (orange)
```

Submit handler:

```ts
async function onSubmit() {
  const amountAgorot = Math.round(parseFloat(form.amountShekels) * 100);
  const nonce = crypto.randomUUID();
  const res = await FirebaseApi.api.postManualTransaction({
    amount: amountAgorot,
    idempotencyKey: `inv-pay-${row.invoiceDocUuid}-${nonce}`,
    reference: { type: "invoice", id: row.invoiceDocUuid },
    payer: {
      organizationId: row.organizationId ?? undefined,
      clientId:       row.clientId ?? undefined,         // sourced from o.client?.id in the row mapper
      billingAccountId: row.billingAccountId ?? undefined,
    },
  });
  if (!res?.success) { /* toast error */ return; }
  // Note: don't pass payment method/date/note to the backend on Phase B —
  // they are display-only metadata; the ledger tx record + AR settlement entry
  // are the source of truth for "what was paid when". If we later need
  // payment-method analytics, see §5 "payment method storage" decision.
  onPaymentRecorded?.();
  modalApi.closeModal("recordInvoicePayment");
}
```

**Important:** Phase B does NOT persist `paymentMethod`, `paymentDate`, or `note` to the backend. The fields exist in the modal for UX parity with the demo and to set user expectation, but storing them requires a new "receipts" entity (§5.8). The plan recommends shipping Phase B without receipts and adding them in a follow-up if the owner needs them. **Flag for user decision in Section 5.**

### F-4. Register the new modal — S

**File:** `apps/store/src/widgets/Modals/index.tsx`

Add to the `modals` map (~line 24):

```ts
recordInvoicePayment: ({ row, onPaymentRecorded }: { row: OpenInvoiceRow; onPaymentRecorded?: () => void }) => (
  <RecordInvoicePaymentModal row={row} onPaymentRecorded={onPaymentRecorded} />
),
```

Import at the top. `OpenInvoiceRow` is imported from a new shared location (see §6 — recommend `apps/store/src/appApi/index.ts` since it's already the API boundary, or extract to `apps/store/src/types/openInvoice.ts` if both the modal and the page need it without circular imports).

### F-5. Verify `AdminBudgetOrganizationPage` is unaffected — S

**File:** `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx` (lines 399–694)

This page calls `FirebaseApi.api.getBudgetAccount` + `getBudgetTransactions` and renders the per-org ledger. Neither call touches the order doc directly — they read from the AR rollup + entries (which are written by the existing `settleOnTransactionPosted` subscriber, unchanged). **No code change needed**, but the implementer must read this page and confirm it still type-checks after the `Order` schema additions.

---

## 5. Edge cases & decisions

| # | Edge case                                                                  | Recommendation                                                                                                                                                                                                                                                              |
| - | -------------------------------------------------------------------------- | --- |
| 1 | Overpayment (amount > outstanding)                                         | **Block at the client**. `max={outstandingShekels}` on the input, server-side check rejects with `error: "overpayment"`. Overpayment would silently feed the org's AR `credit` field (which `writeArEntry` handles gracefully) — but for invoice tracking, capping at outstanding is the clearer UX. |
| 2 | Multiple partial payments on the same invoice                              | **Supported.** Each modal submit generates a fresh nonce → new `idem_` doc id → new transaction. Subscriber appends to `invoicePaidAppliedTxIds` array. Once cumulative reaches `invoiceTotalAgorot`, invoice falls out of list. |
| 3 | Shekel ↔ agorot rounding                                                   | **Convert at the modal boundary.** Modal collects shekels, multiplies by 100, rounds. Server stores integer agorot end-to-end. List view converts agorot → shekels at render. Matches `accrueOnDeliveryNoteCreated.ts` precedent. |
| 4 | Cancelled invoices                                                         | **Exclude from list.** Filter `o.invoice?.status !== "cancelled"` client-side. EZcount invoices have no cancellation field — assume they're never cancelled (issue credit note instead). |
| 5 | Legacy EZcount invoices created before Phase B (no `invoicePaidAmount`)    | **`undefined` → 0.** A legacy invoice with `paymentStatus === "completed"` AND `invoicePaidAmount === undefined` is excluded from the list (already paid via the order-level flow). Legacy unpaid invoices show with `paid = 0, outstanding = total` — exactly correct. |
| 6 | Payment method enum                                                        | `bank_transfer` / `check` / `credit_card` / `cash` / `bit`. Mirror the demo's 5 options. English keys for code, Hebrew labels for UI. **Do NOT persist on Phase B** (see #8). |
| 7 | `postManualTransaction` succeeds but settlement subscriber fails           | This is the durability story. The tx write is committed (money is "in the ledger"), the event is emitted in the same Firestore transaction, and the event bus retries on failure. The UI will show the invoice as **still outstanding** until the subscriber lands — surfacing the inconsistency rather than hiding it. **Operational mitigation:** the existing `reconcileOrganizationBalanceSchedule` nightly job catches drift at the org level; we add an analogous best-effort verifier in Phase C (out of scope). |
| 8 | Persist `paymentMethod`, `paymentDate`, `note` server-side?                | **Phase B: no.** They are display-only — the ledger transaction record is the system of record for what was paid when. If owner needs receipts (printable, per-payment), that's a follow-up: introduce a `receipts` collection keyed by `transactionId`. Flag this for the user. |
| 9 | Two admins both click "רישום תשלום" on the same invoice within seconds    | Both submits generate their own UUID nonce → two independent transactions → both apply. **This is intentional** for partial payments. If the owner wants a "lock", that's a future Phase C concern. |
| 10 | Future hyp_capture on an order that was already invoice-paid manually     | The order's `paymentStatus` already === "completed"; `markOrderPaidOnTransactionPosted` skips (terminal status guard, line 137). AR gets a settlement entry, pushing the org into `credit`. **No bug** — just a real-world overpayment that resolves itself. |
| 11 | EZcount invoice with `success: false` (rare error case)                    | Excluded by the `ezInvoice.success == true` where clause. Never appears in list. |

---

## 6. Shared package changes (`packages/core`)

| File                                              | Change                                                                                                | Effort |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ |
| `packages/core/lib/entities/Order.ts`             | Add `invoicePaidAmount?: number`, `invoicePaidAppliedTxIds?: string[]` to `OrderSchema`               | S      |
| `packages/core/package.json`                      | Minor bump                                                                                            | S      |
| `apps/store/package.json`                         | Pin to new core version                                                                               | S      |
| `functions/package.json`                          | Pin to new core version                                                                               | S      |

**`OpenInvoiceRow` does NOT go in `@jsdev_ninja/core`.** It's a frontend-only shape used by the admin page and the modal. Putting it in core would force backend to depend on a row shape it doesn't write. Co-locate in `apps/store/src/appApi/index.ts` (the existing `OrganizationAction` type pattern at line 422–433 is the precedent).

---

## 7. Phasing

### Phase A — frontend-only pivot (1 day, no schema change)

What ships:

- Replace the DN list with an invoice list using the existing `o.invoice` / `o.ezInvoice` shape, no new fields.
- Action button → `postManualTransaction({ reference: { type: "order", id: o.id }, … })` — uses the existing order reference type, no schema extension.
- **No "שולם עד כה" column** — the table shows only invoice total and outstanding (= total when unpaid, hidden when paid).
- Invoice drops off the list once `o.paymentStatus === "completed"` (driven by existing `markOrderPaidOnTransactionPosted`).
- Modal collects the same 4 fields but only `amount` is used; `paymentDate`, `paymentMethod`, `note` are silently discarded. (The fields exist so the UI matches the demo, setting owner expectation for Phase B.)

**Limitation:** binary paid/unpaid. No partial payments. Two consecutive payments on the same invoice would both flag the order as paid on the first one; second tx is a no-op via the `terminal status` guard.

**Safe for app-owner (David) to merge?** Yes — no schema change, no `@jsdev_ninja/core` bump, no backend touched, no breaking change. Frontend-only feature work that the CLAUDE.md rules permit under his role.

### Phase B — full per-invoice tracking (3–4 days)

What ships: everything in §2–4. Partial payments, "שולם עד כה" column, accurate `outstanding`.

**Requires developer (Philip) approval** — bumps `@jsdev_ninja/core`, edits backend subscribers, adds a Firestore index. Not safe for app-owner to ship alone.

### Recommendation: **Ship Phase A first**

Reasoning:

1. The demo shows the *target* UI — but the owner has already lived without a customer-debts payment workflow at all. Going from "nothing" → "binary paid/unpaid with a payment modal" is a material upgrade and validates the UX before committing to per-invoice ledgering.
2. Phase A keeps the schema additive. If Phase B needs to be redesigned (e.g. owner decides receipts are mandatory), zero rollback cost.
3. Phase B is invasive (subscriber, schema, index) — better to ship after Phase A's UX has 1–2 weeks of real use.
4. Phase A is the smallest change that lets the owner *use the system today*. The owner is non-technical (per CLAUDE.md) and the demo conversation made the "modal + button" UX the headline; the partial-payment detail is invisible until two payments actually happen.

**Tradeoff to name explicitly:** Phase A cannot represent two payments on one invoice. If the store regularly takes a deposit and then a balance payment on the same invoice, skip Phase A entirely and ship B. (Likely doesn't apply to balasistore based on the demo's primary use case = recurring B2B invoices paid in full.)

---

## 8. Files touched — final list

### [SHARED] (Phase B only)

| File                                       | Change                                          | Effort |
| ------------------------------------------ | ----------------------------------------------- | ------ |
| `packages/core/lib/entities/Order.ts`      | Add 2 optional fields to `OrderSchema`          | S      |
| `packages/core/package.json`               | Minor version bump                              | S      |

### [BACKEND] (Phase B only)

| File                                                                                            | Change                                                                       | Effort |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| `functions/src/modules/ledger/api/postManualTransaction.ts`                                     | Add `"invoice"` to reference type enum                                       | S      |
| `functions/src/modules/ledger/types.ts`                                                         | Mirror `"invoice"` in `TransactionSchema.reference.type`                     | S      |
| `functions/src/modules/ledger/events.ts`                                                        | Mirror `"invoice"` in `TransactionPostedPayload.reference.type`              | S      |
| `functions/src/modules/documents/subscribers/updateInvoicePaidAmountOnTransactionPosted.ts`     | **NEW** — invoice-level settlement subscriber                                | M      |
| `functions/src/modules/documents/internal/findOrderByInvoiceUuid.ts`                            | **NEW** — Firestore lookup helper                                            | S      |
| `functions/src/modules/documents/index.ts`                                                      | Export new subscriber                                                        | S      |
| `functions/src/index.tsx`                                                                       | Wire new subscriber alongside existing ones                                  | S      |
| `functions/src/modules/orders/subscribers/markOrderPaidOnTransactionPosted.ts`                  | Handle `reference.type === "invoice"` via order lookup                       | M      |
| `firestore.indexes.json`                                                                        | Composite index for `(companyId, storeId, ezInvoice.doc_uuid)`               | S      |
| `functions/package.json`                                                                        | Pin to new `@jsdev_ninja/core` version                                       | S      |

### [FRONTEND]

| File                                                                                   | Phase | Change                                                                                        | Effort |
| -------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------- | ------ |
| `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx`                       | A + B | Rewrite `AdminBudgetPage` list export only (don't touch `AdminBudgetOrganizationPage`)        | M      |
| `apps/store/src/appApi/index.ts`                                                       | A + B | Add `getOpenInvoices` method (Phase A: simpler row shape) + `OpenInvoiceRow` type             | M      |
| `apps/store/src/widgets/Modals/RecordInvoicePaymentModal.tsx`                          | A + B | **NEW** — payment-recording modal                                                             | M      |
| `apps/store/src/widgets/Modals/index.tsx`                                              | A + B | Register `recordInvoicePayment` in `modals` map                                               | S      |
| `apps/store/src/lib/firebase/api.ts`                                                   | B     | Add `"invoice"` to `postManualTransaction` wrapper's reference type                           | S      |
| `apps/store/package.json`                                                              | B     | Pin to new `@jsdev_ninja/core` version                                                        | S      |

**Estimated total effort:**
- Phase A: ~1 day (1 frontend coder)
- Phase B: ~3–4 days (1 backend coder + 1 frontend coder, can run in parallel after the core bump lands)

---

## 9. Security invariants

Every coder agent must uphold these:

1. **Auth on the API:** `postManualTransaction` requires `admin` custom claim (already enforced). The new `getOpenInvoices` query runs through `useAppApi` which gates on `isValidAdmin` — same precedent as `getDeliveryNotes`.
2. **Tenant isolation:** all Firestore reads/writes use `FirebaseAPI.firestore.getPath({ companyId, storeId, … })`. **Never hand-build a path.** `findOrderByInvoiceUuid` must filter on both `companyId` AND `storeId` AND `ezInvoice.doc_uuid` — three-clause filter. A two-clause filter on `(storeId, doc_uuid)` would leak across companies.
3. **`companyId` / `storeId` come from the auth token** in callables, from `ctx` in subscribers, and from the active store in `appApi` — never from client input on the new modal or any new API.
4. **Money on the wire:** `amount` is integer agorot. The new subscriber MUST read `storedTx.amount` from the stored transaction doc, not from the event payload (matches `settleOnTransactionPosted.ts` line 115 — defense-in-depth against tampered event replays).
5. **No secrets in logs:** the new subscriber logs `transactionId`, `orderId`, `amount`, `invoiceDocUuid` — never `payer.clientId`-as-raw-PII, never customer email or address.
6. **Idempotency on the order-doc update:** `invoicePaidAppliedTxIds` array is the dedup gate. A subscriber retry must observe the existing applied id and skip. The Firestore transaction (`db.runTransaction`) makes the read-and-update atomic per order doc — no race condition between two concurrent retries.
7. **Reference forgery:** a client cannot point `reference.id` at someone else's invoice — `postManualTransaction` does not currently verify that the `reference.id` belongs to the authenticated tenant. **NEW: add a verification step** in `postManualTransaction.ts` when `reference.type === "invoice"`: call `findOrderByInvoiceUuid(companyId, storeId, reference.id)` and reject (return `{ success: false, error: "invoice_not_found" }`) if no match. Same check should be retrofitted to `reference.type === "order"` in a follow-up plan but is out of scope here.
8. **Payment method enum** is a closed set. The InputSchema (if/when we persist it server-side in a Phase C "receipts" change) must use `z.enum([...])` — no free-text. For Phase B the field is client-only and not sent.

---

## 10. Risks & open questions

### Risks

- **R1 — invoice→order lookup overhead.** Every invoice-routed payment triggers two subscribers (`updateInvoicePaid` + `markOrderPaid`), each running its own `findOrderByInvoiceUuid` query. At balasistore's scale (likely <50 invoice payments/day) this is negligible. At 100k+ stores it would be worth caching the order in the subscriber via the event payload. *Out of scope for this plan.*
- **R2 — applied-tx-ids array growth.** Bounded in practice (<10 entries per invoice). Document a warning log threshold (>100 entries → log error) and revisit if it ever fires.
- **R3 — index latency.** New composite index takes 1–5 minutes to build after deploy. During that window, the new subscriber's `findOrderByInvoiceUuid` will throw "requires an index" — the event bus will retry, but admins might see "outstanding" not update for the first few payments. **Mitigation:** deploy the index in a prior PR (CI auto-deploys `firestore.indexes.json`), wait for it to build, then deploy the subscriber.
- **R4 — Phase A → Phase B migration.** Invoices paid via Phase A (`reference.type === "order"`) won't get `invoicePaidAmount` set, since the new subscriber filters on `reference.type === "invoice"`. After Phase B deploy, those orders show `paid = 0, outstanding = total` *but* are excluded by the `paymentStatus === "completed" && invoicePaidAmount === undefined` filter (§3 B-7). They never re-appear in the list. **OK.**

### Open questions for user

- **Q1** — Receipts. Does the owner want each payment to produce a printable/numbered receipt? If yes, this is a separate "Phase C" plan (introduces a `receipts` collection, `paymentMethod`/`paymentDate`/`note` get persisted via that collection, not as fields on the transaction). For Phase B, recommend deferring.
- **Q2** — B2C invoices. The current `settleOnTransactionPosted` skips when `payer.organizationId` is absent (B2C). The new `updateInvoicePaid` subscriber does NOT have that guard — it tracks payment regardless of payer type. **Confirm:** is per-invoice payment tracking desirable for B2C orders too? (Recommend yes — there's no downside; the field is just `undefined` for orders that never get a payment recorded.)
- **Q3** — Aging buckets. The demo shows 0–30 / 31–60 / 60+ day buckets in its KPI strip; the user's task description says "explicitly out of scope". Confirming that's still the call. The plan ships only the "total" KPI and the "count" KPI.
- **Q4** — Reference verification gap. §9 invariant #7 calls for adding `reference.id` ownership verification in `postManualTransaction`. This is a *latent security gap that already exists for `reference.type === "order"`*. Should we (a) fix only the new "invoice" branch and leave the order branch alone, (b) fix both in this plan, or (c) defer both to a security-hardening plan? Recommend **(a) — fix the new branch only**, file (c) as a follow-up. The existing order-branch gap is mitigated by `markOrderPaidOnTransactionPosted` re-reading the order doc by id (a forged orderId would fail the read).
- **Q5** — Frontend test stores. Per CLAUDE.md "Dev / Preview Rules", use `dev:test` and `dev:test2` for verification. Confirm test stores have at least one B2B order with `ezInvoice.success === true` to QA against, or seed one.

---

## 11. Out of scope (explicit)

- Reminders to customers (no email/SMS sending)
- Due-date / aging buckets (no `dueDate` field on invoice)
- Supplier invoices (`חשבוניות ספק` — separate page)
- Multi-currency (everything is ILS / agorot)
- Bulk recording of payments (single-invoice modal only)
- Per-payment receipts collection (Phase C if Q1 is yes)
- Backwards-compatible payment-method persistence (Phase C)
- Reference-id ownership verification for `reference.type === "order"` (deferred, see Q4)
- Editing or voiding a recorded payment (use the existing org-ledger "credit_note" manual transaction for corrections — `AdminBudgetOrganizationPage`)
- Drill-through from invoice row to a "payment history for this invoice" panel (Phase C; for now, the org-level ledger view shows all transactions for the org)
