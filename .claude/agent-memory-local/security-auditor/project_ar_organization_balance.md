---
name: project-ar-organization-balance
description: Security model of the documents-module AR ledger (organizationBalance + rollup) — what makes it tenant-safe and replay-safe
metadata:
  type: project
---

The B2B accounts-receivable system lives in `functions/src/modules/documents/` (moved out of budget/ledger).
Two tenant-scoped collections: `organizationBalance` (append-only entry ledger, source of truth) and
`organizationBalanceRollup/{organizationId}` (per-org cache, rebuildable). Both under `{companyId}/{storeId}/...`.

**Why it is tenant-safe (audited clean 2026-06-14):**
- Admin callables `getOrganizationBalance` + `reconcileOrganizationBalanceCallable` follow the canonical
  secure pattern ([[project-auth-tenant-model]]): `if (!auth?.token.admin) return Unauthorized`, then
  companyId/storeId taken ONLY from token claims. Client supplies only `organizationId` (a doc-id WITHIN the
  caller's own tenant path) — cannot reach another tenant.
- Subscribers (`accrueOnDeliveryNoteCreated`, `settleOnTransactionPosted`) get companyId/storeId from
  `ctx`, which the eventBus derives from the Firestore doc PATH `{companyId}/{storeId}/events/{id}`
  (`subscribe.ts` `firestoreEvent.params`), NOT from the event payload. Trusted source.
- Authoritative money values are re-read from server docs: accrual amount from `order.cart.cartTotal`
  (×100 shekels→agorot); settlement amount/direction/type/payer from the stored `transactions` doc via
  `getTransactionById` (tenant-scoped path read). Event payload is only a routing hint.

**Why it is replay/double-apply safe:**
- Deterministic doc ids: accrual `dn_{deliveryNoteId}`, settlement `settle_{transactionId}` (keyed on
  txId NOT eventId — replay/backfill = no-op). `writeArEntry` does `txn.create(entry)` + `txn.set(rollup)`
  in ONE runTransaction; ALREADY_EXISTS aborts both so rollup never double-applies.
- Settlement allow-list `RECEIVED_MONEY_TYPES = {hyp_capture, hyp_direct, manual}` — `hyp_j5_auth` (hold)
  and refunds (`direction:"out"`) cannot move AR.
- No double-accrual overlap: old `ledger/subscribers/postDebitOnDeliveryNoteCreated.ts` is DELETED in the
  same release that adds the documents accrual subscriber.

**Firestore rules:** still none in repo (`firebase.json` has firestore.indexes but NO rules key) — see
[[project_firestore_rules_deploy]]. New collections inherit whatever prod rules exist (out of band). No
client read path exists (admin UI repoint deferred; `apps/store/src/lib/firebase/api.ts` has no AR refs),
so the only client surface is the two admin-gated callables. Composite index
`organizationBalance(organizationId ASC, createdAt ASC)` added — covers the date-range statement query.
