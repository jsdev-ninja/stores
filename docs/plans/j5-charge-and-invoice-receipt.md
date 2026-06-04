# Plan: J5 approve → charge card + issue חשבונית מס קבלה (tax invoice-receipt)

**Status:** Spec for review — not implemented.
**Requested by:** App owner (David). **Needs:** developer (Philip) approval — touches payment capture + a legal tax document.
**Related docs:** [`order-approve-flow.md`](./order-approve-flow.md) (J5 approve = charge, no DN — already DECIDED), [`invoice-flow-adaptation.md`](./invoice-flow-adaptation.md) (document model; defines חשבונית מס-קבלה).

---

## Goal (owner's words, paraphrased)

For **credit-card (J5)** orders, the admin approval should NOT produce a **delivery note**.
Instead, the single approve action should:

1. **Charge the card** (capture the J5 hold), and
2. **At that same moment, issue a חשבונית מס קבלה (tax invoice-receipt, EzCount doc type `INVOICE_RECEIPT = 320`).**

**Owner decision (recorded):** for J5, the **חשבונית מס קבלה fully REPLACES the delivery note** — no DN is created for J5 orders.

So per payment type the approve outcome becomes:

| paymentType | charge card? | document issued |
| ----------- | ------------ | --------------------------------- |
| `external`  | no (credit terms) | תעודת משלוח (DELIVERY = 200) — unchanged |
| **`j5`**    | **yes (capture)** | **חשבונית מס קבלה (INVOICE_RECEIPT = 320)** ← new |
| `none`      | no | none |

---

## Current state (confirmed in code)

- **Approve entry:** `apps/store/src/appApi/index.ts` → `approveOrder` (~L1080): for `j5` calls `chargeOrder`, then sets `status: "completed"`. For `external` it relies on the trigger to make the DN.
- **Charge:** `functions/src/modules/payments/api/chargeOrder.ts` — captures the J5 hold via `hypPaymentService.chargeJ5Transaction`, builds `heshDesc` from cart items, **fits the amount to the items sum**, posts a ledger `hyp_capture` → `transaction_posted` → `markOrderPaidOnTransactionPosted` sets `order.paymentStatus = "completed"`.
- **Document creation today:** `functions/src/modules/orders/services/completeOrder.ts` (fired by `onOrderUpdate` on `status → "completed"`) creates a **delivery note ONLY for `paymentType === "external"`**; for `j5`/`none` it currently **creates no document**. → This is exactly the slot to fill for J5.
- **EzCount doc types:** `functions/src/services/ezCountService/index.ts` already defines `INVOICE_RECEIPT = 320` (חשבונית מס קבלה) — **defined but unused today**. `DELIVERY = 200` and `TAX_INVOICE = 305` are in use.
- **Existing invoice api:** `functions/src/modules/documents/api/createInvoice.ts` produces a **consolidated TAX_INVOICE (305)** for `orders[]` (manual, multi-order). There is **no single-order INVOICE_RECEIPT (320)** path yet.
- **Templates / PDF:** `functions/src/services/documents/templates/Invoice.tsx` + `InvoiceLayout.tsx`, rendered to PDF via Puppeteer (`functions/src/services/documents/index.ts`). A receipt can reuse the invoice template (or a thin variant labelled "חשבונית מס קבלה").

**Good news:** every building block exists. This is mostly *composition* + one new doc-type path, not new infrastructure.

---

## Proposed implementation

### A. New backend service: issue a single-order חשבונית מס קבלה
- Add `functions/src/modules/documents/api/createInvoiceReceipt.ts` (or a `services/createInvoiceReceipt.ts`) that calls EzCount with `docType = INVOICE_RECEIPT (320)` for **one order**, using the **actual charged amount** (the corrected cart total — see note below).
- Store the result on the order, e.g. `order.invoiceReceipt` (number, link, items, amount) + `order.ezInvoiceReceipt` (raw EzCount blob), mirroring how `deliveryNote` / `ezDeliveryNote` are stored.
- Emit an `invoiceReceiptCreated` event (mirror `deliveryNoteCreated`).

### B. Wire it into the J5 completion path
- In `completeOrder.ts`, add a branch: `paymentType === "j5"` → call `createInvoiceReceipt(order)` instead of the DN. Keep `external` → DN. Keep `none` → nothing.
- Because the **charge happens in `approveOrder` (frontend) before the status write**, and the document is created **backend-side in the trigger**, the receipt is issued only after the order reaches `completed` (which only happens on a successful charge). Good — but see the atomicity decision below.

### C. Amount correctness (ties into the weight feature)
- The receipt MUST be for the **amount actually charged**. `chargeOrder` already fits the captured amount to the cart items sum. With the new **admin weight-correction** feature (precise kg in the order-edit screen), the final cart total reflects real weights — so the receipt will show the correct, charged amount. Ensure `createInvoiceReceipt` reads the **same final total** that `chargeOrder` captured (ideally derive both from one source, or pass the captured amount through).

---

## Open decisions for Philip (⚠️ must resolve before build)

1. **Atomicity / failure handling.** Charge (frontend) and receipt (backend trigger) are two steps. Define behavior when:
   - charge succeeds but receipt issuance fails → order is **paid but has no legal document**. Need retry/repair (reconciliation job, or a "re-issue receipt" admin action).
   - Consider moving **charge + receipt into one backend service** (callable) for a single atomic, idempotent operation, instead of frontend-charge + trigger-document. This also fixes the separate "stuck" bug below.
2. **Idempotency of the legal doc.** Receipt creation must use a deterministic dedup key (e.g. `order.id`) so retries never mint **two** tax documents. EzCount numbering is sequential and irreversible.
3. **HYP `SendHesh` vs EzCount receipt — avoid double receipts.** `chargeOrder` currently sends `SendHesh: "True"` + `heshDesc` to HYP (HYP may email its own invoice). If EzCount now issues the official חשבונית מס קבלה, decide whether to **turn HYP's `SendHesh` off** to avoid two receipts to the customer.
4. **Allocation number (מספר הקצאה / "חשבונית ישראל").** Per `invoice-flow-adaptation.md`, tax invoices above the ITA threshold require an allocation number. Decide if/when J5 receipts need this (most grocery orders are below threshold, but confirm).
5. **Existing "stuck" orders.** We already observed an order with `status: completed` + `paymentStatus: pending_j5` (completed but never charged, and no document). The new flow should **prevent** completing J5 without a successful charge, and we should decide how to **repair** existing stuck orders (one-off script / admin action) — DB touch ⇒ Philip only.
6. **UI copy.** The approve button for J5 should read e.g. **"✓ אשר → חיוב + חשבונית מס קבלה"** (vs "✓ אשר → תעודת משלוח" for external). `OrderDetailsModal.tsx` `actions()` + `AdminOrderPageNew.tsx`.

---

## Files likely to change
- `functions/src/modules/documents/api/createInvoiceReceipt.ts` (new)
- `functions/src/modules/documents/events.ts` (new event)
- `functions/src/modules/orders/services/completeOrder.ts` (j5 branch → receipt)
- `functions/src/services/documents/templates/` (receipt label/variant)
- `packages/core` Order entity (`invoiceReceipt` / `ezInvoiceReceipt` fields) — **schema change ⇒ core version bump + Philip approval**
- `apps/store/src/widgets/Modals/OrderDetailsModal.tsx`, `apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx` (button copy/flow)
- Possibly `functions/src/modules/payments/api/chargeOrder.ts` (toggle `SendHesh`, or fold receipt into charge)

## Risk
**High-sensitivity** — money capture + a legal tax document with irreversible sequential numbering. Requires careful idempotency, failure handling, and accounting review. Not an owner-approvable change.
