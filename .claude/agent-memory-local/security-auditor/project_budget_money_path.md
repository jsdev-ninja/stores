---
name: project_budget_money_path
description: Budget B2B accounts-receivable money path — event-driven debt model, server-amount invariant, and the reversal double-credit gap
metadata:
  type: project
---

Budget = B2B accounts-receivable, event-driven. `applyBudgetEvent` is the only writer of `budgetRecords` (append-only) + `organizationBudgets` (balance snapshot), atomic via a txn with an idempotency marker keyed on `causedByEventId`.

Strong invariants that hold:
- `order.placed` and `order.cancelled/refunded` subscribers re-read the SERVER order doc for amount (`cart.cartTotal`) and organizationId — event payload amounts are ignored. Spoofed events can't inflate debt there.
- Event bus binds companyId/storeId/eventId from the Firestore doc PATH (`{companyId}/{storeId}/events/{id}`), not payload — tenant context is trustworthy. Clients can't write `events` IF rules deployed.
- Ledger transactions dedup on `hyp_{Id}` etc. HYP VERIFY runs before any write.

**Gap (reversal double-credit):** `reduceDebtOnOrderReversed` handles cancel AND refund as separate events (separate eventIds → separate idempotency markers). `onOrderUpdate` only guards `before.status !== X`, not a terminal state machine, so an order can emit BOTH cancelled and refunded → 2× full-cartTotal debt_reduction for one order. No check that a matching debt_increase exists. `organizationBudgets.totalCurrentDebt` has no non-negative floor → debt can go negative (phantom credit). Order `status` is client-writable (see [[project_firestore_rules_deploy]]), so this is reachable by whoever can write orders/{id}.status under prod rules.

**Gap (ledger reduction trusts payload):** `reduceDebtOnTransactionPosted` uses `payload.amount` and `payload.payer.organizationId` directly (does NOT re-read the ledger tx doc), unlike the order subscribers. Safe only because clients can't write `events` when rules are deployed; if rules are absent/permissive it's an inflation vector.

**RESOLVED (re-audit 2026-05-31):** Both gaps fixed. (1) Reversal now uses a PER-ORDER dedup key `order_reversal_{orderId}` (cancel+refund collapse to one marker) and reverses the original `debt_increase` record amount, no-op if none exists. (2) `applyBudgetEvent` clamps `debt_reduction` with `Math.min(amount, currentDebt)`, records the clamped amount, logs `budget.reduction.clamped` on over-reduction — balance can't go negative. (3) `reduceDebtOnTransactionPosted` now re-reads the stored tx via `getTransactionById` and takes amount/direction/reference/payer from the verified doc; payload is routing hint only. Reads-before-writes preserved in the txn.

**Deploy gate — composite index needed:** The reversal query `budgetRecords.where(relatedId==orderId).where(type==debt_increase).limit(1)` needs a composite index on `relatedId`(ASC)+`type`(ASC). NOT present in `functions/firestore.indexes.json` (5 existing indexes, none cover this pair). Until created the query throws FAILED_PRECONDITION → event-bus retries forever, reversals never apply. Not a security regression (fails closed, no double-credit) but a hard deploy blocker. Add before deploy.

**How to apply:** On any budget/ledger change, check (1) reversal netting against debt_increase existence, (2) negative-balance floor, (3) whether reduceDebtOnTransactionPosted still re-reads the tx doc, (4) any new two-equality-filter budgetRecords query has a matching composite index.
