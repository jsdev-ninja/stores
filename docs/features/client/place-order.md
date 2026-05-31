# Client — Place Order (Checkout "Order" button)

## Feature

A logged-in client submits the checkout form. An order doc is created — and
**creating the order is the placement**: `order.placed` fires on creation
(admin email + cart close), regardless of status. The client is then taken to
payment depending on the store/profile `paymentType`.

> **Flow** (`CheckoutPage.tsx` onSubmit):
> 1. Build `newOrder` from cart + form (address, delivery date, invoice info), `date = Date.now()`.
> 2. **If `paymentType === "external"`**: `status = "pending"`, `paymentType = "external"`
>    → `appApi.orders.order({ order })` → navigate to `store.orders`. **No gateway.**
> 3. **Else (J5, default)**: `paymentType = "j5"` (order created with `status: "draft"`)
>    → `appApi.orders.order({ order })` → `appApi.user.createPaymentLink({ order, isJ5: true })`
>    (→ backend `createPayment`) → POST/redirect to HYP → **real HYP J5 card pre-auth**.
> - `appApi.orders.order` uses `createV2` (create, idempotent — `success:false` on
>   re-submit/refresh, flow continues either way).

## Placement semantics (important)

`order.placed` fires **once, at order creation, for every order — not gated by
status**. So a J5 order (created as `draft`) emits `order.placed` immediately at
checkout, **before** the customer pays on HYP. Payment is tracked separately via
`paymentStatus` / the ledger flow — it is independent of placement.

> This changed: previously `order.placed` was gated to `pending`/`processing`
> and (for J5) fired only after payment. Now it always fires on creation, and the
> old `onOrderUpdate` draft→pending emit was removed (no double-fire).

## Test plan (user workflow)

1. As a logged-in client with items in cart → go to checkout.
2. Fill the form (name, address, delivery date, phone, email).
3. Click the **Order** button.
4. **External**: lands on orders list, order shown as pending.
5. **J5**: redirected to HYP payment page → complete/cancel card auth.
6. Either way: admin gets the order email and the cart is cleared (at creation).

## DB changes

| Path | Operation | Notes |
|---|---|---|
| `{companyId}/{storeId}/orders/{orderId}` | `create` (`createV2`) | order doc; `status: "draft"` (J5) or `"pending"` (external); `paymentType: "j5"\|"external"` |
| `{companyId}/{storeId}/cart/{cartId}` | update (via subscriber) | cart closed on `order.placed` |

## Expected DB state after

- New order doc at `orders/{orderId}` with the cart snapshot (items, totals, vat,
  delivery), address, deliveryDate, invoice fields. `status` = `draft` (J5) or
  `pending` (external).
- Cart closed (by `onOrderPlacedCloseCart`) — immediately, at creation.
- J5: payment is separate — a HYP transaction is recorded only once the customer
  completes auth on HYP (ledger flow, separate). The order placement does not wait
  for it.

## Events emitted

| Event | When | Where |
|---|---|---|
| `order.placed` | on order **creation**, every order, any status (incl. J5 `draft`). Exactly once. | `onOrderCreated` trigger (inline emit) |

> `onOrderUpdate` no longer emits `order.placed` (removed to avoid double-fire).

## Subscribers (react to `order.placed`)

| Subscriber | Effect |
|---|---|
| `onOrderPlacedAdminEmail` | sends order-placed **email to the store admin** (status-agnostic) |
| `onOrderPlacedCloseCart` | closes the client's cart by `payload.cartId` (status-agnostic) |

## Cloud Functions / triggers fired

| Function | Effect |
|---|---|
| `onOrderCreated` (trigger) | emits `order.placed` (always, on create) |
| `createPayment` (callable, J5 only — client calls it `createPaymentLink`) | builds the HYP J5 payment form/link |
| HYP gateway (J5 only) | external — real card pre-authorization |

## Logs to expect (jsdev-stores-prod)

- `onOrderCreated`: `"new order created"` → emit `order.placed`.
- `onOrderPlacedAdminEmail`: admin email send.
- `onOrderPlacedCloseCart`: `"cart closed"`.
- J5: `createPayment` invocation + HYP request/response.
- All under the active `companyId` / `storeId`.

> Requires the staged functions deploy. Before that, the live code still gates
> `order.placed` on status (skips `draft`) — i.e. J5 won't place/email until deploy.

## ⚠️ Production impact (balasistore = PROD)

- **Real order** created on the live store.
- **Real admin email** + cart close on **every** order creation — including J5
  orders where the customer later **abandons** payment on HYP. (Accepted: placed = created.)
- **J5 → real HYP credit-card pre-authorization** (auth-only, but a live gateway hit).
