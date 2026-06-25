# Payment-link payments now close the order (direct-link cutover)

**Reported by:** David (app owner) — "we send a payment link to a customer, they pay, but the order is not marked as closed/paid."

## The bug (fixed in the companion PR)

The admin "payment link" buttons call legacy `createPaymentRedirect` with
`isJ5: false` (immediate charge). HYP returns **no `UID` token** for a direct
charge, so the storefront `onOrderPaid` treated it as non-J5 and fell into a legacy
fallback that wrote `paymentStatus: "pending_j5"` directly and recorded **no ledger
transaction**. With no `ledger.transaction_posted` event, the
`onTransactionPostedMarkOrderPaid` subscriber never ran and the order never closed.

The backend pipeline (`postTransaction` → event → subscriber) was already built and
deployed (PR #70). The fix wires the storefront to it:

- `recordHypDirectPayment` accepts an optional `token`. Without one it resolves the
  order from the VERIFY-gated `Order` field + tenant input and skips link consume.
- `onOrderPaid` calls `recordHypDirectPayment` for non-J5 HYP charges; the order is
  closed by the subscriber, not by a client write.

HYP VERIFY + `Masof` cross-check gate the write; idempotent on `hyp_{Id}`. Same trust
model as `recordHypJ5Auth`.

## This PR (refactor / cleanup)

- Document the tokenless live flow in the ledger README.
- Drop the legacy write-only `payments`-collection write and the dead
  `originalAmount` / `actualAmount` order fields from `onOrderPaid` (no readers; the
  ledger `transactions` collection is the source of truth).

## Verify before relying on it

End-to-end on a **test store**: pay a real link → order moves to
`paymentStatus: "completed"`, exactly one `hyp_direct` transaction, browser replay is
idempotent (no duplicate transaction).
