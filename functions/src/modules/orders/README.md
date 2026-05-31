# orders

Owns the order lifecycle: creation, status transitions, payment tracking, and document attachment side-effects.

## Firestore paths owned

- `{companyId}/{storeId}/orders/{orderId}` — order documents

## Public surface (via `./index.ts`)

- **Cloud Functions**: `onOrderCreated`, `onOrderUpdate`
- **Events**: `OrderEventTypes` enum, `OrderPlacedPayload`, `OrderCompletedPayload`, `OrderCancelledPayload`, `OrderRefundedPayload` schemas

## Events emitted

| Event | When | Where |
|---|---|---|
| `order.placed` | emitted on order creation (every new order, regardless of status) | inlined in `triggers/onOrderCreated.ts` |
| `order.cancelled` | order transitions to `cancelled` | inlined in `services/cancelOrder.ts` |
| `order.completed` | _not yet emitted_ — payload defined for future use | — |
| `order.refunded` | _not yet emitted_ — payload defined for future use | — |

## Folder structure

```
triggers/      onOrderCreated, onOrderUpdate — dispatchers + inline emits for trivial cases
services/      business logic per operation (multi-step / non-trivial); verb-named
events.ts      event type enum + Zod payload schemas (public)
internal/      module-private impl — classification rules, paths, etc.
```

## Service catalog

| Service | Operation |
|---|---|
| `cancelOrder` | Reverse B2B budget impact + emit `order.cancelled` |
| `refundOrder` | Reverse B2B budget impact (no event emitted today) |
| `completeOrder` | Create delivery note for cash-on-delivery (external) orders |
| `trackOrderPayment` | Track payment completion + notify organization actions |
| `handleOrderDocumentAttached` | Notify organization actions when a deliveryNote/invoice field is attached |

**Note**: `order.placed` does NOT have a service — it's a single `emitEvent` call inlined at each of its two emission points. Wrapping a single emit in a "service" is the anti-pattern we explicitly exclude.

## Internal helpers

_No internal helpers currently._ (`internal/placedTargets.ts` was removed when `order.placed` semantics changed to fire on every order creation.)

## Conventions

- **Triggers dispatch + inline trivial work.** They parse the Firestore event, decide which conditions apply, and either (a) call a service when there's real logic to encapsulate or (b) inline the call directly when it's a single `emitEvent` or trivial.
- **Services are for non-trivial operations** — multiple steps, conditional side effects, or shared by multiple call sites. A "service" that's only an `emitEvent` wrapper does not qualify and must be inlined instead.
- **Services are entry-point-agnostic** — the same `cancelOrder(...)` can be called from a trigger, an API endpoint, or another service.
- **`emitEvent` is always inlined** at its call site. No `emit*.ts` wrappers anywhere.
- **Side-effect errors are caught and logged** at the service level so a single failure doesn't abort the trigger.
