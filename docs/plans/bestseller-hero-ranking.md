# Plan: rank the home "המבחר הפופולרי" hero by actual best-sellers

**Status:** Not started — awaiting developer (Philip) approval.
**Requested by:** David (app owner), 2026-06-03. David authorized it, but it touches `@jsdev_ninja/core` schema + orders backend, which is outside the owner's authority per `CLAUDE.md` — hence this plan for Philip's sign-off.

---

## Current behaviour

The balasistore home hero ("המבחר הפופולרי", 3 cards) and the "🔥 פופולרי השבוע" strip do **not** reflect real sales.

- `apps/store/src/websites/balasistore/HomePage.tsx` → `heroProducts = products.slice(0, 3)`.
- `apps/store/src/websites/balasistore/useHomeProducts.ts:36` queries Algolia index `"products"` with `filters: companyId AND storeId AND isPublished:true`, **no ranking** — order is Algolia default (arbitrary).
- The card tags "פריט נמכר / חדש בקטלוג / המומלץ שלנו" are **static text bound to position**, not data.

So today it's just "the first 3 published products," presented as if popular.

## Goal

Show the 3 (and trending 6) products that have **actually sold the most**, ranked descending by quantity sold.

---

## What sales data exists

- Order entity: `packages/core/lib/entities/Order.ts`; path `{companyId}/{storeId}/orders/{orderId}` (via `FirebaseAPI.firestore.getDocPath("orders")`).
- Each order has `cart.items[]` (`packages/core/lib/entities/Cart.ts`), each item = `{ product, amount, finalPrice, ... }`. **`product.id` + `amount` are all we need to aggregate.**
- Order triggers exist: `onOrderCreated.ts`, `onOrderUpdate.ts`; events `placed | cancelled | refunded` (`functions/src/modules/orders/events.ts`).
- **No existing sales aggregation:** no `soldCount`/`quantitySold` field, no counter trigger, no rollup job anywhere.
- Algolia sync (`functions/src/modules/catalog/internal/searchSync.ts`) forwards **all** product fields via `saveObject` — so any new product field syncs automatically.

---

## Option A — per-product sold counter, incremented on order events (recommended)

1. **Core schema** — add optional `soldQuantityTotal?: number` to `ProductSchema` (`packages/core/lib/entities/Product.ts`). Optional → existing docs/code unaffected.
2. **New subscriber** `functions/src/modules/orders/subscribers/incrementProductSalesOnOrderPlaced.ts` (or react to an order-completed event):
   - For each `order.cart.items[]`: `FieldValue.increment(item.amount)` on `{companyId}/{storeId}/products/{item.product.id}` `soldQuantityTotal`.
   - **Idempotency** per `CLAUDE.md`: deterministic dedupe key `evt_incrementProductSales_{eventId}` so a re-delivered event can't double-count.
3. **Cancellation / refund** — react to `cancelled` / `refunded` and `FieldValue.increment(-amount)` (floor at 0) so counts stay honest.
4. **Algolia** — no code change; `soldQuantityTotal` rides along on the next product save. (Backfill note below.)
5. **Frontend** — `useHomeProducts.ts:36`: add `customRanking: ["desc(soldQuantityTotal)"]` (or sort the hits) so hero/trending take the top sellers. Optionally make the position tags reflect real rank.

### Cost / risk
- **~50–80 LOC across 2 packages** (`@jsdev_ninja/core`, `functions/src/modules`, `apps/store`). No new collections, no new Firestore paths, no breaking change.
- **Real care points:** (a) refund/cancel decrement correctness; (b) idempotency so re-delivered order events don't double-count; (c) **historical backfill** — counters start at 0, so the ranking is empty/biased until enough new orders accrue. A one-off backfill script over existing orders may be wanted (this is the part that smells like a migration → explicit Philip call).

## Option B — scheduled rollup job
A scheduled function aggregates `completed` orders periodically into product counters. Cheaper per-write at high volume, but the ranking lags (hours/day). More moving parts than A for our scale.

## Option C — manual selection (owner-authorizable, no core change)
Owner picks the 3 hero products in admin; store the IDs in store-specific settings. No `@jsdev-core` change, no orders logic. Offered to David as the do-it-today alternative; he chose to wait for the automatic version.

---

## Recommendation
**Option A** for an always-current ranking. Two explicit decisions for Philip:
1. Increment on `placed`, or only on an order-**completed** state? (placed = simpler/livelier; completed = truer "sold").
2. Backfill existing orders once (a migration), or let counters accrue forward from launch?

## Key files
- `apps/store/src/websites/balasistore/useHomeProducts.ts` (ranking)
- `apps/store/src/websites/balasistore/HomePage.tsx` (slices)
- `packages/core/lib/entities/Product.ts` (new `soldQuantityTotal` field)
- `functions/src/modules/orders/events.ts`, `.../triggers/onOrderCreated.ts` (event source)
- `functions/src/modules/orders/subscribers/` (new increment/decrement subscribers)
- `functions/src/modules/catalog/internal/searchSync.ts` (Algolia sync — already field-agnostic)
