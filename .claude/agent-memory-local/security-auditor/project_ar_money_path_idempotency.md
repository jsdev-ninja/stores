---
name: ar-money-path-idempotency
description: How B2B AR accrual idempotency works on the order.completed → delivery-note → accrue path, and where the one real double-accrual race lives
metadata:
  type: project
---

The B2B accounts-receivable (AR) accrual flow: `onOrderUpdate` (status → completed) emits `order.completed` → `createDeliveryNoteOnOrderCompleted` (paymentType "external" only) calls `appApi.documents.createDeliveryNote` → that emits `documents.delivery_note_created` → `accrueOnDeliveryNoteCreated` writes the AR entry via `accrueDebt` → `writeArEntry` (organizationBalanceStore.ts).

**Why:** Audited 2026-06-26 for a production deploy gate. Verdict was REVIEW NEEDED (no CRITICAL/HIGH).

**How to apply (durable facts for future audits of this path):**
- **The real idempotency backstop is `writeArEntry`**: `txn.create(entryRef)` with deterministic id `dn_{deliveryNoteId}` (organizationBalanceStore.ts:152). Atomic — entry + rollup in one transaction; ALREADY_EXISTS aborts both. This bulletproofs double-accrual *for the same deliveryNoteId only*.
- **The one gap that survives all guards:** a redelivered/overlapping `order.completed` (event bus is at-least-once, `retry:true`, 5 attempts) can create TWO distinct physical delivery notes (different EZCount `doc_number`s) if both fire before the first writes `order.deliveryNote` back. Both pass the subscriber guard (reads `order.deliveryNote`) AND the appApi internal guard at appApi/index.ts:111 — because that guard re-checks the SAME in-memory `order` object passed by value, not a fresh read. Two distinct doc_numbers → two distinct `dn_{id}` entries → the atomic gate does NOT collapse them → double `owed`. Whether it materializes hinges on whether EZCount dedupes on `transaction_id: delivery:${order.id}` (ezCountService sends this + `auto_balance:true`); EZCount dedup behavior is NOT documented/confirmed.
- **Disjointness of the two `order.completed` subscribers is solid:** paymentType enum is `["external","j5","none"]` (core Order.d.ts). external→DN/AR subscriber, j5→`chargeJ5OnOrderCompleted`, none→neither. Both re-validate against the server doc. They cannot both act on one order.
- **No loop:** `createDeliveryNote` writes only `deliveryNote`/`ezDeliveryNote` via `.update()`, never `status`. `onOrderUpdate` emits only on `before.status!=="completed" && after==="completed"`. DN write can't re-emit.
- **Payload trust is correct:** companyId/storeId come only from the Firestore trigger wildcards (ctx), never payload. AR amount + organizationId read from the SERVER order doc, not the event payload. A spoofed event can't inflate amount or fabricate debt for a missing order (subscriber returns early if order absent).
- See [[prod-rules-open-implication-for-events]] for the open-rules angle on forged events.
