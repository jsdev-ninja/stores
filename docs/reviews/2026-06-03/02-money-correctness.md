# 💰 Money + Correctness Findings

These bugs are in the recently-migrated payment, ledger, and budget code. They can cause silent money loss, debt corruption, or data inconsistency. None are exploitable from the outside, but all are real correctness bugs.

---

## MON-01 🔴 `chargeOrder` returns success even when HYP charge fails

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:139-192`](../../../functions/src/modules/payments/api/chargeOrder.ts)

**The issue**

```ts
const res = await hypPaymentService.chargeJ5Transaction(...);
if (res.success) {
  // post ledger transaction, write payments doc
}
return { success: true }; // ← runs even when res.success === false
```

**Impact**

- Client sees a success response from a failed payment
- UI may mark the order as charged when no money moved
- No transaction is recorded in the ledger either
- The system has no record that the attempt failed → no follow-up will fire
- Reconciliation will be off by every silently-failed charge

**Fix**

```ts
if (!res.success) {
  logger.error("chargeOrder: HYP charge failed", { orderId, hypError: res.error });
  return { success: false, error: "hyp_failed", details: res.error };
}
// ... ledger write ...
return { success: true };
```

Make sure the client UI handles `{ success: false }` and surfaces it to the admin.

---

## MON-02 🔴 Order place/cancel race silently loses debt reversal

**Files:**
- [`budget/subscribers/reduceDebtOnOrderReversed.ts:61-71`](../../../functions/src/modules/budget/subscribers/reduceDebtOnOrderReversed.ts)
- [`budget/subscribers/increaseDebtOnOrderPlaced.ts`](../../../functions/src/modules/budget/subscribers/increaseDebtOnOrderPlaced.ts)

**The issue**

`handleOrderReversed` reads the `debt_increase` budgetRecord with:
```ts
.where("relatedId", "==", orderId)
.where("type", "==", "debt_increase")
.limit(1)
```

If empty, it **returns silently** (no throw). But `increaseDebtOnOrderPlaced` (the writer of that record) and `reduceDebtOnOrderCancelled` are independent event subscribers — they **race** when a B2B order is placed and quickly cancelled.

Sequence:
1. Order placed → `order.placed` event → `increaseDebtOnOrderPlaced` queued (not yet run)
2. Order cancelled → `order.cancelled` event → `reduceDebtOnOrderReversed` queued
3. `reduceDebtOnOrderReversed` runs first → no `debt_increase` exists yet → returns silently
4. `increaseDebtOnOrderPlaced` runs → debt added
5. The cancel event will never be retried because step 3 already "succeeded"

**Impact**

Permanent ghost debt that should have been zero. No alert, no DLQ entry — the system thinks everything worked. Detection requires manually comparing order status vs budget records.

**Fix**

When `debtIncreaseSnap.empty` AND `order.status` looks placed/active, throw to let the event bus retry. Only treat empty as a silent skip when there's strong evidence the order legitimately never produced a debt_increase (e.g. B2C order, or after sufficient retries).

```ts
if (debtIncreaseSnap.empty) {
  const order = await ordersStore.getOrder({ companyId, storeId, orderId });
  if (order?.isB2B && !order.budgetSettled) {
    throw new Error(`debt_increase not yet written for order ${orderId}; will retry`);
  }
  logger.info("reduceDebtOnOrderReversed: no debt_increase, skipping (B2C or already settled)", { orderId });
  return;
}
```

---

## MON-03 🔴 `organizationName` clobbered with raw `organizationId` on every B2B payment

**Files:**
- [`budget/subscribers/reduceDebtOnTransactionPosted.ts:86-89`](../../../functions/src/modules/budget/subscribers/reduceDebtOnTransactionPosted.ts)
- [`budget/services/applyBudgetEvent.ts:158-167`](../../../functions/src/modules/budget/services/applyBudgetEvent.ts)

**The issue**

The comment in `reduceDebtOnTransactionPosted` claims the snapshot's `organizationName` is "preserved across updates" — but `applyBudgetEvent` does:

```ts
txn.set(snapshotRef, snapshot); // organizationName: input.organizationName
```

`.set()` **fully overwrites** the document. The subscriber passes `organizationName: organizationId` (the literal org ID string) as a fallback when the name isn't readily available. Result: every successful B2B payment clobbers the customer-friendly name in the org budget snapshot with the bare ID.

**Impact**

Admin dashboards (`listBudgetAccounts` → `mapBudgetAccountResponse`) show `organizationName = "acme-corp-1234"` instead of "Acme Corp." after the first payment. Corrupts user-facing data.

**Fix — Option A (preferred)**

In `applyBudgetEvent`, read the existing snapshot and preserve its name when input is missing or equals the org ID:

```ts
const existing = await txn.get(snapshotRef);
const existingName = existing.data()?.organizationName;
const finalName =
  input.organizationName && input.organizationName !== input.organizationId
    ? input.organizationName
    : existingName ?? input.organizationName;

txn.set(snapshotRef, { ...snapshot, organizationName: finalName });
```

**Fix — Option B**

In `reduceDebtOnTransactionPosted`, look up the organization doc before calling `applyBudgetEvent`:

```ts
const orgDoc = await getOrganization({ companyId, storeId, organizationId });
const realName = orgDoc?.name ?? organizationId;
await applyBudgetEvent({ ..., organizationName: realName });
```

---

## MON-04 🟠 Schema-invalid `amount: 0` writes when reversal clamps to zero

**File:** [`budget/services/applyBudgetEvent.ts:137-151`](../../../functions/src/modules/budget/services/applyBudgetEvent.ts)

**The issue**

When a `debt_reduction` arrives and `currentDebt === 0`, `Math.min(input.amount, currentDebt) === 0`. The code sets `record.amount = 0` and writes via `txn.create(recordRef, record)`. But `BudgetRecordSchema` declares `amount: z.number().int().positive()` ([`packages/core/lib/entities/Budget.ts:18`](../../../packages/core/lib/entities/Budget.ts)).

Firestore doesn't validate Zod schemas — the write succeeds. But any consumer that runs `BudgetRecordSchema.parse(...)` on a re-read will throw.

**Impact**

Silently corrupts the immutable ledger with schema-invalid rows. Future strict reads / migrations / aggregations will crash on these rows.

**Fix**

If `appliedAmount === 0`, skip the record write entirely (still claim the idempotency marker so the event is consumed):

```ts
if (appliedAmount === 0) {
  logger.warn("applyBudgetEvent: reduction had nothing to reduce", { input });
  // claim the marker so we don't retry forever
  txn.create(idempotencyRef, { eventId, claimedAt: Date.now() });
  return;
}
// ... proceed with record + snapshot writes
```

---

## MON-05 🟠 `postManualTransaction` hardcodes `direction: "in"`

**File:** [`functions/src/modules/ledger/api/postManualTransaction.ts:84`](../../../functions/src/modules/ledger/api/postManualTransaction.ts)

**The issue**

```ts
const result = await postTransaction({
  ...
  direction: "in", // hardcoded
});
```

The input schema doesn't accept `direction` at all. Admins have no way to record outflows (refunds/corrections) through this API.

**Impact**

Documented as the entry point for "external money movement (cash, bank transfer, etc.)" — but cannot record outgoing money. Admins will resort to workarounds (manual Firestore edits, fake refunds).

**Fix**

```ts
const InputSchema = z.object({
  ...
  direction: z.enum(["in", "out"]),
});

const result = await postTransaction({
  ...
  direction: input.direction,
});
```

Update the admin UI to expose a direction toggle.

---

## MON-06 🟠 `chargeOrder` swallows all exceptions, returns `null`

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:193-196`](../../../functions/src/modules/payments/api/chargeOrder.ts)

**The issue**

```ts
} catch (error: any) {
  functions.logger.error("chargeOrder: failed", { message: error.message });
  return null;
}
```

The success path returns `{ success: true }`, but the error path returns plain `null`. Callable clients typically do `result.data.success` — they'll throw on `null.success`.

**Impact**

Client-side crashes, inconsistent error shapes, no error code returned to the user.

**Fix**

```ts
} catch (error: any) {
  functions.logger.error("chargeOrder: failed", { message: error.message, stack: error.stack });
  return { success: false, error: "internal" };
}
```

Match the success-shape contract used by sibling callables (`postManualTransaction`, `recordHypDirectPayment`).

---

## MON-07 🟠 `chargeOrder` silent failures on missing payment doc and undefined transactionId

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:91-102`](../../../functions/src/modules/payments/api/chargeOrder.ts)

**The issue**

```ts
if (!paymentDoc.exists) {
  // todo return err
  return;          // ← returns undefined to client
}
// ...
if (!transactionId) {
  // todo            ← falls through with transactionId undefined
}
// ... then:
await hypPaymentService.chargeJ5Transaction({
  transactionId: payment.payment.Id, // ← undefined!
  ...
});
```

**Impact**

Either silent failure to caller, or worse — the HYP call may succeed with a bad-id charge that can't be reconciled.

**Fix**

```ts
if (!paymentDoc.exists) {
  return { success: false, error: "payment_doc_missing" };
}
const transactionId = payment.payment.Id;
if (!transactionId) {
  return { success: false, error: "missing_hyp_tx_id" };
}
```

---

## MON-08 🟠 NaN unguarded in `chargeOrder` amount math

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:124-125, 144`](../../../functions/src/modules/payments/api/chargeOrder.ts)

**The issue**

```ts
originalAmount: Number(payment.payment.Amount).toFixed(2) as any,
// ...
const amountAgorot = Math.round(adjustedAmount * 100);
```

No NaN guard. If `payment.payment.Amount` is malformed, `Number(...) = NaN`, `.toFixed(2) = "NaN"`, and the HYP call is sent garbage. NaN ripples into `postTransaction`, where `amount: z.number().int().positive()` — Zod rejects NaN, throwing inside the swallowed `.catch()`.

**Impact**

Silent failure; no client-visible signal that the charge succeeded but ledger recording failed; reconciliation drift.

**Fix**

Validate explicitly before calling HYP and `postTransaction`:

```ts
const amountAgorot = Math.round(adjustedAmount * 100);
if (!Number.isFinite(amountAgorot) || amountAgorot <= 0) {
  logger.error("chargeOrder: invalid amount", { orderId, adjustedAmount });
  return { success: false, error: "invalid_amount" };
}
```

Mirror the validation pattern in `recordHypDirectPayment.ts:152`.

---

## MON-09 🟠 `addBudgetManualTransaction` has no idempotency — double-click double-credits

**File:** [`functions/src/modules/budget/api/budgetApi.ts:199-213`](../../../functions/src/modules/budget/api/budgetApi.ts)

**The issue**

```ts
await applyBudgetEvent({
  ...
  relatedId: `manual-${Date.now()}-${createdBy}`, // unique per call
  causedByEventId: null, // skips idempotency marker
});
```

The comment says "manual writes have no event idempotency" — and the API also doesn't accept a client-supplied idempotency key. Two near-simultaneous calls (admin double-click, retry on slow network) get different timestamps and create two records.

**Impact**

An admin who double-submits a "credit note" of 5000 agorot reduces debt by 10000.

**Fix**

```ts
const InputSchema = z.object({
  ...
  idempotencyKey: z.string().uuid(), // required
});

await applyBudgetEvent({
  ...
  causedByEventId: `manual_${input.idempotencyKey}`,
});
```

Update the admin UI to generate one UUID per submission attempt (not per keystroke). The same UUID is sent on retry; new submission = new UUID.

---

## MON-10 🟡 `cart.cartTotal` still propagated as shekel float through events

**Files:**
- [`budget/subscribers/increaseDebtOnOrderPlaced.ts:81-95`](../../../functions/src/modules/budget/subscribers/increaseDebtOnOrderPlaced.ts) (TODO acknowledges this)
- [`payments/api/chargeOrder.ts:144`](../../../functions/src/modules/payments/api/chargeOrder.ts)
- [`ledger/api/recordHypJ5Auth.ts:123`](../../../functions/src/modules/ledger/api/recordHypJ5Auth.ts)
- [`orders/services/cancelOrder.ts:43`](../../../functions/src/modules/orders/services/cancelOrder.ts)
- [`orders/services/refundOrder.ts:39`](../../../functions/src/modules/orders/services/refundOrder.ts)

**The issue**

Per CLAUDE.md: money is stored as integer agorot. Floats only at external boundaries (HYP, ezCount). But `cart.cartTotal` is still a shekel float that flows through events. Subscribers don't trust these fields (they re-read the server doc), so it's not currently exploitable, but:

1. It pollutes events with floats (trap for future subscribers naively using `payload.total`)
2. Conversion `Math.round(adjustedAmount * 100)` can drift if the source cart total has rounding error from float math earlier

**Impact**

Not currently exploited. Future-trap. Reconciliation drift if a subscriber ever trusts the payload value.

**Fix**

Either:
- **Option A (cleaner):** drop `total` from event payloads — subscribers must re-read the server doc, documented behavior
- **Option B:** convert to agorot at emission time, name the field `totalAgorot`, document the unit

Long-term: migrate `cart.cartTotal` storage to agorot. There's a migration plan in `docs/plans/budget-cart-edit-sync.md` — extend that scope.

---

## MON-11 🟡 `writePaymentLink` uses `.set()` not `.create()`

**File:** [`functions/src/modules/ledger/internal/paymentLinksStore.ts:7-11`](../../../functions/src/modules/ledger/internal/paymentLinksStore.ts)

**The issue**

If a token collision occurs (cryptographically unlikely with 12 random bytes, but theoretically possible), the new link silently overwrites the old.

**Fix**

```ts
await ref.create(link); // throws ALREADY_EXISTS on collision
```

Catch and retry with a new token on collision.

---

## MON-12 🟡 `paymentRedirects` token only 8 chars + uses `.set()`

**File:** [`functions/src/modules/payments/api/createPaymentRedirect.ts:118-127`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts)

**The issue**

```ts
const token = randomBytes(6).toString("base64url"); // 8 chars
await admin.firestore().collection("paymentRedirects").doc(token).set(...);
```

8 chars from base64url = ~48 bits of entropy. Collision risk is small but real at scale, and `.set()` silently overwrites.

(Also: root collection — see [SBE-04](03-backend-structure.md#sbe-04) in the backend structure report.)

**Fix**

- Use `randomBytes(16).toString("base64url")` (22 chars, 128 bits)
- Use `.create()` instead of `.set()`
- Move to tenant-scoped path

---

## MON-13 🟡 `markOrderPaidOnTransactionPosted` read-then-write is not transactional

**File:** [`functions/src/modules/orders/subscribers/markOrderPaidOnTransactionPosted.ts:166-172`](../../../functions/src/modules/orders/subscribers/markOrderPaidOnTransactionPosted.ts)

**The issue**

The subscriber correctly guards against downgrades (`TERMINAL_STATUSES` + status === nextStatus), but the read-then-write is not transactional. A concurrent event for the same order could write a lower status between the read and the set.

**Impact**

Likely benign (both events converge to `completed` eventually), but ordering is racy.

**Fix**

Wrap in `runTransaction`:

```ts
await db.runTransaction(async (tx) => {
  const snap = await tx.get(orderRef);
  const current = snap.data()?.status;
  if (TERMINAL_STATUSES.has(current) || current === nextStatus) return;
  tx.update(orderRef, { status: nextStatus, updatedAt: Date.now() });
});
```

---

## MON-14 🟡 `recordHypDirectPayment.consumeResult` failure is best-effort

**File:** [`functions/src/modules/ledger/api/recordHypDirectPayment.ts:233-255`](../../../functions/src/modules/ledger/api/recordHypDirectPayment.ts)

**The issue**

If `validateAndConsumeLink` fails AFTER `postTransaction` succeeds (and the reason is `consume_failed`, not `already_used`), the link remains unconsumed. A subsequent browser replay would retry `postTransaction` (idempotent, OK) AND retry `validateAndConsumeLink` (which then marks it used). The window is small but non-zero — a manual call with the token could potentially re-use the link during the failure window.

**Fix**

Either:
1. Retry `validateAndConsumeLink` inline (3 attempts with backoff)
2. Surface the partial-failure explicitly to the caller, log loudly, and add a cleanup job that consumes orphaned links

---

## MON-15 🟡 Mutation in transaction callback — fragile across retries

**File:** [`functions/src/modules/budget/services/applyBudgetEvent.ts:78-96, 151`](../../../functions/src/modules/budget/services/applyBudgetEvent.ts)

**The issue**

The `record` object is built outside the transaction (line 78), then mutated inside the transaction at line 151 (`record.amount = appliedAmount`). Mutating an object referenced by a transaction-local Firestore write is fragile: if Firestore SDK serialized `record` differently across retries (transactions can be re-run on conflict), one retry could write the original `input.amount` and another the clamped value.

Currently `txn.create(recordRef, record)` reads the live object at write time, so this works. But the pattern is brittle.

**Fix**

Construct the final record inside the transaction:

```ts
const recordToWrite = { ...record, amount: appliedAmount };
txn.create(recordRef, recordToWrite);
```

Treat all values inside `runTransaction` callbacks as if they may run multiple times.
