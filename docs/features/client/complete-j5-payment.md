# Client — Complete J5 Payment (HYP)

> Full-checklist spec (see `_TEMPLATE.md`). ✅ works · ❌ missing · ⚪ N/A · ❓ not yet verified.

## Feature
After placement, the J5 customer pays on HYP — a **pre-authorization** (hold, not
capture). On success HYP redirects back. We verify what records the J5 result.

## Flow
1. Checkout J5 → `createPayment` builds HYP form → browser POSTs to HYP.
2. Customer enters card → HYP J5 pre-auth (success `CCode=0`, code `700`, returns auth code/UID).
3. HYP redirects back (success/pending/error page).

## Test plan
1. On HYP page, enter card → complete J5 auth.
2. Observe redirect; check order `paymentStatus`.

---

## Expected effects — FULL checklist

### 1. Firestore writes
| Path | Op | Notes | Status |
|---|---|---|---|
| `…/orders/{id}` | update | `paymentStatus → pending_j5` | ✅ (TEQD3ru3 reached `pending_j5`) |

### 2. Expected DB state
- Order `paymentStatus: pending_j5` (card held, not captured). ✅
- ❓ **What sets `pending_j5`** (which function/handler) — NOT yet traced. Needs a log check.

### 3. Events emitted
- `order.placed` already fired at creation — must NOT fire again here. ✅ (verified single emit)

### 4. Subscribers
- ⚪ none specific to J5 auth in the live (legacy) path.
- (Intended: `ledger.transaction_posted` → `markOrderPaidOnTransactionPosted` → set `pending_j5` — but ledger unwired.)

### 5. Cloud Functions / triggers
| Fn | Effect | Status |
|---|---|---|
| `createPayment` | built the HYP form at checkout | ✅ |
| J5 return handler (`getPaymentRedirect`? other?) | record result | ❓ not traced |
| `onOrderUpdate` | fires on the `paymentStatus` change | ✅ (fired for TEQD3ru3) |

### 6. 💰 Ledger transaction
| Expected | Status |
|---|---|
| `hyp_j5_auth` transaction recorded (amount, direction in, HYP UID, dedup `hyp_…`) | ❌ **MISSING — `transactions` empty, ledger unwired** |
| order `lastPaymentTransactionId` | ❌ null |

### 7. 💰 Budget (B2B)
- ⚪ Budget impact only on capture/completion for B2B; verified order B2C → N/A. ❓ B2B not validated.

### 8. Storage — ⚪ none.
### 9. Search index — ⚪ none.

### 10. Emails / notifications
- ❓ J5-auth customer/admin email not verified.

### 11. External services
- HYP J5 pre-auth = **real card authorization** ✅. ezcount — ❓ (not at auth stage).

### 12. Idempotency
- HYP duplicate-charge protection is the intended `ledger` job (record + detect) — ❌ not active (ledger unwired). Risk: a double J5 on HYP would not be detected internally.

### 13. Tenant — ✅ balasistore.

## Logs to expect
- `createPayment` (at checkout), J5 return handler, `onOrderUpdate` paymentStatus change.

## Known gaps / not-yet-wired
- ❌ **No `hyp_j5_auth` ledger transaction** (ledger unwired) → no money trail, no duplicate-charge detection.
- ❓ The exact function that sets `paymentStatus: pending_j5` after the HYP redirect is not yet traced — VERIFY.
- ❓ Customer/admin J5 email not verified.

## Production / risk notes
- Real card pre-authorization on the live HYP terminal.
