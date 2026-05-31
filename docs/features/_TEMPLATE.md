# <Feature Name>

> Spec + validation checklist. Every feature MUST enumerate **all** side-effects so
> validation can't skip one (the charge-order miss: transaction + budget were not
> listed, so they weren't checked). Mark each line ✅ works / ❌ missing / ⚪ N/A.

## Feature
One-paragraph description + who triggers it (client / admin / system) and the
entry point (page, callable, trigger).

## Flow
Numbered steps from trigger → final state, naming the exact functions/services.

## Test plan (user workflow)
Concrete steps a person follows to exercise it (happy path + key edge cases).

---

## Expected effects — FULL checklist (validate every line)

### 1. Firestore writes
| Path | Op (create/update/delete) | Notes | Status |
|---|---|---|---|

### 2. Expected DB state after
- ...

### 3. Events emitted (event bus)
| Event | When | Payload | Status |
|---|---|---|---|

### 4. Subscribers (react to those events)
| Subscriber | Reacts to | Effect | Status |
|---|---|---|---|

### 5. Cloud Functions / triggers fired
| Function/trigger | When | Effect | Status |
|---|---|---|---|

### 6. 💰 Ledger transaction (money movement)
> Did this create a `transactions` record? type (`hyp_j5_auth`/`hyp_capture`/`hyp_direct`/`manual`/refund), amount (agorot), direction (in/out), dedup key, order↔`lastPaymentTransactionId` link.
| Transaction | Type | Amount | Direction | Status |
|---|---|---|---|---|

### 7. 💰 Budget impact (B2B)
> Only if `organizationId` present. Did the org budget update? `budgetTransactions` entry? Via ledger subscriber or legacy `organizationActions`?
- ...

### 8. Storage (files)
> Images/docs created or removed (e.g. `products/{sku}/...`, invoices, delivery notes). Orphans?
- ...

### 9. Search index (Algolia)
- ...

### 10. Emails / notifications
> Admin email, customer email, push, etc. Who, when.
- ...

### 11. External services
> HYP (auth/capture/verify), ezcount (invoice/delivery note), etc. Real money/side-effects?
- ...

### 12. Idempotency
> Re-run / rage-click / refresh / retry safe? Deterministic id? dedup key?
- ...

### 13. Tenant scoping
- `companyId` / `storeId` derived correctly; no cross-tenant leakage.

---

## Logs to expect (jsdev-stores-prod)
- Function/subscriber log lines + the fields that prove each effect above.

## Known gaps / not-yet-wired
- Anything built-but-unwired, legacy paths, or effects that SHOULD happen but don't.

## ⚠️ Production / risk notes
- Real charges, real emails, irreversible effects, etc.
