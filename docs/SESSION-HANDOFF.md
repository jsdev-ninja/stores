# Session handoff — budget + ledger rollout

Paste the block below into a new session to continue.

---

I'm the developer (Philip) on **@jsdev-store** (Storebrix) — a Firebase Cloud Functions **modular monolith** (`functions/src/modules/{name}`). Project: **jsdev-stores-prod**. Continue from a prior session.

## Standing rules (do not break)
- **Never commit/push/deploy without my explicit ask** — I run deploys myself. Work on a feature branch, never `main`.
- Tabs not spaces; timestamps = `number` epoch millis (`Date.now()`, never Firestore Timestamp/serverTimestamp); money = integer **agorot**; Firestore paths via `FirebaseAPI.firestore.getPath` (`{companyId}/{storeId}/{collection}`), no root collections.
- You're the orchestrator: delegate code changes to agents; pipeline = architect → coder → code-review → security-audit → gates. Gate before deploy + before editing `functions/src/index.tsx`.
- Dev/preview only on test stores (tester_company/tester_store, port 5175). I sometimes test on **balasistore (production)** deliberately with a prod test account.
- Use the **Firebase MCP** for verification (`firestore_get_document`, `firestore_query_collection`, `functions_get_logs`, `functions_list_functions`) — gcloud/ADC tokens keep expiring, prefer the MCP.

## What we just built: event-driven budget + ledger (DEPLOYED, uncommitted)
**Budget = B2B accounts-receivable only.** New model (replaces the old `budgetAccounts`/`budgetTransactions` writer path; old data left inert, reset-to-zero cutover):
- `budgetRecords/{id}` — flat append-only (org, customer, type debt_increase|debt_reduction, amount agorot, relatedId, yearMonth in Asia/Jerusalem, causedByEventId). Source of truth.
- `organizationBudgets/{organizationId}` — balance snapshot (derived; clamped ≥ 0).
- Subscribers: `order.placed`→`increaseDebtOnOrderPlaced` (B2B only, amount from server order doc); `order.cancelled`/`refunded`→`reduceDebtOnOrderReversed` (once per order, reverses original debt_increase); `ledger.transaction_posted`→`reduceDebtOnTransactionPosted` (re-reads the verified `transactions/{id}` doc).
- **Ledger wired:** `chargeOrder` posts `hyp_capture`, `recordHypDirectPayment` posts `hyp_direct` (both with `payer.organizationId` + `reference.orderId`). `transaction_posted` → `markOrderPaidOnTransactionPosted` sets `order.paymentStatus`.
- Pipeline done: architect plan (`docs/plans/budget-implementation.md`, model in `docs/plans/budget-model.md`) → coded → review (fixed a txn read-after-write) → security audit (was DO-NOT-SHIP; fixed reversal double-credit/negative-floor, re-read verified tx, fail-closed org, token-only tenant) → **re-audit CLEAR**.
- `index.tsx` wired (4 budget subscribers + `onTransactionPostedMarkOrderPaid` + 7 ledger callables). **Functions deployed and confirmed live.**

## Behavior changes to remember
- `order.placed` now fires on **every order creation** (not status-gated) → admin email + cart close happen at creation, incl. abandoned J5.
- Charging sets `order.paymentStatus = completed` only — **NOT** order `status`.
- `markOrderPaid` callable is **disabled**. Manual budget credit = `addBudgetManualTransaction` (no idempotency, admin-gated).

## IMMEDIATE NEXT STEP — verify the full B2B order flow
I'm running: **client places a B2B (organization) order → admin charges (J5 capture)**. Verify EVERY step via the Firebase MCP. Ask me for the `organizationId` (or org/customer) + order id, then check:
1. order doc created — `organizationId` set, status, cart.cartTotal.
2. `order.placed` → `increaseDebtOnOrderPlaced` log → `organizationBudgets/{org}.totalCurrentDebt += cartTotal` + a `budgetRecords` debt_increase row; admin email + cart closed.
3. J5 auth → `order.paymentStatus = pending_j5`.
4. admin charge → `chargeOrder` → `transactions/{id}` (`hyp_capture`, `payer.organizationId`).
5. `transaction_posted` → `markOrderPaidOnTransactionPosted` → `paymentStatus = completed`.
6. `reduceDebtOnTransactionPosted` → `organizationBudgets` debt `-=` amount + a `budgetRecords` debt_reduction row.
Confirm net balance, both rows, transaction, paymentStatus, and **no error logs**. (B2C order = zero budget effect, by design.)

## Open / pending (not blocking the test)
- **Deploy the budget indexes:** `firebase deploy --only firestore:indexes` (I added the `firestore.indexes` block to `functions/firebase.json` — indexes only, NO rules). `firestore.indexes.json` is a complete superset (existing 11 + 6 budget). Needed for cancel/refund reversal query + admin `getBudgetTransactions` view. Core debt up/down works without it.
- 🔴 **Whole Firestore is WIDE OPEN** in prod (`allow read,write: if true`). Budget collections can't be locked without a full rules overhaul. The restrictive `firestore.rules` draft was deleted (would have bricked the storefront). Track a "lock down Firestore rules" project. Never deploy `firestore:rules` until a complete merged ruleset exists.
- New ledger callables (`recordHypJ5Auth`, `recordHypDirectPayment`, `getPaymentLink`, `createHypCheckoutPayment`, …) need `allUsers` invoker IF called directly (not needed for the existing checkout/charge flow).
- Rotate the HYP credentials (were previously logged in plaintext by `createPayment` — now fixed). `chargeOrder` had stray debug logs (mostly cleaned).
- J5 **auth** posts no ledger transaction (only capture does); the exact handler that sets `pending_j5` after the HYP redirect isn't fully traced.
- Stuck-cart trap: `order.id == cart.id` (deterministic), so if a cart's order exists but the cart never closed, re-checkout is an idempotent no-op → cart can't clear.
- Catalog migration: `createProduct` done + deployed; edit/delete/categories still legacy client-direct writes.
- Everything is **uncommitted on `main`** — review + branch before committing.
- Feature/verification docs in `docs/features/{admin,client}/`; `LESSONS.md` (HYP amount must be `.toFixed(2)`).
