# Admin — Charge Order (J5 capture)

> Full-checklist spec (see `_TEMPLATE.md`). ✅ works · ❌ missing · ⚪ N/A · ❓ not yet verified.

## Feature
Admin charges a J5 order — **captures** the pre-auth via HYP. On success order +
payment → `completed`.

## Flow
1. Admin **Charge** → `appApi.admin.chargeOrder({order})` → `chargeOrder`.
2. `hypPaymentService.chargeJ5Transaction(...)` (HYP capture: `action=soft`, `originalUid`, `AuthNum`, `authorizationCodeManpik=7`).
3. On success sets order `paymentStatus: completed`, `status: completed`.

## Test plan
1. Open J5 order (`pending_j5`). Advance status as needed. Click **Charge**.
2. Order → `completed` + `paymentStatus: completed`.

---

## Expected effects — FULL checklist

### 1. Firestore writes
| Path | Op | Notes | Status |
|---|---|---|---|
| `…/orders/{id}` | update | `status`/`paymentStatus → completed` | ✅ |

### 2. Expected DB state
- Order `completed`, `paymentStatus: completed`. ✅ (TEQD3ru3)

### 3. Events emitted
- ⚪ none on charge. (`order.placed` already fired at creation; `order.cancelled` only on cancel.)

### 4. Subscribers / services (on update)
| Service | When | Status |
|---|---|---|
| `trackOrderPayment` | `paymentStatus → completed` | ✅ fired |
| `completeOrder` | `status → completed` | ✅ fired (skipped delivery note — already paid) |

### 5. Cloud Functions
| Fn | Effect | Status |
|---|---|---|
| `chargeOrder` | HYP J5 **capture** | ✅ `chargeJ5Transaction success` |
| `onOrderUpdate` | fires on completion | ✅ |

### 6. 💰 Ledger transaction
| Expected | Status |
|---|---|
| `hyp_capture` transaction recorded (amount, direction in, HYP id/UID, dedup) | ❌ **MISSING — `transactions` empty, ledger unwired** |
| order `lastPaymentTransactionId` link | ❌ null |

### 7. 💰 Budget (B2B)
- `trackOrderPayment` → `organizationActions.onPaymentCompleted(order)` **only if `organizationId`**. Verified order B2C (null) → N/A. ❓ B2B budget impact NOT yet validated (needs a B2B order test).

### 8. Storage
- `completeOrder` creates delivery note (ezcount) for **cash-on-delivery**; skipped here (paid). ⚪/❓ not validated for COD path.

### 9. Search index — ⚪ none.

### 10. Emails / notifications
- ❓ Completion / invoice email to customer not verified. ❓ ezcount invoice creation not verified.

### 11. External services
- HYP **capture** = real card charge ✅. ezcount invoice ❓.

### 12. Idempotency
- ❓ **Charging twice?** No obvious dedup in `chargeOrder` — risk of double-capture if clicked twice. NOT validated. (Ledger's dedup would cover this once wired.)

### 13. Tenant — ✅ balasistore (token-derived).

## Logs to expect
- `chargeOrder` → `chargeJ5Transaction success` → `order completed`
- `onOrderUpdate` `paymentStatus → completed`, `trackOrderPayment`, `completeOrder`

## Known gaps / not-yet-wired
- ❌ **No `hyp_capture` ledger transaction** (ledger unwired) → no money record for the capture.
- ❓ B2B budget impact on payment completion not validated.
- ❓ Double-charge protection on `chargeOrder` not validated.
- ⚠️ Debug-log noise in `modules/payments/api/chargeOrder.ts` (`console.log` "PPPPPPPPPP…", `context.auth?.token …`) — convert to structured `functions.logger`, no token fields.

## Production / risk notes
- Real card **capture** (money actually charged) on the live HYP terminal.
