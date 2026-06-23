---
sidebar_position: 2
title: Documents
---

# Documents Module

`functions/src/modules/documents`

Owns two distinct responsibilities:

1. **Tax-document issuance** — delivery notes (תעודת משלוח) and tax invoices
   (חשבונית מס) via EZcount.
2. **Accounts-receivable (AR) ledger** — append-only `organizationBalance` entry
   ledger + per-org rollup cache, tracking how much each B2B organization owes.

:::info AR model — delivery-note-first
AR is accrued **once, at delivery-note creation**. Invoices have **no balance
effect** — `documents.invoice_created` is still emitted for billing milestones
(notification, accounting export) but nothing in AR consumes it.

Refunds do **not** touch AR. The settlement subscriber acts only on
`direction: "in"`. An outflow (`direction: "out"`) writes nothing to
`organizationBalance`.
:::

:::caution Migration status (as of the `ar-organization-balance` refactor)
The AR ledger is **live and populated**, but the **admin UI is not yet
repointed** to read it (deferred — "task 9"):

- The legacy budget callables `getBudgetAccount` / `listBudgetAccounts` are
  **stubbed and return empty**, so org debt currently shows as **₪0** on the
  existing admin budget/dashboard pages until the UI reads `organizationBalance`.
- The legacy collections `organizationBudgets`, `orgBalances`, `budgetRecords`
  are **inert** (no longer written) but intentionally **not deleted**.
- **Deferred follow-ups:** a cancelled-order AR-reversal path (today a cancelled
  fulfilled order leaves its accrual in place), and pagination for the reconcile
  scan before large-tenant production use.
- **Deploy:** the backend consumes `@jsdev_ninja/core` from the registry, so
  **core `0.16.0` must be published before functions deploys**.
:::

:::info Money & time conventions
EZcount expects **shekels** (floats); we convert at the boundary in
`ezCountService`. AR amounts are stored as **integer agorot** (1 ILS = 100
agorot); `Math.round(shekels * 100)` at every boundary. Timestamps are epoch
**millis**.
:::

## Collections

All paths are tenant-scoped and built with
`FirebaseAPI.firestore.getPath` — shape `{companyId}/{storeId}/{collectionName}/{docId}`.

### Tax-document storage (embedded on order)

Tax documents live on the source `Order` document — there are no standalone
`deliveryNotes` or `invoices` Firestore collections.

| Field on `Order`  | Source  | Purpose |
| ----------------- | ------- | ------- |
| `deliveryNote`    | `packages/core/lib/entities/DeliveryNote.ts` | Canonical DN state (`status: pending \| paid \| cancelled`, items, totals). |
| `ezDeliveryNote`  | EZcount response | `doc_uuid`, `doc_number`, `pdf_link`, `success`, raw EZcount data. |
| `invoice`         | `packages/core/lib/entities/Invoice.ts` | Tax invoice state (status, items, totals, `allocationNumber?`, `allocationDate?`). |
| `ezInvoice`       | EZcount response (legacy mirror) | `doc_uuid`, `doc_number`, `pdf_link`. |

### AR collections (module-owned)

| Collection                  | Path                                                          | Purpose |
| --------------------------- | ------------------------------------------------------------- | ------- |
| `organizationBalance`       | `{companyId}/{storeId}/organizationBalance/{entryId}`         | Append-only AR entry ledger. One row per accrual or settlement event. |
| `organizationBalanceRollup` | `{companyId}/{storeId}/organizationBalanceRollup/{organizationId}` | Per-org running total. A projection; rebuilt by reconcile. |

## AR entry ledger schema (`OrganizationBalanceEntrySchema`)

Every row is immutable once written. Key fields:

| Field           | Type    | Notes |
| --------------- | ------- | ----- |
| `id`            | string  | Deterministic dedup id (= `dedupKey`) — see [Idempotency (AR)](#idempotency-ar). |
| `organizationId`| string  | B2B organization (company). Required — B2C orders are skipped. |
| `sign`          | `"+"` \| `"-"` | `"+"` = owed increases (accrual); `"-"` = owed decreases (settlement). |
| `kind`          | `"accrual"` \| `"settlement"` \| `"adjustment"` | Accrual on DN, settlement on payment. |
| `amount`        | number  | Integer agorot, always positive (`sign` carries direction). |
| `currency`      | `"ILS"` | Always ILS. |
| `source`        | `"delivery_note"` \| `"ledger_payment"` \| `"manual"` \| `"order_reversal"` | What triggered this entry. |
| `document`      | object? | Source tax doc: `{ type: "delivery_note" \| "invoice", id, number? }`. Present for accruals. |
| `reference`     | object? | `{ type: "order" \| "transaction" \| "manual", id }` — order id (accrual) or ledger txId (settlement). |
| `billingAccountId` | string \| null | Optional sub-grouping within an org. |
| `dedupKey`      | string  | Deterministic dedup key; the doc `id` is derived from it. |
| `causedByEventId` | string? | Event id when the entry is event-driven (audit / trace). |
| `createdAt`     | number  | Epoch millis — indexed for date-range queries. |
| `companyId`, `storeId` | string | Tenant scope. |

## AR rollup schema (`OrganizationBalanceRollupSchema`)

One doc per organization, doc id = `organizationId`:

| Field           | Type   | Notes |
| --------------- | ------ | ----- |
| `organizationId`| string | Org identity. |
| `owed`          | number | Integer agorot currently owed. `max(0, totalAccrued − totalSettled)`. Always ≥ 0. |
| `credit`        | number | Integer agorot overpaid. `max(0, totalSettled − totalAccrued)`. Always ≥ 0. Visible to admins — not client-spendable. |
| `totalAccrued`  | number | Sum of all `"+"` entries. |
| `totalSettled`  | number | Sum of all `"-"` entries. |
| `updatedAt`     | number | Epoch millis of last write. |
| `companyId`, `storeId` | string | Tenant scope. |

:::info Credit — overpayment visibility only
`credit = max(0, totalSettled − totalAccrued)`. When an org pays more than it has
accrued, the surplus is tracked here so admins can see it. A later delivery-note
accrual naturally nets against the credit (standard AR) — that is expected behaviour,
**not** the client spending credit. No checkout / "use credit" mechanism exists;
`credit` is visibility only. At most one of `{owed, credit}` is non-zero at any
time. Both fields use the identical formula in the incremental writer
(`organizationBalanceStore.ts`) and the reconcile service
(`reconcileOrganizationBalance.ts`) so the live rollup and nightly reconcile always
agree.
:::

## Accrual flow

```
createDeliveryNote (api) → emit documents.delivery_note_created
    → accrueOnDeliveryNoteCreated (subscriber)
        → accrueDebt (service)
            → organizationBalanceStore.writeArEntry (internal)
```

1. `createDeliveryNote` issues the DN via EZcount, persists `ezDeliveryNote`
   on the order, and **emits `documents.delivery_note_created`** (inlined, no emit wrapper).
2. `accrueOnDeliveryNoteCreated` subscribes. If `payload.organizationId` is
   absent → B2C → skip.
3. The subscriber **re-reads the server order doc** and uses its
   `order.organizationId` as the authoritative value. The event payload's
   `organizationId` is used only as a B2C early-exit hint and is otherwise
   ignored — a spoofed payload cannot redirect the accrual.
4. Amount = `Math.round(order.cart.cartTotal * 100)` (shekels → agorot).
5. The dedup id is derived from a **stable server-side delivery-note id**
   (`order.deliveryNote?.id ?? order.deliveryNote?.number`). If neither is
   present, the subscriber logs an error and **skips** — it never falls back to
   `orderId` (that would break idempotency / risk double-accrual).
6. `accrueDebt` calls `writeArEntry` with `sign: "+"`, `kind: "accrual"`,
   `source: "delivery_note"`, dedup id = `dn_{deliveryNoteId}`.
7. `writeArEntry` runs a **Firestore transaction**: reads current rollup,
   `txn.create(entryRef, ...)` (idempotency gate), `txn.set(rollupRef, ...)`.
   On `ALREADY_EXISTS` → no-op (idempotent replay).

## Settlement flow

```
ledger.postTransaction → emit ledger.transaction_posted
    → settleOnTransactionPosted (subscriber)
        → settleDebt (service)
            → organizationBalanceStore.writeArEntry (internal)
```

1. `settleOnTransactionPosted` subscribes to `LedgerEventTypes.transactionPosted`.
2. **Re-reads the stored transaction** from Firestore (payload is routing hint
   only — never trust client-supplied amounts).
3. Guards (all must pass; evaluated against the **stored** doc):
   - `storedTx.type` must be a **received-money** type — one of `hyp_capture`,
     `hyp_direct`, `manual`. `hyp_j5_auth` (an authorization **hold**, not
     captured money) and any other type are skipped, so the J5 auth + later
     capture pair settles AR exactly once, and never before money is captured.
   - `storedTx.direction !== "in"` → skip (refunds do not reduce AR).
   - `storedTx.reference?.type !== "order"` → skip (non-order payment, no AR).
   - `!organizationId` → skip (B2C order).
4. `settleDebt` calls `writeArEntry` with `sign: "-"`, `kind: "settlement"`,
   `source: "ledger_payment"`, dedup id = `settle_{transactionId}` — keyed on the
   **transaction id**, not the event id, so event re-delivery / backfill cannot
   double-settle.
5. Rollup: `nextSettled += amount`; `owed = max(0, totalAccrued − totalSettled)`;
   `credit = max(0, totalSettled − totalAccrued)`. Over-payments produce `credit > 0`;
   `owed` is always 0 in that case.

## Invoice — no AR effect

`createInvoice` still emits `documents.invoice_created` (for notification /
accounting / ITA reporting). **No AR subscriber consumes this event.** Debt
was already accrued at DN creation. Do not subscribe to `invoice_created` for
AR purposes.

## Reconcile service

`reconcileOrganizationBalance(params)` scans the `organizationBalance` entry
ledger, re-aggregates per org (`Σ "+" - Σ "-"`), and optionally batch-writes
corrected rollup docs.

- `apply: false` → dry run, returns report only.
- `apply: true` → batch.set() corrected rollup docs; zeroes orphaned rollup
  docs (org has a rollup but no entries).
- Returns `{ orgs, driftedOrgs }` — `driftedOrgs` is the subset where
  computed ≠ cached rollup.

**The reconcile service reads the entry ledger only** — it does not scan
the `transactions` collection.

## Idempotency (AR)

`organizationBalanceStore.writeArEntry` uses `txn.create()` inside a Firestore
transaction. Duplicate deliveries throw `ALREADY_EXISTS` (gRPC 6) → caught,
returns `{ written: false, reason: "already_exists" }`. The caller treats this
as a no-op.

Deterministic dedup ids:

| Source          | Dedup id                                           |
| --------------- | -------------------------------------------------- |
| Delivery note accrual | `dn_{deliveryNoteId}` (stable server-side DN id) |
| Transaction settlement | `settle_{transactionId}`                    |

## Events

`events.ts` owns the type constants and Zod payload schemas.

| Event                              | When fired |
| ---------------------------------- | ---------- |
| `documents.delivery_note_created`  | After `createDeliveryNote` succeeds. Triggers AR accrual. |
| `documents.invoice_created`        | After `createInvoice` succeeds (single-DN flow). No AR effect. |

### `documents.delivery_note_created` payload

```ts
{
  orderId: string;
  deliveryNoteId?: string;
  deliveryNoteNumber?: string;
  organizationId?: string;       // absent = B2C — AR skipped
  clientId?: string;
  billingAccountId?: string | null;
  total?: number;                // shekels (order.cart.cartTotal)
  vat?: number;                  // shekels (order.cart.cartVat)
  currency?: "ILS";
  createdAt?: number;            // epoch millis
  createdBy?: string;
}
```

Subscribers of `documents.delivery_note_created`:

| Subscriber                      | Module      | Purpose |
| --------------------------------| ----------- | ------- |
| `accrueOnDeliveryNoteCreated`   | `documents` | AR accrual (B2B only) |

### `documents.invoice_created` payload

```ts
{
  orderId: string;
  invoiceNumber: string;         // EZcount doc_number
  invoiceDocUuid: string;        // EZcount doc_uuid
  amount: number;                // integer agorot
  companyId: string;
  storeId: string;
  deliveryNoteNumber?: string;
  organizationId?: string;
  allocationNumber?: string;
}
```

No AR subscriber consumes this event today. Intended future consumers:
notification (email/PDF), accounting export, ITA reporting.

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
documents. It accepts **doc UUIDs**, comma-separated (up to 4) — **not**
human-readable doc numbers. Passing a number returns
`errNum 1002: doc parent not found:<number>`.

## Public surface

`index.ts` is the only public surface.

| Endpoint                          | Type         | Auth         | Purpose |
| --------------------------------- | ------------ | ------------ | ------- |
| `createDeliveryNote`              | `onCall`     | admin claim  | Issue a DN; persist `ezDeliveryNote`; emit event (triggers AR accrual). |
| `createInvoice`                   | `onCall`     | admin claim  | Issue a tax invoice (see [Invoice flows](#invoice-flows)). |
| `getOrganizationBalance`          | `onCall`     | admin claim  | Read rollup + filtered entry list for one org. |
| `reconcileOrganizationBalanceCallable` | `onCall` | admin claim  | Admin-triggered reconcile (dry-run or apply). |
| `accrueOnDeliveryNoteCreated`     | subscriber   | internal     | AR accrual on DN. |
| `settleOnTransactionPosted`       | subscriber   | internal     | AR settlement on payment. |
| `reconcileOrganizationBalanceSchedule` | scheduled | system      | Nightly reconcile (04:00 Asia/Jerusalem). |

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
- **No** `documents.invoice_created` event is emitted.

### Single-DN (single-order) — new flow

Used by `AdminDeliveryNotesPage`'s per-row "הפק חשבונית" action.

- `params.parent = order.ezDeliveryNote.doc_uuid` (one uuid, not joined)
- `orders.length === 1`
- After EZcount returns, in a single batch:
  - `order.invoice = ezData`
  - `order.deliveryNote.status = "paid"` (dotted-path, rest of `deliveryNote` preserved)
- `documents.invoice_created` event is emitted. **No AR effect.**

## Compliance gates (single-DN flow only)

Israeli ITA חשבונית ישראל mandates an **allocation number** for invoices at or
above the threshold (currently ₪5,000). `createInvoice` enforces server-side:
when `orders.length === 1`, `params.parent` is set, `price_total >= ALLOCATION_THRESHOLD_ILS`,
and `!params.allocationNumber` → returns `{ success: false, error: "allocation_required" }`
before touching EZcount.

`ALLOCATION_THRESHOLD_ILS = 25000` (agorot) — TODO: externalize to config once
a config getter exists.

## Error surfaces

`createInvoice` returns:

| Shape                                              | When |
| -------------------------------------------------- | ---- |
| `{ success: true, data: TEzInvoice }`              | EZcount returned a valid doc. |
| `{ success: false, error: "allocation_required" }` | Compliance gate (single-DN flow). |
| `{ success: false, error: <ezcount errMsg> }`      | EZcount rejected. |

## Tenant scope

All callables read `companyId`/`storeId` from auth claims
(`auth.token.companyId` / `auth.token.storeId`). All Firestore paths use
`FirebaseAPI.firestore.getPath(...)`. EZcount credentials live at
`STORES/{storeId}/private/data` and are never logged.

## Files

```
modules/documents/
├── index.ts                                        public surface
├── events.ts                                       event type constants + payload schemas
├── api/
│   ├── createDeliveryNote.ts                       DN issuance
│   ├── createInvoice.ts                            tax-invoice issuance (both flows)
│   ├── getOrganizationBalance.ts                   AR balance read (rollup + entries)
│   └── reconcileOrganizationBalance.ts             admin reconcile callable
├── services/
│   ├── accrueDebt.ts                               write "+" entry for a delivery note
│   ├── settleDebt.ts                               write "-" entry for a payment
│   └── reconcileOrganizationBalance.ts             scan ledger, rebuild rollups
├── subscribers/
│   ├── accrueOnDeliveryNoteCreated.ts              reacts to documents.delivery_note_created
│   └── settleOnTransactionPosted.ts                reacts to ledger.transaction_posted
├── triggers/
│   └── reconcileOrganizationBalanceSchedule.ts     nightly 04:00 Asia/Jerusalem
└── internal/
    ├── docIds.ts                                   deterministic dedup id builders
    ├── organizationBalanceStore.ts                 ONLY writer of AR entries + rollup
    └── paths.ts                                    Firestore path builders (module-private)
```
