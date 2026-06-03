# Plan: rank the home "המבחר הפופולרי" hero by actual best-sellers (Algolia-native)

**Status:** Not started — awaiting developer (Philip) approval.
**Requested by:** David (app owner), 2026-06-03.
**Revision 2 (2026-06-03):** Reworked per Philip's PR review — use Algolia's **built-in** popularity features instead of a hand-rolled sales counter. This removes the `@jsdev_ninja/core` schema change entirely.

---

## Current behaviour

- `apps/store/src/websites/balasistore/HomePage.tsx` → `heroProducts = products.slice(0, 3)`.
- `apps/store/src/websites/balasistore/useHomeProducts.ts:36` queries Algolia index `"products"` with `filters: companyId AND storeId AND isPublished:true`, **no ranking** — arbitrary order, presented as "popular".
- Card tags ("פריט נמכר / חדש בקטלוג / המומלץ שלנו") are **static text bound to position**, not data.

## Goal

Show the products that have **actually sold the most**, using Algolia's native popularity, so we don't maintain our own metric.

---

## How Algolia does this natively (research summary)

Algolia computes "popular / trending" from **conversion events** (e.g. purchases) that we send to the **Insights API**. Two built-in features consume those events — pick one:

### Feature 1 — Algolia Recommend: **Trending Items** model (best fit for a "popular picks" shelf)
- A pre-trained model that returns the **most popular items** across the whole catalog, or **per facet value** (e.g. per category). Exactly the "המבחר הפופולרי" use case.
- Trained & enabled in the **Algolia dashboard** (choose "trending overall" vs "per facet").
- **Data requirement:** ~**250+ conversion events over ≥15 days** (window auto-extends to 30 days; max 3M). Until trained, it returns nothing → we need a fallback (see Cold-start).
- **Frontend:** the storefront already uses a direct Algolia client (not InstantSearch), so the natural fit is the `@algolia/recommend` client method `getTrendingItems({ indexName, maxRecommendations, facetName?, facetValue? })`. (InstantSearch also offers a `<TrendingItems>` widget if we later move to it.)

### Feature 2 — **Dynamic Re-Ranking (DRR)** (re-orders normal search results)
- AI that promotes records becoming popular, applied **on top of the existing search** in `useHomeProducts`. We keep the current query and just enable DRR per-index in the dashboard.
- **Data requirement:** ≥**2 conversions or 20 clicks per record** within a 30-day window to promote that record.
- Simpler to wire on the frontend (no new package — same search call), but it re-ranks *search* results rather than giving a clean "top sellers" list, and the effect is subtler.

**Both require the same prerequisite: we must send conversion (purchase) events to Algolia.** That's the real work.

---

## The real work: send purchase/conversion events (Insights API)

- A **purchase = a "conversion" event**. Conversion events sent **without a `queryID`** can be sent **any time** (the 1h/4-day timing limit only applies to events tied to a search `queryID`). Our purchases happen at checkout, decoupled from search → send them **without** a queryID. Simple and robust.
- **Server-side is supported and is the right place for us:** forward events from the existing order flow. On order placement (`functions/src/modules/orders/triggers/onOrderCreated.ts` / the order-placed path), for each `order.cart.items[]` send a conversion event with `objectIDs = [product.id]`, the store's index name, and a `userToken` (customer id, or an anonymous token). Use the Algolia API client `sendEvents` (Node) / Insights API.
  - Idempotency per `CLAUDE.md`: only emit once per order (dedupe key `evt_algoliaInsights_{eventId}` / `{orderId}`) so re-delivered triggers don't double-count.
- **Optional richer signal:** also send client-side `click`/`add-to-cart` events (with queryID from search) for DRR quality. Not required for the Trending Items MVP.

### What this approach AVOIDS (vs the old hand-rolled plan)
- ❌ No `soldQuantityTotal` field on the Product schema → **no `@jsdev_ninja/core` change** (so this part is no longer owner-blocked for schema reasons).
- ❌ No custom Firestore counter, no increment/decrement-on-refund bookkeeping, no rollup job. Algolia maintains popularity and decay over time.

---

## Cold-start (important, non-technical impact)

Until enough purchase events accumulate (Trending Items: ~250 events / 15 days), Algolia has nothing to rank. We must keep a **fallback**: if `getTrendingItems` returns fewer than 3, fall back to the current `slice(0,3)`. Same idea for DRR (it just no-ops until thresholds are met). So the section never looks broken; it simply "gets smarter" once data flows.

---

## Open decisions for Philip
1. **Which feature** — Recommend **Trending Items** (clean "top sellers" list, paid Recommend add-on, needs a new query path) vs **Dynamic Re-Ranking** (reuses current search, subtler, check it's in our plan)? Recommend Trending Items is the closer match to "המבחר הפופולרי".
2. **Algolia plan** — confirm our Algolia subscription includes the chosen feature (Recommend / DRR are paid add-ons). This is a commercial decision, not just code.
3. **userToken policy** — logged-in customer id vs anonymous token for events (affects Personalization later, and privacy).
4. **Events scope for MVP** — purchases only (server-side) to start, or also client click/add-to-cart now?

## Scope by area (after a feature is chosen)
- `functions/src/modules/orders/...` — new subscriber/emitter to send purchase conversion events to Algolia Insights (server-side). *(backend, needs Philip — but no core schema change.)*
- Algolia dashboard — enable/train Trending Items (or enable DRR). *(config, not code.)*
- `apps/store/src/websites/balasistore/useHomeProducts.ts` + `HomePage.tsx` — fetch via `getTrendingItems` (Recommend) **or** keep search with DRR; add the cold-start fallback. *(store app.)*
- Possibly add the `@algolia/recommend` client dependency (Recommend path only).

## Key files
- `apps/store/src/websites/balasistore/useHomeProducts.ts`, `HomePage.tsx`
- `functions/src/modules/orders/triggers/onOrderCreated.ts`, `functions/src/modules/orders/events.ts`
- `functions/src/modules/catalog/internal/searchSync.ts` (existing Algolia integration / client setup to mirror)

## Sources
- Algolia Recommend overview & Trending Items — https://www.algolia.com/doc/guides/algolia-recommend/overview
- Set up Algolia Recommend — https://www.algolia.com/doc/guides/algolia-recommend/how-to/set-up/
- Dynamic Re-Ranking — https://www.algolia.com/doc/guides/algolia-ai/re-ranking
- Sending events (Insights API, server-side) — https://www.algolia.com/doc/guides/sending-events/getting-started/
