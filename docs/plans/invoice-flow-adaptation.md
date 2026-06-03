# Plan: adapt the demo's invoice / delivery-note document flow to our app

**Status:** Analysis — not started.
**Source studied:** `migration-new-ui/balasi-all/` (static HTML/JS demo, no real backend) — `admin.js` (`generateInvoiceFromDN`, `confirmGenerateInvoiceFromDN`, `openDeliveryNotePicker`, `recordPayment`, `setAllocationNumber`, `viewCredit`), `admin.html` (invoices section).
**Why:** the demo encodes the intended Israeli B2B accounts-receivable document chain. Our app currently embeds the delivery note on the order and stores the invoice as an opaque EZcount blob — no real entities or lifecycle.

---

## 1. Demo document model (target)

All first-class entities in `DB`, linked by id:

```
Order → DeliveryNote → Invoice → Receipt (if paid) / CreditNote (if credited)
```

- **DeliveryNote** `{ id, number, companyId, accountId, orderId, items[], billed:bool, invoiceId }`
  - Each **line** has a fulfillment status: `delivered` | `missing` (חסר במלאי, struck through). The picker (`openDeliveryNotePicker`) edits these per DN.
  - `billed` flips to `true` when an invoice is issued from it; `invoiceId` links the two. A billed DN **cannot be re-invoiced**.
- **Invoice** `{ id, number:"INV-YYYY-NNNN", companyId, accountId, orderId, deliveryNoteId, date, dueDate, amount, vatAmount, vatExemptBase, paid:number, allocationNumber, isTaxInvoiceReceipt:bool, notes, items[] }`
- **Receipt** `{ id, number:"RCP-YYYY-NNNN", companyId, invoiceId, date, amount, method }` — created when an invoice is paid.
- **CreditNote** (`DB.credits`) — תעודת זיכוי / negative tax invoice, with ITA-mandated fields, references the original invoice.

## 2. Create-invoice UX / logic (demo)

**Single DN → invoice** (`generateInvoiceFromDN` → `confirmGenerateInvoiceFromDN`):
1. DN action **"הפק חשבונית מהתעודה"**, shown only when `!dn.billed`. If already billed → action swaps to **"הזן/ערוך מספר הקצאה"** (manage the linked invoice's allocation number).
2. Modal: preview (customer, DN number, item count, total incl. VAT) + pick **invoice date** + **due date** (default **+30 days**).
3. Confirm → create invoice (`paid:0`, items copied from DN) → **`dn.billed = true` + `dn.invoiceId = newId`**.
4. **Allocation number (מספר הקצאה — ITA / "חשבונית ישראל"):** if total ≥ threshold (~₪10,000) it's **mandatory** (warn + capture now); below threshold optional. Allocation modal opens automatically post-create.

**Two invoice types:**
- **חשבונית מס** (tax invoice) — bill-now / pay-later: `paid:0`, `dueDate +30`, settled later via `recordPayment`. (Accounts receivable.)
- **חשבונית מס-קבלה** (tax invoice-receipt) — paid at order time (credit card): `isTaxInvoiceReceipt:true`, `paid:total`, `dueDate:today`, **+ matching Receipt**.

**Payment lifecycle:** `recordPayment(invoiceId)` against the **invoice** — tracks `paid` (partial supported) → status `unpaid / paid / overdue` (overdue = past `dueDate`, not fully paid). `invoiceStatusPill` renders it.

## 3. Critical finding — cardinality mismatch

- **Demo: 1 DN → 1 invoice** (strict 1:1; invoice carries a single `deliveryNoteId`/`orderId`).
- **Our app today: N DNs → 1 consolidated invoice** ("חשבונית מרוכזת"; `AdminInvoicesPage` multi-selects orders, `createInvoice` takes `orders[]`).

These are incompatible models. **Decision required:** keep our consolidated N:1, adopt the demo's 1:1, or support both. (Israeli practice allows a tax invoice covering multiple delivery notes, so N:1 is legitimate — but then `billed`/`invoiceId` must be set on *every* included DN, and allocation/receipt logic must handle the aggregate.)

## 4. The reframe (resolves the earlier confusion)

"Mark the delivery note when invoiced" = **`billed = true` + `invoiceId`**, NOT `status:"paid"`.
**"Paid" is an *invoice* concept** (`recordPayment` → receipt), not a delivery-note one. Our earlier attempt set `order.deliveryNote.status = "paid"`, conflating *billed* (DN↔invoice link) with *paid* (invoice settled). The demo keeps them separate — correct accounting.

## 5. Gap vs current app

| Concept | Demo (target) | Our app today |
|---|---|---|
| Delivery note | own entity; `billed`+`invoiceId`; per-line `delivered/missing` | **embedded on order** (`order.deliveryNote`), single `status` enum |
| Invoice | own entity; `dueDate`, `paid`, `allocationNumber`, receipt link, type flag | `order.invoice` (EZcount blob); no lifecycle; list reads `order.ezInvoice` (mismatch) |
| Cardinality | 1 DN → 1 invoice | N DNs → 1 consolidated invoice |
| Allocation number (ITA) | first-class, threshold-enforced | **absent** |
| Receipts | own entity | absent |
| Credit notes | own entity | absent |
| "Paid" recorded on | the **invoice** (receipt) | the **budget/ledger** (debt reduction) |

## 6. Reconciliation with our budget + ledger (the big overlap)

Our app already has an event-driven **budget** (org debt) + **ledger** (transactions) settling payment: `order.placed → debt_increase`, charge/manual → `transaction_posted → reduceDebt`. The demo settles payment on the **invoice** (receipt).

**These two "payment" notions must not double-count.** Decision needed:
- **Option A — invoice is documentation only:** invoices/DNs/receipts are accounting documents; the **ledger stays the source of truth** for debt. Issuing an invoice marks the DN `billed`; recording a payment posts a **ledger transaction** (reusing `postManualTransaction`/`reduceDebtOnTransactionPosted`) AND a receipt. Single source of truth = ledger. **Recommended.**
- **Option B — invoice is the AR ledger:** move debt tracking onto invoices (`paid`/`dueDate`/overdue) and retire the budget module. Larger, throws away working code.

## 7. Proposed adaptation (phased — for later)

1. **Entities in `@jsdev_ninja/core`:** promote `DeliveryNote` to its own collection (`{companyId}/{storeId}/deliveryNotes`) with `billed`/`invoiceId` + per-line fulfillment status; add `Invoice`, `Receipt`, `CreditNote` schemas (`number`, `dueDate`, `paid`, `allocationNumber`, `isTaxInvoiceReceipt`, links). Keep `order.deliveryNote`/`order.invoice` as denormalized mirrors during migration.
2. **Backend:** `createDeliveryNote` writes the DN entity (not just embedded). `createInvoice` writes an Invoice entity, sets `billed`/`invoiceId` on each included DN, enforces allocation-number threshold. New `recordPayment` → posts a **ledger** transaction (Option A) + writes a Receipt.
3. **Allocation number:** capture flow + threshold from settings; block/flag per ITA rules.
4. **Frontend:** DN list + invoice list read the new entities; invoice modal adds due-date + allocation-number; "issue invoice" guarded by `billed`; payment button → recordPayment.
5. **Migration:** backfill DN/invoice entities from existing `order.deliveryNote`/`order.invoice`.

**Difficulty: LARGE** (multi-entity model, ITA allocation, payment lifecycle, migration, budget reconciliation). Best split into the phases above, decided behind Options in §3 and §6 first.

## 8. Open decisions (answer before building)
1. **Cardinality** (§3): 1:1, keep N:1 consolidated, or both?
2. **Payment source of truth** (§6): Option A (ledger stays, recommended) or B (invoice becomes AR)?
3. **Allocation number threshold** + whether we integrate the ITA "חשבונית ישראל" API now or just capture the number manually.
4. **Scope of v1:** documents-only (DN/invoice/receipt entities + UX) first, defer credit notes?

## Key files
- Demo: `migration-new-ui/balasi-all/admin.js` (`generateInvoiceFromDN`, `confirmGenerateInvoiceFromDN`, `recordPayment`, `setAllocationNumber`, `viewCredit`, `openDeliveryNotePicker`), `admin.html` (invoices section).
- Ours: `functions/src/appApi/index.ts` (createDeliveryNote), `functions/src/modules/documents/api/createInvoice.ts`, `packages/core/lib/entities/{DeliveryNote,Invoice,Order}.ts`, `apps/store/src/pages/admin/AdminInvoicesPage/`, `apps/store/src/widgets/Modals/{CreateInvoice,InvoiceDetails,CreateDeliveryNote}Modal.tsx`, budget/ledger modules.
