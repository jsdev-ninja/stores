---
sidebar_position: 6
title: Payment flows (testing reference)
---

# Payment flows — end-to-end

The three checkout flows the platform supports, with the **exact** order
status, payment status, ledger writes, and document creation at each step.
Use this as a runbook when testing.

For module-level details see [Ledger](/modules/ledger). For the conceptual
separation between cash, AR and documents see [Money & documents](./money-and-documents).

## The orthogonal state model

Two fields on the order doc carry independent state:

| `status` (fulfillment lifecycle) | `paymentStatus` (payment lifecycle) |
| --- | --- |
| `draft` — checkout submitted, payment not finalized | `pending` — payment not started or not received |
| `pending` — payment OK or external, waiting for admin approval | `pending_j5` — J5 hold authorized, not yet captured |
| `processing` — admin approved, picking | `external` — cash / cheque / bank-transfer order |
| `in_delivery` — DN issued | `completed` — money in the ledger |
| `delivered` — handed off | `failed` — payment rejected by HYP |
| `completed` — final state | `refunded` |
| `cancelled` / `refunded` | |

The two are supposed to be orthogonal, but today the code partly conflates
them — `status === "draft"` is used as a stand-in for "not paid". A planned
refactor (see `todo.md`) will untangle this. For now, the table above is the
mental model; the runbook below tracks both values explicitly.

:::caution Known bug — `onOrderPaid` may revert paid orders
`apps/store/src/appApi/index.ts ~L1628` does an UNCONDITIONAL client write
that sets `status: "pending"` and `paymentStatus: "pending_j5"` on every load
of `OrderSuccessPage.tsx`. Re-opening or back-button to `/orderSuccess?…`
clobbers a `completed` order back to `pending`. Tracked in `todo.md` as
🔴 CRITICAL. **If you hit weird status reverts during testing, this is why.**
:::

## Scenario 1 — Normal J5 (deferred capture)

The default online-card flow. Customer authorizes a hold; admin captures the
real charge later.

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer
  participant FE as Storefront
  participant FS as Firestore
  participant HYP as HYP gateway
  participant A as Admin
  participant L as Ledger
  participant T as transaction_posted

  C->>FE: submit checkout (cart)
  FE->>FS: create order<br/>{ status:"draft", paymentStatus:"pending" }
  FE->>L: createHypCheckoutPayment(orderId)
  L-->>FE: HYP form { action, fields }
  FE->>HYP: form-POST
  HYP-->>C: authorize card (J5 hold)
  HYP-->>FE: redirect with result params (Id, CCode, Amount, UID)

  Note over FE: OrderSuccessPage loads
  FE->>L: recordHypJ5Auth(redirect params)
  L->>HYP: VERIFY round-trip
  HYP-->>L: CCode=0 (valid)
  L->>L: write hyp_j5_auth transaction<br/>(direction:none — auth, no cash yet)
  Note over L,T: NOT settled — hyp_j5_auth excluded by RECEIVED_MONEY_TYPES

  Note over A,FE: Hours/days later
  A->>L: captureHypJ5(j5TransactionId)
  L->>HYP: capture call
  HYP-->>L: CCode=0
  L->>L: write hyp_capture transaction<br/>(direction:in)
  L-->>T: emit transaction_posted
  T->>FS: markOrderPaidOnTransactionPosted<br/>status:draft→pending<br/>paymentStatus:→completed
  T->>FS: settleOnTransactionPosted<br/>org AR balance ↓
```

### State at each step

| Step | order.status | order.paymentStatus | Ledger | Notes |
| --- | --- | --- | --- | --- |
| Checkout submit | `draft` | `pending` | — | Deterministic order id = `cart.id` (idempotent) |
| After J5 auth recorded | `draft` | `pending_j5` | `hyp_j5_auth` (none) | Auth hold on card, no money moved |
| After admin captures | `pending` | `completed` | `hyp_j5_auth` (none) + `hyp_capture` (in) | `markOrderPaidOnTransactionPosted` promoted draft → pending |
| Admin approves | `processing` → `in_delivery` → `delivered` → `completed` | unchanged | unchanged | Triggers DN creation |

### What to check during testing

1. **Order doc**:
   - After J5 auth: `status: "draft"`, `paymentStatus: "pending_j5"`
   - After capture: `status: "pending"`, `paymentStatus: "completed"`
2. **transactions collection** — should see two rows for this order: `type: "hyp_j5_auth"` then `type: "hyp_capture"`
3. **`organizationBalance/{orgId}`** (B2B only) — balance reduced by the capture amount
4. **No `hyp_j5_auth` entry in the AR settlement log** — only `hyp_capture` settles

### Known bugs to watch for

| Bug | Symptom | File |
| --- | --- | --- |
| 🔴 CRITICAL — `chargeOrder` double-charges | Capture called twice → card debited twice, only one ledger entry (dedup by auth-id masks the second) | `chargeOrder` (legacy J5 capture, still live) |
| 🔴 CRITICAL — `onOrderPaid` reverts completed orders | Re-opening `/orderSuccess` after capture flips `completed` back to `pending_j5` | `apps/store/src/appApi/index.ts ~L1628` |
| 🟠 Ledger dedup hides real second charge | Real 2nd HYP charge not in ledger; books say one charge, card says two | `chargeOrder` |

Confirmed example: order `XFhPL8sdzIHmPExbQrYJ` exhibited all three.

## Scenario 2 — J5 with aborted payment

Customer submitted the checkout but never completed the HYP authorization
(closed browser, cancelled on HYP page, card rejected). The order is left
in a half-state.

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer
  participant FE as Storefront
  participant FS as Firestore
  participant HYP as HYP gateway
  participant A as Admin

  C->>FE: submit checkout
  FE->>FS: create order<br/>{ status:"draft", paymentStatus:"pending" }
  Note over FS: onOrderCreated trigger fires<br/>→ emit order.placed
  FS->>FS: cart.status = "completed"<br/>(closeCartOnOrderPlaced)
  FE->>HYP: redirect to HYP form
  Note over C,HYP: Customer closes browser<br/>or cancels on HYP
  HYP-->>FE: no return, no recordHypJ5Auth
  Note over FS: Order stays draft + pending FOREVER<br/>(no auto-cleanup)<br/>Cart stays closed → customer cannot self-recover

  alt Admin recovers manually
    A->>FE: open OrderDetailsModal on draft order
    FE->>A: shows "Create payment link" + "Edit"
    A->>FE: click Create payment link
    FE->>L: createPaymentLink(order)
    Note over A,C: Admin sends link to customer
    C->>L: completes payment via direct link
    Note over C,L: from here on, scenario 3 (direct) takes over<br/>or the order completes via promote-draft
  else No recovery
    Note over FS: Order remains draft indefinitely
  end
```

### State at each step

| Step | order.status | order.paymentStatus | Ledger |
| --- | --- | --- | --- |
| Checkout submit | `draft` | `pending` | — |
| Abort (no return) | `draft` | `pending` | — |
| Admin sends payment link | unchanged | unchanged | — |
| Customer pays via link | `pending` | `completed` (via `promote-draft` in `markOrderPaidOnTransactionPosted`) | `hyp_direct` (in) |
| If never paid | `draft` (forever) | `pending` (forever) | — |

### What to check during testing

1. **Aborted state**: order doc has `status: "draft"`, `paymentStatus: "pending"`, no `transactions` rows for that orderId
2. **Recovery UX**: `OrderDetailsModal` on a draft order MUST show:
   - "צור לינק לתשלום" (Create payment link) — gated by `status === "draft" && paymentType !== "external"`
   - "ערוך הזמנה" (Edit) — gated by `status === "pending" || status === "draft"`
   - "📦 מצב ליקוט" (Picking) — available for any non-final order (`status` not in `completed`/`cancelled`/`refunded`). Picking is fulfillment metadata, not a financial action; the payment guard lives on Approve.
   - "אשר → תעודת משלוח" (Approve) **does NOT show** — only for `status === "pending"`
3. **No phantom ledger entries**: an aborted order must have zero `transactions` rows for that orderId
4. **Cart was closed.** Counter-intuitively, the cart IS closed even on abort. The order document is written to Firestore at the moment of checkout submit (BEFORE the HYP redirect). That immediately fires `onOrderCreated` → emits `order.placed` → the `cart: closeCartOnOrderPlaced` subscriber sets the cart `status: "completed"`. So when the customer returns to the storefront, they see an empty cart — they cannot self-recover. Recovery must go through admin (Edit / Create payment link on the draft order).

:::caution paymentStatus vs paymentType — don't confuse them
Two distinct fields on the order:
- **`paymentType`** — payment mode chosen at checkout (`"j5" | "external" | …`). Fixed at submit.
- **`paymentStatus`** — current payment state (`"pending" | "pending_j5" | "completed" | …`). Changes over time.

For a J5 abort, `paymentType` stays `"j5"` (the customer intended to pay via J5) but `paymentStatus` stays `"pending"` — it never advances to `"pending_j5"` because `recordHypJ5Auth` was never called.
:::

### Known bugs / odd behavior

- **No automatic cleanup of stuck drafts.** They live in Firestore until manually deleted or recovered. Admin orders pages show them in the active tab (`ACTIVE_STATUSES` includes `"draft"`). This is intentional today.
- The Edit / Payment link recovery actions are real recovery paths, not just diagnostic.

## Scenario 3 — External payment (cash / cheque / bank transfer)

For B2B credit-terms or in-person sales. Order is placed without an online
payment; admin records the payment later.

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer
  participant FE as Storefront
  participant FS as Firestore
  participant A as Admin
  participant Trigger as onOrderUpdate
  participant DN as createDeliveryNote
  participant L as Ledger
  participant AR as AR (documents)
  participant Inv as createInvoice
  participant R as recordInvoicePayment

  C->>FE: submit checkout (store.paymentType=external)
  FE->>FS: create order<br/>{ status:"draft", paymentStatus:"external" }
  Note over A,FS: Admin sees order in admin app
  A->>FE: approve → status:"completed"
  FE->>FS: order.status = "completed"
  FS->>Trigger: onOrderUpdate fires
  Trigger->>DN: completeOrder()<br/>auto-creates delivery note
  DN->>FS: write o.deliveryNote / o.ezDeliveryNote
  DN-->>FS: emit documents.delivery_note_created
  FS->>AR: accrueOnDeliveryNoteCreated<br/>org AR balance ↑

  Note over A,Inv: Later — admin creates invoice
  A->>Inv: createInvoice (from DN)
  Inv->>FS: write o.invoice / o.ezInvoice
  Inv-->>FS: emit documents.invoice_created
  Note over FS,AR: No AR effect — milestone only

  Note over A,R: Customer pays in cash
  A->>R: recordInvoicePayment(orderId, paymentMethod, date)
  R->>L: postManualTransaction(reference:invoice)
  L-->>AR: settleOnTransactionPosted<br/>org AR balance ↓
  R->>FS: o.invoicePaidAt = now, o.ezReceipt = receipt
```

### State at each step

| Step | order.status | order.paymentStatus | Ledger | AR balance |
| --- | --- | --- | --- | --- |
| Checkout submit | `draft` | `external` | — | unchanged |
| Admin approve | `completed` | `external` | — | ↑ by order total (after DN auto-creates) |
| Invoice created | unchanged | unchanged | — | unchanged |
| Payment recorded | unchanged | `external` (legacy) | `manual` (in) | ↓ by invoice total |

:::note paymentStatus on external orders
External orders keep `paymentStatus: "external"` even after payment is recorded. The "is the invoice paid?" signal lives on `o.invoicePaidAt` / `o.ezReceipt`, NOT on `paymentStatus`. This is by design — `external` here means "paid offline, not via HYP" rather than literally "still owed".
:::

### What to check during testing

1. **After checkout submit**: `status: "draft"`, `paymentStatus: "external"`, no DN yet, no invoice
2. **After admin approves** (sets `status: "completed"`):
   - `o.deliveryNote` and `o.ezDeliveryNote` populated (the trigger created them)
   - `documents.delivery_note_created` event in `events/`
   - `organizationBalance/{orgId}` (B2B) accrued the order total
3. **After invoice created** (separate admin action):
   - `o.invoice` / `o.ezInvoice` populated
   - `documents.invoice_created` event in `events/` (no AR effect)
4. **After record payment** (via [Customer Debts page](/admin/pages/customer-debts)):
   - `o.invoicePaidAt` set to the payment date
   - `o.ezReceipt` populated (PDF link, doc_number)
   - `transactions/` has a new `manual` credit row, `reference: { type: "invoice", id: invoiceUuid }`
   - `organizationBalance/{orgId}` balance reduced by invoice total

### Known bugs / odd behavior

| Bug | Symptom | Fix |
| --- | --- | --- |
| 🟠 Manual DN date silently ignored on external orders | Admin picks June 3 in the manual DN modal; auto-creation in `completeOrder` already filed June 4 — modal returns success but date unchanged | Tracked in `todo.md` — fix decision pending |
| Manual DN modal returns `success: true` when DN already exists | Misleading UI feedback | Tracked in `todo.md` |

## Quick comparison

| | J5 normal | J5 abort | External |
| --- | --- | --- | --- |
| Initial order | `draft` / `pending` | `draft` / `pending` | `draft` / `external` |
| Customer interaction | HYP card form | abandoned | none |
| Ledger writes (success path) | `hyp_j5_auth` then `hyp_capture` | — | `manual` (only after admin records) |
| AR accrual when | At delivery note creation (after admin approve) | At delivery note creation (after recovery + admin approve) | At delivery note creation (after admin approve) |
| AR settlement when | At `hyp_capture` | At `hyp_direct` (if recovered via payment link) | At `recordInvoicePayment` |
| Documents issued | DN + invoice + receipt | DN + invoice + receipt (if recovered) | DN auto on approve, invoice manual, receipt on payment |

## How to verify in Firebase console

For all flows, the canonical places to look:

1. **Order doc** at `{companyId}/{storeId}/orders/{orderId}` — check `status`, `paymentStatus`, `deliveryNote`, `ezInvoice`, `ezReceipt`, `invoicePaidAt`
2. **Transactions** at `{companyId}/{storeId}/transactions/` — filter by `reference.id == orderId` to see all money events for the order
3. **Events** at `{companyId}/{storeId}/events/` — `order.placed`, `documents.delivery_note_created`, `documents.invoice_created`, `ledger.transaction_posted`
4. **Organization balance** at `{companyId}/{storeId}/organizationBalance/{orgId}` — running B2B AR balance
5. **Payments raw** at `{companyId}/{storeId}/payments/{orderId}` — HYP redirect params (diagnostic)
6. **Event bus retries** at `{companyId}/{storeId}/eventBusAttempts/` — if any subscriber failed
7. **Dead letter** at `{companyId}/{storeId}/eventBusDeadLetter/` — anything that failed 5 times

## Related

- [Ledger module](/modules/ledger) — full transaction-types table and endpoint reference
- [Money & documents](./money-and-documents) — conceptual separation of cash / debt / documents
- [Event system](./event-system) — emitter and subscriber wiring for the events above
- [Customer Debts admin page](/admin/pages/customer-debts) — where external-flow payments are recorded
- `todo.md` — full list of known bugs and their reproducers
