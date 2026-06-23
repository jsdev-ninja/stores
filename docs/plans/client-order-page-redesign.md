# Client Order Page Redesign — Feature Plan

- **Type:** Feature (frontend-only)
- **Date:** 2026-06-14
- **Project:** @jsdev-store (storebrix.com)
- **Stack:** Vite + React 19, HeroUI v3, Tailwind v4, Firebase, Redux Toolkit
- **Status:** Approved 2026-06-14 — implementation **ON HOLD** pending explicit go-ahead from developer. Deferred decisions resolved to recommended defaults (see Risks & Open Questions).

## Goal

A balasistore customer opening an order at `store.orderPage` (`/orders/:id`) sees a branded RTL
Hebrew "order view" that exactly matches the demo's `renderOrderView`
(`demo/balasi-store-site-2026-06-12/`). They can review the order read-only, copy all items to the
cart as-is, or enter an in-page edit mode to adjust quantities, remove/restore items, and add
products before pushing the adapted list to the cart. **Non-balasistore stores keep the existing
generic page unchanged.**

## Scope

### In scope
- Refactor `pages/store/ClientOrderPage/index.tsx` into a store-switcher (mirror `ProfilePage.tsx`); current body becomes the default fallback (`DefaultClientOrderPage`).
- New `websites/balasistore/ClientOrderPage/` component (view + edit modes) matching the demo's `.ov-*` markup & tokens.
- Hero (order number + inline meta line), item rows w/ product image + unit/price meta, totals box, sticky footer action bar.
- Edit mode: qty −/input/+ controls, remove/restore, add-product search panel, live totals, disabled-send-when-empty.
- "העתק לסל כפי שהוא" → write all available items to a new active cart, then open cart. "העתק והתאם" → in-page edit → "שלח את ההזמנה לסל" writes the adapted list.
- Generalize `appApi.user.createCartFromOrder` to accept an explicit items array + a post-action (open-cart vs navigate-catalog), preserving draft-old-cart + tenant scoping.
- Add a global cart-drawer open signal (Redux `uiSlice`) so the order page can open the balasistore drawer after copying.
- Map `₪`-raw demo prices to `formatter.price` / `Price`; product image in the 42px avatar with emoji fallback.
- Edge cases: unavailable (`missing`/`substituted`) items, no-image products, loading, order-not-found, anonymous user, empty adapt, duplicate add, large carts.

### Out of scope
- The 4-step delivery-status progress tracker (dropped; status shown inline in hero subtitle).
- Any `@jsdev_ninja/core` schema / entity change — read-only UI + client cart writes only.
- Any backend / Cloud Function change.
- Changing the generic default page's visual design (only wrapped in the switcher).
- Substitution display parity with the admin modal (client view shows substituted as "unavailable / excluded"; no replacement row) — see open question.
- Re-pricing / discounts / VAT recompute in edit mode (the "updated total" is a simple line-sum preview, like the demo; authoritative totals come from cart/checkout).
- Add-product search sort/filter beyond name/brand text match.

## User Flow

### View mode (golden path)
1. **User** taps "צפה" on an order in the balasistore personal area (`AccountContent` → `navigate("store.orderPage", { id })`).
2. **System** fetches via `appApi.user.getOrder({ id })`; shows branded loading while pending; "הזמנה לא נמצאה" empty state w/ back action if not found.
3. **System** renders the `ov-card` as a centered full-page card: black gradient hero (`הזמנה BLS-XXXXXXXX` + meta `{date} · {status} · N פריטים · סכום מקורי {price}`), "פירוט פריטים" section, totals box ("סה״כ ההזמנה"), sticky footer (סגור / העתק והתאם / העתק לסל כפי שהוא).
4. **User** taps "סגור" → navigate back to the orders/profile list (`store.profile`).

### Copy-as-is reorder
1. **User** taps "העתק לסל כפי שהוא ←".
2. **System** if anonymous & anon not allowed → opens authModal and stops (existing gate). Otherwise marks current cart draft and creates a new active cart with all **available** order items (excludes `missing`/`substituted`), tenant-scoped.
3. **System** dispatches "open cart drawer" UI action + navigates to `store.catalog`; toast "✓ N פריטים נוספו לסל" (note skipped count if any).

### Copy & adapt
1. **User** taps "העתק והתאם" → component enters `edit` mode; head → "התאם את ההזמנה", rows show −/input/+ + trash, "+ הוסף מוצר נוסף להזמנה" panel appears, footer → בטל עריכה / שלח את ההזמנה לסל.
2. **User** adjusts quantities (min 1), removes items (→ restore button), searches products by name/brand (Algolia, tenant-scoped), taps a result to add (qty 1; if already present, un-remove).
3. **System** live-recomputes "updated total" (sum of active line totals) + active count; "שלח" disabled at 0 active items.
4. **User** taps "שלח את ההזמנה לסל ←".
5. **System** same auth gate, creates a new active cart from the **adapted** list (draft-old-cart preserved), opens cart drawer + navigates to catalog, toast confirms.
6. **User** "בטל עריכה" at any point → resets local edits, returns to view mode (no cart write).

## Data Model Changes

**None.** Read-only order UI plus client-side cart writes reusing the existing `cart` collection and
the existing `TCart` / `TCartItemProduct` shapes. No `@jsdev_ninja/core` change. The only new state is
an in-memory Redux `uiSlice.cartDrawerOpen` flag (client UI state, never persisted).

## Contracts

### `OvItem` — local view-model (`TOrder.cart.items[]` → row)
```ts
// Local component type — NOT a shared/core type. Derived from TCartItemProduct.
type OvItem = {
  pid: string;                 // item.product.id
  product: TProduct;           // kept whole so cart writes reuse the real product
  name: string;                // item.product.name[0]?.value ?? "—"
  imageUrl?: string;           // item.product.images?.[0]?.url (may be absent)
  unitLabel?: string;          // derived from product.weight/volume/priceType
  unitPrice: number;           // item.finalPrice ?? item.originalPrice ?? item.product.price (SHEKELS)
  originalQty: number;         // item.amount (for "בטל עריכה" reset)
  qty: number;                 // editable; min 1
  removed: boolean;            // edit-mode soft remove
  available: boolean;          // false when status === "missing" || "substituted"
};

ovActiveItems(items) = items.filter(it => it.available && !it.removed && it.qty > 0);
ovTotals(items) => { subtotal: Σ unitPrice*qty (active), itemCount: Σ qty (active) }; // SHEKELS
```

### `appApi.user.createCartFromOrder` — generalized (backward-compatible)
```ts
// BEFORE: createCartFromOrder({ order }) → drafts old cart, creates active cart with
//         order.cart.items, navigate("store.catalog")
// AFTER (new fields OPTIONAL, defaults = current behavior):
createCartFromOrder({
  order: TOrder;
  items?: TCartItemProduct[];                      // default: order.cart.items
  afterAction?: "navigateCatalog" | "openCart";    // default: "navigateCatalog"
}): Promise<{ success: boolean }>

// - auth gate unchanged (anonymous → authModal, return)
// - drafts current cart (status:"draft") if present — UNCHANGED
// - new active cart, tenant-scoped via FirebaseAPI.firestore.getPath; items filtered to
//   available only (drop status "missing"/"substituted")
// - "openCart": dispatch ui.setCartDrawerOpen(true) then navigate("store.catalog")
// - "navigateCatalog": navigate only (existing callers unaffected)
// - returns { success } for toast/skip-count
```

### `uiSlice` — additive cart-drawer state
```ts
initialState: { appReady: boolean; cartDrawerOpen: boolean } // cartDrawerOpen default false
reducers: { setAppReady (existing), setCartDrawerOpen(boolean) (new) }
// BalasiCartButton: open = local || global; on close also dispatch setCartDrawerOpen(false)
```

### `unitLabel` helper
```ts
// weight.unit !== "none"  → `${weight.value} ${he(weight.unit)}`  (kg→ק"ג, gram→גרם)
// else volume.unit !== "none" → `${volume.value} ${he(volume.unit)}` (liter→ליטר, ml→מ"ל)
// else priceType.type !== "unit" → he(priceType.type)
// else "" → meta renders just "{price} ליחידה"
```

## Fan-out Dependencies

- **`CartItemProduct.status` (`delivered | missing | substituted`)** — new consumer (this page) must branch on it: `missing`/`substituted` → "לא זמין כעת" (dashed/dimmed, no qty controls), excluded from totals + cart writes. Admin `OrderDetailsModal` is the existing consumer (unchanged; client view is intentionally simpler). No new variant added.
- **Per-store delegation registry** — add a NEW entry only in `ClientOrderPage/index.tsx` keyed by `balasistore_store` AND `tester_store`. Sibling registries already keying both (no change): `ProfilePage.tsx`, `components/renders/ProductRender`, `CartDrawer.tsx`. **Rule: whenever you key `balasistore_store` you MUST also key `tester_store`** (dev preview, port 5175).

## Shared Package Changes

**None.** No `@jsdev_ninja/core` change, no version bump. All work in `apps/store`.

## Tasks (one frontend-coder, ordered)

1. **uiSlice cart-drawer state + wire `BalasiCartButton`** — add `cartDrawerOpen: false` + `setCartDrawerOpen` reducer in `src/domains/ui/index.ts`; make `BalasiCartButton` open when `local || global`, reset global on close. Cross-route "open cart" mechanism.
2. **Generalize `createCartFromOrder`** (`appApi/index.ts` ~2113) — optional `items` + `afterAction`; filter available items; keep draft-old-cart + `getPath` scoping; `openCart` dispatches `setCartDrawerOpen(true)` then navigate; return `{ success }`. Confirm existing callers (`UserOrdersPage`, `AccountContent`) compile unchanged.
3. **Build `websites/balasistore/ClientOrderPage/` — view mode + mapping** — fetch via `getOrder`, map items → `OvItem[]`, render demo structure with Tailwind + balasistore tokens (mirror `OrderDetailsModal`/`AccountContent`); loading/not-found/empty states; status word via `common:orderStatutes.{status}`.
4. **Wire "העתק לסל כפי שהוא"** — `createCartFromOrder({ order, afterAction: "openCart" })`; success toast w/ added/skipped counts. `formatter.price`/`Price` only.
5. **Edit-mode state machine** — local `mode/items/showAdd/addQuery`; handlers enterEdit/exitEdit/changeQty(clamp≥1)/setQty/removeItem/restoreItem; swap head/rows/totals/footer; match `.ov-*` styling.
6. **Add-product search panel (Algolia, tenant-scoped)** — dedicated isolated `<InstantSearch>` + `useSearchBox`/`useHits` typeahead (NOT `ProductsWidget`). **Mandatory filter:** `companyId:${store.companyId} AND storeId:${store.id} AND isPublished:true`. Exclude already-present; add as `OvItem` qty 1; empty state; cap ~30.
7. **Wire "שלח את ההזמנה לסל" (adapted copy)** — build `TCartItemProduct[]` from `ovActiveItems()` (`{ product, amount: qty }`); `createCartFromOrder({ order, items, afterAction: "openCart" })`; disabled when empty; toast.
8. **Refactor `ClientOrderPage/index.tsx` into the store-switcher** — move current body to `DefaultClientOrderPage`; rewrite `index.tsx` mirroring `ProfilePage.tsx` (`Record<TStore["id"]>` keyed by `balasistore_store` + `tester_store` → lazy import, `useStore()`, `<Suspense>`, default fallback). **Do last** so the import target exists.

**Dependencies:** Tasks 1 & 2 first (reorder actions depend on them). Task 8 last (imports new component). Tasks 4 & 7 need 1–2; Task 6 needs 5.

## Backend Tasks

**None.** No Cloud Functions, triggers, or schema changes.

## Test Plan

Mostly presentational — concentrate automated tests on pure logic + the cart API contract; verify visual/flow parts manually on `tester_store` (port 5175).

- **Unit — Order→OvItem mapping & totals:** unitPrice precedence; available flag from status; subtotal/itemCount over active only; exclude removed/unavailable; unitLabel derivation.
- **Unit — edit-mode transitions:** changeQty clamps ≥1; setQty coerces NaN/<1→1; exitEdit resets qty+removed; adding present product un-removes (no dup); adapted list carries real product + amount=qty.
- **Integration — `createCartFromOrder`:** defaults unchanged (existing callers); copies explicit items; drops missing/substituted; drafts prior cart; dispatches `setCartDrawerOpen(true)` on `openCart`; tenant path via `getPath`.
- **Edge cases (manual unless unit-able):** anonymous → authModal, no write; emptied adapt → send disabled; unavailable item row + exclusion; no-image fallback; not-found/loading; **add-search tenant filter present on every query**; large cart scroll; non-balasistore store still renders default page.
- **Out of scope for tests:** pixel parity, Algolia ranking, cart totals/VAT math (owned by checkout), default page body.

## Security Invariants

- **Auth:** keep the existing gate in `createCartFromOrder` (`!isValidUser` return; anonymous → authModal, no write). Order page is a normal authenticated client route.
- **Tenant isolation (HARD RULE):** all cart writes via `FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "cart" })` using active store/order IDs — never hand-built paths/root collections. New cart's company/store/userId from auth context, not client input.
- **Algolia (MANDATORY filter):** every add-product search passes `companyId:${store.companyId} AND storeId:${store.id}` (+ `isPublished:true`). Missing either scope clause leaks cross-tenant products — critical bug.
- **Input validation:** added products come from the tenant-scoped index and flow through the existing cart write; only available order lines may be copied; quantities clamped to integers ≥1.
- **Data boundaries:** only fields already on the client's own order/products; no new PII; no secrets/env changes.

## Breaking Changes

**None.** `createCartFromOrder` extended with optional params only (existing callers behave identically; `void`→`{ success }` is additive); `uiSlice` gains an additive field/reducer; order route is wrapped, not replaced. No core change, no migration.

## Risks & Open Questions

| Sev | Item |
|---|---|
| ✅ Resolved | **"Open cart" cross-route mechanism** — **DECIDED: add the global `cartDrawerOpen` flag** in `uiSlice` (faithful "open drawer" behavior). |
| Medium | **Money units** — Cart/Order/Product values are shekels (decimals); `formatter.price`/`Price` expect shekels. Coder must NOT ÷100. Verify on a real `tester_store` order during QA. |
| Low | **Add-search embedding** — needs its own isolated `<InstantSearch>` typeahead (not `ProductsWidget`). Tenant filter is the load-bearing part. |
| ✅ Resolved | **"סגור" destination** — **DECIDED: navigate to `store.profile`** (not browser-back). |
| ✅ Resolved | **Status label source** — **DECIDED: use `common:orderStatutes.{status}` i18n keys** for the status word + inline Hebrew elsewhere (like AccountContent). |
| ✅ Resolved | **Substituted items** — **DECIDED: treat `substituted` like `missing`** ("לא זמין כעת", excluded, no replacement shown on the customer page). |
