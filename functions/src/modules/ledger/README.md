# Ledger Module

Single source of truth for all money movement in the store.

## Purpose

The ledger module records every successful financial event as an append-only
Transaction document. It is the authoritative record of what money moved,
when, how much, and why. No mutation of existing records — only new facts.

## Collections (all tenant-scoped)

All paths are built with `FirebaseAPI.firestore.getPath`. Shape:
`{companyId}/{storeId}/{collectionName}/{docId}`

| Collection              | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `transactions`          | Append-only money facts. Every successful payment/capture. |
| `payments`              | raw data from hyp resposne.                                |
| `paymentLinks`          | Short-lived HYP signed forms (48h TTL). Single-use.        |
| `duplicateChargeAlerts` | Flagged double-charges for the same order.                 |

## Pure-Cash Design (post ar-organization-balance refactor)

The ledger is **pure cash only**. It records only real money movement. The concepts
`delivery_note`, `invoice`, `credit_note`, `adjustment`, `kind: debit`, and
`direction: "none"` have been **removed**. Accounts-receivable accruals now live in the
`documents` module's `organizationBalance` entry ledger (see `modules/documents/README.md`).

Dependency direction: `documents` subscribes to `ledger.transaction_posted` to settle AR.
The ledger has zero dependency on documents, orders, or AR concepts.

## Transaction Model

- **Append-only**: no `status`, no `updatedAt`. Only successful events become rows.
- **Amounts in integer agorot**: 1 ILS = 100 agorot. HYP converts at the boundary.
- **`currency: "ILS"`** always.
- **`direction: "in" | "out"`**: `in` = money received by the store.

## Transaction Types

| Type          | When written                                                     |
| ------------- | ---------------------------------------------------------------- |
| `manual`      | Admin records external money (cash, bank transfer)               |
| `hyp_direct`  | HYP direct payment link completed (via `recordHypDirectPayment`) |
| `hyp_j5_auth` | HYP J5 authorization recorded by the customer browser            |
| `hyp_capture` | J5 capture charged server-side via `captureHypJ5`                |

## Idempotency Strategy

ONE service (`services/postTransaction.ts`) is the ONLY writer. It uses
a Firestore transaction with `create()` — if the document already exists
(duplicate delivery), it fetches and returns the existing doc without
throwing or double-emitting.

Dedup key format by source:

- `subscriber` → `evt_{subscriberName}_{eventId}`
- `api` → `idem_{idempotencyKey}`
- `hyp_result` → `hyp_{verifiedHypTransactionId}` (used by both customer record endpoints)
- `system` → auto-generated id

## Services

| File                                 | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `services/postTransaction.ts`        | Only writer — atomic write + event emit         |
| `services/detectDuplicateCharges.ts` | Checks for double-charges post-write            |
| `services/createPaymentLink.ts`      | Creates HYP signed form + persists link         |
| `services/validateAndConsumeLink.ts` | Single-use enforcement (Firestore transaction)  |
| `services/verifyHypSignature.ts`     | HYP VERIFY call (confirms params came from HYP) |

## API Endpoints

| File                                | Type     | Auth                                     | Notes                                                  |
| ----------------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------ |
| `api/postManualTransaction.ts`      | `onCall` | admin claim required                     | tenant from token                                      |
| `api/captureHypJ5.ts`               | `onCall` | admin claim required                     | tenant from token; double-charge guarded               |
| `api/createHypDirectPaymentLink.ts` | `onCall` | admin claim required                     | tenant from token                                      |
| `api/createHypCheckoutPayment.ts`   | `onCall` | customer (uid required, ownership-gated) | checkout J5 form; no ledger write; no paymentLinks doc |
| `api/recordHypJ5Auth.ts`            | `onCall` | customer/anonymous (VERIFY-gated)        | HYP VERIFY is the integrity control                    |
| `api/recordHypDirectPayment.ts`     | `onCall` | customer/anonymous (VERIFY-gated)        | VERIFY + single-use link consume                       |
| `api/getPaymentLink.ts`             | `onCall` | public (token only)                      | never returns secrets                                  |

## HYP Payment Flow

### Direct Payment Link

1. Admin calls `createHypDirectPaymentLink` → gets a `/pay/{token}` URL.
2. Customer visits the URL; client calls `getPaymentLink(token)` → gets `formAction + formFields`.
3. Customer submits the HYP form → HYP processes payment.
4. HYP redirects customer back to the store with result params (`Id`, `CCode`, `Amount`, …).
5. Client calls `recordHypDirectPayment` with the redirect params + token.
6. Server VERIFY-gates (calls HYP VERIFY), consumes the single-use link, writes `hyp_direct`.

#### Live admin payment link (tokenless variant)

The admin UI today creates payment links via the legacy `createPaymentRedirect`
(`isJ5: false`, stored in the root `paymentRedirects` collection). The HYP redirect
back from this flow carries `Order` but **no link token**. In this case the storefront
calls `recordHypDirectPayment` **without** a `token`: the server resolves the order from
the verified `Order` field + tenant input and writes `hyp_direct` (no single-use link to
consume — idempotency relies on the `hyp_{Id}` dedup key). Integrity is identical to the
token flow: HYP VERIFY + `Masof` cross-check gate the write. The order is then flipped to
`completed` by `onTransactionPostedMarkOrderPaid` — the client never writes the status.

### J5 (Deferred Capture) — Customer Checkout Flow

1. Customer submits the checkout form; client writes the order to Firestore first.
2. Client calls `createHypCheckoutPayment(orderId, companyId, storeId)`.
3. Server loads the order and enforces ownership (`order.userId === uid`).
4. Server loads store HYP creds, calls HYP APISign, returns `{ formAction, formFields }`.
5. Client form-POSTs to HYP UI; customer enters card details and authorizes.
6. HYP redirects browser back with result params (`Id`, `CCode`, `Amount`, `UID`, …).
7. Client calls `recordHypJ5Auth` with those params.
8. Server VERIFY-gates (HYP VERIFY call), writes `hyp_j5_auth` (stores payment token).
9. Admin later calls `captureHypJ5(j5TransactionId)` → server charges HYP, writes `hyp_capture`.

`createHypCheckoutPayment` writes NO ledger transaction and creates NO paymentLinks doc.
Money has not moved at form-generation time.

**There is NO server-to-server HYP webhook.** HYP payment results return to the
customer's browser via redirect (like the legacy `/orderError?CCode=...` flow).

## Integrity Model

Customer-facing record endpoints (`recordHypJ5Auth`, `recordHypDirectPayment`) use
**HYP VERIFY** (`action=APISign&What=VERIFY`) as the integrity control — not an admin
claim. The server forwards the redirect params back to HYP; HYP returns `CCode=0`
(valid) or `CCode=902` (invalid/tampered). No write happens on verify failure.

Additional checks:

- `Masof` in redirect params is cross-checked against the store's configured masof.
- Amount is always taken from the HYP-verified response, never from a separate client field.
- Single-use links are atomically consumed (expiry + usedAt checked inside Firestore txn).

## Atomic Event Emission

`postTransaction` writes the transaction doc and emits the `ledger.transaction_posted`
event in a **single Firestore transaction**. If the write succeeds, the event is
guaranteed emitted. `detectDuplicateCharges` runs after the transaction commits
as a best-effort side effect.
