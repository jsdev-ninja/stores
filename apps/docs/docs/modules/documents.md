---
sidebar_position: 2
title: Documents
---

# Documents Module

`functions/src/modules/documents`

Owns issuance of customer-facing **tax documents** — delivery notes (תעודת משלוח)
and tax invoices (חשבונית מס) — by delegating to **EZcount** and persisting the
returned doc shape onto the source `Order`. Documents are **not** ledger
transactions; this module never touches money balances. The ledger module
subscribes to events fired here when it needs to accrue debt.

:::info Document storage convention
Delivery notes and invoices are **embedded on the source `Order` document**
(`order.deliveryNote`, `order.invoice`, plus the EZcount mirror fields
`order.ezDeliveryNote`, `order.ezInvoice`). There are **no** `deliveryNotes`
or `invoices` Firestore collections of their own. Reads always go through the
order.
:::

:::info Money & time conventions
EZcount expects **shekels** (floats); we convert at the boundary in
`ezCountService`. Event payloads forwarded to the ledger carry **integer
agorot**. Dates sent to EZcount are `DD/MM/YYYY`; everything stored internally
is epoch **millis**.
:::

## Collections

There are no module-owned collections. Documents live inside orders, scoped per
`{companyId}/{storeId}/orders/{orderId}`. Paths are built via
`FirebaseAPI.firestore.getPath`.

| Field on `Order` | Source | Purpose |
| ---------------- | ------ | ------- |
| `deliveryNote`   | local schema (`packages/core/lib/entities/DeliveryNote.ts`) | Canonical DN state (`status: pending \| paid \| cancelled`, items, totals). |
| `ezDeliveryNote` | EZcount response | `doc_uuid`, `doc_number`, `pdf_link`, `success`, raw EZcount data. |
| `invoice`        | local schema (`packages/core/lib/entities/Invoice.ts`) | Tax invoice state (status, items, totals, `allocationNumber?`, `allocationDate?`). |
| `ezInvoice`      | EZcount response (legacy mirror) | `doc_uuid`, `doc_number`, `pdf_link`. |

## EZcount integration

A single client lives at `functions/src/services/ezCountService` (outside the
module — shared service). It calls `${ezcount_api}/api/createDoc` with
deterministic `transaction_id` for idempotency.

| Doc type code | Meaning                              |
| ------------- | ------------------------------------ |
| `200`         | תעודת משלוח (delivery note)          |
| `305`         | חשבונית מס (tax invoice)             |
| `330`         | חשבונית זיכוי (credit invoice)       |
| `400`         | קבלה (receipt)                       |

The `parent` field on EZcount links a new document to one or more source
documents. It accepts **doc UUIDs**, comma-separated (up to 4) — **not** the
human-readable doc numbers. Passing a number returns
`errNum 1002: doc parent not found:<number>`.

## Public surface

`index.ts` is the only public surface.

| Endpoint            | Type     | Auth          | Purpose                                                      |
| ------------------- | -------- | ------------- | ------------------------------------------------------------ |
| `createDeliveryNote`| `onCall` | admin claim   | Issue a DN for an order; persist `ezDeliveryNote` + emit event. |
| `createInvoice`     | `onCall` | admin claim   | Issue a tax invoice. Two modes — see [Invoice flows](#invoice-flows). |

## Events

`events.ts` owns the type constants and Zod payload schemas.

| Event                          | When fired                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- |
| `documents.delivery_note_created` | After `createDeliveryNote` succeeds and persists the EZcount response.   |
| `documents.invoice_created`       | After `createInvoice` succeeds in the **single-DN flow** (see below).    |

Emit helpers live under `internal/` (`emitDeliveryNoteCreated.ts`,
`emitInvoiceCreated.ts`) — they only translate units (shekels → agorot) and
forward to the event bus.

Cross-module subscribers (live elsewhere):

| Subscriber                              | Lives in     | Reacts to                          |
| --------------------------------------- | ------------ | ---------------------------------- |
| `postDebitOnDeliveryNoteCreated`        | `modules/ledger` | `documents.delivery_note_created` |

The documents module itself **subscribes to nothing** and **emits no ledger
transactions**. Money belongs to the ledger.

## Invoice flows

`createInvoice` serves two distinct admin workflows. The discriminator is
`orders.length`:

### Rollup (multi-order) — existing flow

Used by `AdminInvoicesPage`. Admin picks an organization + date range; modal
loads matching orders that already have a successful delivery note. Selected
orders are billed onto one consolidated tax invoice.

- `params.parent = orders.map(o => o.ezDeliveryNote.doc_uuid).join(",")`
- `orders.length > 1` is the common case (single is legal too).
- After EZcount returns: each order gets `order.invoice = ezData` in one batch.
- **No** `documents.invoice_created` event is emitted (rollup semantics differ
  per-order; downstream subscribers shouldn't assume a 1:1 mapping).

### Single-DN (single-order) — new flow

Used by `AdminDeliveryNotesPage`'s per-row "הפק חשבונית" action.

- `params.parent = order.ezDeliveryNote.doc_uuid` (one uuid, not joined)
- `orders.length === 1`
- After EZcount returns, in a single batch:
  - `order.invoice = ezData` (with `allocationNumber` + `allocationDate`
    embedded when supplied)
  - `order.deliveryNote.status = "paid"` — written via dotted-path so the
    rest of `deliveryNote` is preserved
- `documents.invoice_created` event is emitted with the payload below.

Both flows share the same callable, same EZcount client, same idempotency.

## Compliance gates (single-DN flow only)

Israeli ITA חשבונית ישראל ("Israeli Invoice") mandates an **allocation
number** for invoices at or above the threshold (currently ₪5,000).

`createInvoice` enforces server-side: when `orders.length === 1` and
`params.parent` is set and `price_total >= ALLOCATION_THRESHOLD_ILS` and
`!params.allocationNumber` → returns
`{ success: false, error: "allocation_required" }` **before** touching EZcount.

The admin UI (`InvoiceDetailsModal` with `requireAllocation` prop) mirrors the
check: it shows a numeric input and refuses to submit when empty.

The constant `ALLOCATION_THRESHOLD_ILS = 25000` lives in `createInvoice.ts`
with a TODO to externalize once a config getter exists.

## `documents.invoice_created` payload

```ts
{
  orderId: string;
  invoiceNumber: string;          // EZcount doc_number
  invoiceDocUuid: string;         // EZcount doc_uuid
  amount: number;                 // integer agorot (converted from shekels at emit)
  companyId: string;
  storeId: string;
  deliveryNoteNumber?: string;    // human-readable DN number from order.deliveryNote
  organizationId?: string;        // B2B identity
  allocationNumber?: string;      // ITA חשבונית ישראל allocation, when supplied
}
```

Anyone subscribing should:

- Treat the event as **a billing milestone only** — money owed already accrued
  at DN time (ledger DEBIT). Do **not** credit the ledger from this event.
- Skip when `organizationId` is absent (B2C orders carry no AR).
- Dedup via `evt_{subscriberName}_{eventId}` per the project's idempotency
  convention.

Today no subscriber consumes it. Likely future consumers: notification
(email/PDF send), accounting export, ITA reporting.

## Idempotency

The single writer for both flows is `createInvoice` itself. Idempotency:

| Layer | Mechanism |
| ----- | --------- |
| EZcount | Deterministic `transaction_id = "invoice:" + sha256(orderIds).slice(0, 36)`. Retries return the same EZcount doc. |
| Firestore | The batch update is keyed on the order id; reissuing the same orders writes the same fields. |
| Event | One emit per successful invoice; subscriber-side dedup handles redelivery. |

## Error surfaces

`createInvoice` returns:

| Shape                                                  | When                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `{ success: true,  data: TEzInvoice }`                 | EZcount returned a valid doc; batch + (single-DN) event committed.   |
| `{ success: false, error: "allocation_required" }`     | Compliance gate (single-DN flow only).                               |
| `{ success: false, error: <ezcount errMsg> }`          | EZcount rejected (e.g. `doc parent not found:…` if `parent` was wrong). |

Frontend (`InvoiceDetailsModal`) shows the error via `toast.danger(...)` on
any `!success`; does **not** write the order doc or close the modal in that
case.

## Tenant scope

`createInvoice` reads `companyId`/`storeId` from the auth claim
(`auth.token.companyId` / `auth.token.storeId`). All Firestore paths use
`FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "orders" })`.
EZcount credentials live at `STORES/{storeId}/private/data` and are never logged.

## Files

```
modules/documents/
├── index.ts                                     public surface
├── events.ts                                    type constants + payload schemas
├── api/
│   ├── createDeliveryNote.ts                    DN issuance
│   └── createInvoice.ts                         tax-invoice issuance (both flows)
└── internal/
    ├── emitDeliveryNoteCreated.ts               emit helper
    └── emitInvoiceCreated.ts                    emit helper (single-DN flow)
```
