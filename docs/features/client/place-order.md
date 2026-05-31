# Client — Place Order (Checkout "Order" button)

> Full-checklist spec (see `_TEMPLATE.md`). ✅ works · ❌ missing · ⚪ N/A · ❓ not yet verified.

## Feature
A logged-in client submits checkout. **Creating the order = placement**: `order.placed`
fires on creation (admin email + cart close), regardless of status. Then payment per
`paymentType` (external = none; J5 = HYP pre-auth).

## Flow
1. Build `newOrder` (id = cart.id, deterministic). `status` = `draft` (J5) / `pending` (external).
2. `appApi.orders.order({order})` → `createV2` (idempotent on duplicate).
3. external → navigate to orders. J5 → `createPaymentLink`→`createPayment` → HYP form.

## Test plan
1. Client with items → checkout → fill form → **Order**.
2. external: lands on orders. J5: redirect to HYP.

---

## Expected effects — FULL checklist

### 1. Firestore writes
| Path | Op | Notes | Status |
|---|---|---|---|
| `…/orders/{id}` | create | `status` draft(J5)/pending(external) | ✅ |
| `…/cart/{cartId}` | update | → `completed` via close subscriber | ✅ |

### 2. Expected DB state
- Order doc with cart snapshot, address, deliveryDate, invoice fields. ✅
- Cart `status: completed`, user has no active cart. ✅ (verified TEQD3ru3)

### 3. Events emitted
| Event | When | Status |
|---|---|---|
| `order.placed` | on creation, every order, any status | ✅ |

### 4. Subscribers
| Subscriber | Effect | Status |
|---|---|---|
| `onOrderPlacedAdminEmail` | admin email | ✅ fired |
| `onOrderPlacedCloseCart` | close cart by `cartId` | ✅ "cart closed" |

### 5. Cloud Functions / triggers
| Fn | Effect | Status |
|---|---|---|
| `onOrderCreated` | emit `order.placed` | ✅ |
| `createPayment` (J5) | build HYP form (amount `.toFixed(2)`) | ✅ |

### 6. 💰 Ledger transaction
| Expected | Status |
|---|---|
| `hyp_j5_auth` / any `transactions` record at placement | ❌ **MISSING — ledger unwired, no transaction written** |
| order `lastPaymentTransactionId` link | ❌ null |

### 7. 💰 Budget (B2B)
- ⚪ Only if `organizationId` set. Verified order was B2C (null) → N/A. ❓ B2B path (org budget via `organizationActions`) not yet validated.

### 8. Storage
- ⚪ none.

### 9. Search index
- ⚪ none.

### 10. Emails / notifications
- Admin "order placed" email ✅. Customer confirmation email ❓ (not verified).

### 11. External services
- HYP J5 form created ✅ (J5 path). ezcount invoice ❓ (likely at later stage, not at placement).

### 12. Idempotency
- `order.id = cart.id` + `createV2` → rage-click/refresh safe ✅. **Trap:** if cart never closed, re-checkout is a no-op → cart stuck (see complete-j5 / known gaps).

### 13. Tenant
- `companyId`/`storeId` from order/token ✅ (balasistore verified).

## Logs to expect
- `onOrderCreated: new order created` → `emit order.placed`
- `closeCartOnOrderPlaced: cart closed`, `onOrderPlacedAdminEmail`
- J5: `createPayment` invocation

## Known gaps / not-yet-wired
- ❌ **No ledger transaction recorded at placement** (ledger module unwired).
- ❓ Customer confirmation email not verified.
- ⚠️ Stuck-cart trap: a cart whose order exists but never closed can't be re-closed via checkout.

## Production / risk notes
- Real order + real admin email on every creation, incl. **abandoned** J5 checkouts.
- J5 = real card pre-authorization on HYP.
