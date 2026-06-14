---
sidebar_position: 1
title: Ledger
---

# Ledger Module

`functions/src/modules/ledger`

The **single source of truth for all real money movement** in the store. Every
successful financial event is recorded as an append-only `Transaction`
document — the authoritative record of what money moved, when, how much, and
why. Existing records are never mutated; only new facts are appended.

:::caution Pure cash — AR lives in documents
As of the `ar-organization-balance` refactor, the ledger is **pure cash only**.
The concepts `delivery_note`, `invoice`, `credit_note`, `adjustment`,
`kind: debit`, and `direction: "none"` have been **removed**. Accounts-receivable
accruals now live in the `documents` module's `organizationBalance` entry ledger.

Dependency direction after this change:
- `documents` subscribes to `ledger.transaction_posted` to settle AR.
- The ledger has **zero** dependency on documents, orders, or AR concepts.
:::

:::info Money & time conventions
Amounts are integer **agorot** (1 ILS = 100 agorot) and always positive;
`direction` (`in`/`out`) carries the sign. Timestamps are epoch **millis**.
Currency is always `"ILS"`. HYP converts to/from shekels at the boundary.
:::

## Collections

All paths are tenant-scoped and built with
`FirebaseAPI.firestore.getPath` — shape `{companyId}/{storeId}/{collectionName}/{docId}`.

| Collection              | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `transactions`          | Append-only money facts. Every successful payment / capture.  |
| `payments`              | Raw data from the HYP response.                               |
| `paymentLinks`          | Short-lived HYP signed forms (48h TTL). Single-use.           |
| `duplicateChargeAlerts` | Flagged double-charges for the same order.                    |

## Transaction model

Append-only: there is **no `status` and no `updatedAt`** — only successful
events become rows. Key fields (`TransactionSchema`):

| Field         | Notes                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| `type`        | See [Transaction types](#transaction-types). Cash only.                                 |
| `amount`      | Integer agorot, always positive.                                                        |
| `currency`    | Always `"ILS"`.                                                                         |
| `direction`   | `in` = received by the store, `out` = refund.                                           |
| `reference`   | Optional `{ type: order \| refund \| adjustment, id }`.                                 |
| `payer`       | `{ organizationId?, clientId?, billingAccountId? }` — who paid.                         |
| `hyp`         | Gateway detail: `masof`, `paymentToken?`, `ccode?`, `hypTransactionId?`, `last4?`, full `rawResponse`, `capturedFromTransactionId?`. |
| `clientName`, `email` | Customer identity captured at auth, reused by capture.                          |
| `actor`       | `user` (admin), `customer`, or `system`.                                                |
| `dedupKey`    | Deterministic key — the doc id is derived from it (see [Idempotency](#idempotency)).    |
| `source`      | `subscriber` \| `api` \| `hyp_result` \| `system`.                                      |
| `createdAt`   | epoch millis.                                                                           |
| `companyId`, `storeId` | Tenant scope.                                                                  |

### Transaction types

Cash only — four payment instruments:

| Type            | When written                                                     |
| --------------- | ---------------------------------------------------------------- |
| `manual`        | Admin records external money (cash, bank transfer).              |
| `hyp_direct`    | HYP direct payment link completed (`recordHypDirectPayment`).    |
| `hyp_j5_auth`   | HYP J5 authorization recorded by the customer's browser.         |
| `hyp_capture`   | J5 hold captured server-side via `captureHypJ5`.                 |

## Idempotency

One service — `services/postTransaction.ts` — is the **only writer**. It runs
a Firestore transaction with `create()`: if the doc already exists (duplicate
delivery), it fetches and returns the existing row without throwing or
double-emitting. The doc id is derived from a deterministic `dedupKey`:

| Source       | Dedup key                                |
| ------------ | ---------------------------------------- |
| `subscriber` | `evt_{subscriberName}_{eventId}`         |
| `api`        | `idem_{idempotencyKey}` (client-supplied) |
| `hyp_result` | `hyp_{verifiedHypTransactionId}`         |
| `system`     | auto-generated id                        |

## Events

`postTransaction` writes the transaction doc **and** emits
`ledger.transaction_posted` in a single Firestore transaction — if the write
commits, the event is guaranteed emitted. Payload (`TransactionPostedPayload`)
forwards `transactionId`, `type`, `amount`, `direction` (`in`|`out`), `reference?`,
and `payer?` so downstream subscribers act without a second read.

Subscribers of `ledger.transaction_posted`:

| Subscriber                                      | Module      | Purpose                            |
| ----------------------------------------------- | ----------- | ---------------------------------- |
| `updateProjectionsOnTransactionPosted`          | `budget`    | Revenue rollup (cash reporting)    |
| `settleOnTransactionPosted`                     | `documents` | AR settlement (reduce org owed)    |
| `onTransactionPostedMarkOrderPaid`              | `orders`    | Update order paymentStatus         |

## Public surface

`index.ts` is the only public surface. Two implementations coexist while the
storefront/admin are migrated:

- ✅ **Canonical** — server-side, signature-verified. The target.
- 🟥 **Legacy** — what the storefront/admin actually call today; retired once
  callers are repointed.

| Endpoint                     | Status | Type     | Auth                                  |
| ---------------------------- | ------ | -------- | ------------------------------------- |
| `recordHypJ5Auth`            | ✅     | `onCall` | customer/anonymous (VERIFY-gated)     |
| `captureHypJ5`               | ✅     | `onCall` | admin claim; double-charge guarded    |
| `createHypDirectPaymentLink` | ✅     | `onCall` | admin claim                           |
| `createHypCheckoutPayment`   | ✅     | `onCall` | customer (uid, ownership-gated)       |
| `recordHypDirectPayment`     | ✅     | `onCall` | customer/anonymous (VERIFY + link consume) |
| `getPaymentLink`             | ✅     | `onCall` | public (token only; no secrets)       |
| `postManualTransaction`      | ✅     | `onCall` | admin claim                           |
| `chargeOrder`                | 🟥     | `onCall` | legacy J5 capture — live today        |
| `createPayment`              | 🟥     | `onCall` | legacy link create — live today       |
| `createPaymentRedirect`      | 🟥     | `onCall` | legacy admin link — live today        |
| `getPaymentRedirect`         | 🟥     | `onCall` | legacy fetch redirect link — live today |

## HYP payment flows

:::caution No webhook
There is **no server-to-server HYP webhook**. HYP results return to the
**customer's browser** via redirect with result params (`Id`, `CCode`,
`Amount`, …). The server re-verifies them with HYP VERIFY before writing.
:::

### Direct payment link

1. Admin calls `createHypDirectPaymentLink` → gets a `/pay/{token}` URL.
2. Customer visits it; client calls `getPaymentLink(token)` → `{ formAction, formFields }`.
3. Customer submits the HYP form → HYP processes payment.
4. HYP redirects back to the store with result params.
5. Client calls `recordHypDirectPayment` with the params + token.
6. Server VERIFY-gates, consumes the single-use link, writes `hyp_direct`.

### J5 (deferred capture) — customer checkout

1. Customer submits checkout; client writes the order to Firestore first.
2. Client calls `createHypCheckoutPayment(orderId, companyId, storeId)`.
3. Server loads the order, enforces ownership (`order.userId === uid`).
4. Server loads store HYP creds, calls HYP APISign, returns `{ formAction, formFields }`.
5. Client form-POSTs to HYP; customer authorizes the card.
6. HYP redirects back with result params (incl. `UID`).
7. Client calls `recordHypJ5Auth` → server VERIFY-gates, writes `hyp_j5_auth` (stores the payment token).
8. Admin later calls `captureHypJ5(j5TransactionId)` → server charges HYP, writes `hyp_capture`.

`createHypCheckoutPayment` writes **no** ledger transaction and creates **no**
`paymentLinks` doc — money hasn't moved at form-generation time.

## Integrity model

Customer-facing record endpoints (`recordHypJ5Auth`, `recordHypDirectPayment`)
use **HYP VERIFY** (`action=APISign&What=VERIFY`) as the integrity control —
not an admin claim. The server forwards the redirect params to HYP; HYP returns
`CCode=0` (valid) or `CCode=902` (tampered). No write happens on failure.

Additional checks:

- `Masof` in the redirect is cross-checked against the store's configured masof.
- Amount is always taken from the HYP-verified response, never a separate client field.
- Single-use links are atomically consumed (expiry + `usedAt` checked inside the txn).

## Services (internal)

| File                          | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| `postTransaction.ts`          | Only writer — atomic write + event emit.         |
| `detectDuplicateCharges.ts`   | Best-effort double-charge check after commit.    |
| `createPaymentLink.ts`        | Creates HYP signed form + persists the link.     |
| `validateAndConsumeLink.ts`   | Single-use enforcement (Firestore transaction).  |
| `verifyHypSignature.ts`       | HYP VERIFY call (confirms params came from HYP).  |

`internal/` is module-private and must never be imported from another module —
cross-module use goes through `index.ts` or `events.ts`.
