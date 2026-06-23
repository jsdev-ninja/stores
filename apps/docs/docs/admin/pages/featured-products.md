---
sidebar_position: 2
title: Featured Products (מוצרים נבחרים)
---

# Featured Products — מוצרים נבחרים לעמוד הבית

**Admin UI:** `AdminSettingsPage` → "מוצרים נבחרים לעמוד הבית" card
**File:** `apps/store/src/pages/admin/AdminSettingsPage/index.tsx`
**Storefront hook:** `apps/store/src/websites/balasistore/useFeaturedProducts.ts`
**Storefront wiring:** `apps/store/src/websites/balasistore/HomePage.tsx` (the "מבחר השבוע" strip)

Lets the store owner **hand-pick up to 6 products** (and their order) to show in
the balasistore home page "מבחר השבוע" strip. If nothing is selected the strip
falls back to the first 6 products the home page already loads — so it is never
empty and there is no storefront regression.

:::tip Why this matters
Until a real automated ranking exists (Algolia Trending, see issue #8), the
"מבחר השבוע" strip just showed the catalog's default first-6. This gives the
owner manual control over what gets promoted, with a safe fallback.
:::

## What you see (admin)

```
┌────────────────────────────────────────────────────────────────────┐
│ מוצרים נבחרים לעמוד הבית                                            │
│ בחרו עד 6 מוצרים שיוצגו בקטע "מבחר השבוע"... (אם לא — מבחר אוטומטי)  │
├────────────────────────────────────────────────────────────────────┤
│ נבחרו (n/6)                                                          │
│  ① שם מוצר                          [↑] [↓] [הסר]                   │
│  ② שם מוצר                          [↑] [↓] [הסר]                   │
├────────────────────────────────────────────────────────────────────┤
│ [ חיפוש מוצר לפי שם... ]                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ שם מוצר                                        [הוסף]         │  │
│  │ שם מוצר                                        [הוסף]         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                    [ שמירה ]        │
└────────────────────────────────────────────────────────────────────┘
```

## What it does

| Element | Behavior |
| --- | --- |
| **נבחרו (n/6)** | The chosen products, in display order. Empty → "לא נבחרו מוצרים — מוצג מבחר אוטומטי." |
| **① number badge** | The position the product will appear in on the home strip |
| **↑ / ↓** | Reorder within the selection (`moveFeatured`); disabled at the ends |
| **הסר** | Remove from the selection (`removeFeatured`) |
| **Search box** | Client-side filter over the product's Hebrew label (`productLabel`), case-insensitive |
| **Available list** | Products not already selected, max 30 rows shown |
| **הוסף** | Add to the selection (`addFeatured`); disabled once 6 are chosen |
| **Max-reached note** | At 6 selected: "הגעתם למקסימום 6 מוצרים..." and all הוסף buttons disable |
| **שמירה** | Persists the selection; disabled while unchanged (`featuredUnchanged`) or pending |

`productLabel(product)` resolves the Hebrew name (`name.lang === "he"`), falling
back to the first name entry, then the product id.

## How it works

### Storage

The selection is a single tenant-scoped Firestore doc — **no `@jsdev_ninja/core`
schema change**:

```
{companyId}/{storeId}/settings/homeFeatured
  → { productIds: string[], updatedAt: number }
```

The path is built with `FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "settings" })`.
`settings` already exists in the collection-name union, so nothing in core
changes. `productIds` is capped at 6 on write.

### Admin API

Two admin-gated methods in `apps/store/src/appApi/index.ts`:

```ts
appApi.admin.getFeaturedProducts()
// → { success, data: { productIds, updatedAt } | null }

appApi.admin.updateFeaturedProducts(productIds: string[])
// writes settings/homeFeatured with productIds.slice(0, 6) + updatedAt: Date.now()
```

Both return `{ success: false }` unless `isValidAdmin && companyId && storeId`.

### Storefront read (`useFeaturedProducts`)

`HomePage` calls `useFeaturedProducts(products)` where `products` is the list it
already loaded. The hook:

1. Reads `settings/homeFeatured` for the active store.
2. If there are no `productIds` → returns `fallback.slice(0, 6)` (current behavior).
3. Otherwise fetches each product by id from the tenant `products` collection,
   keeps only ones that **still exist and are `isPublished`**, in the saved order.
4. If none of the curated products survive that filter → falls back again.

```ts
return featured ?? fallback.slice(0, FEATURED_COUNT); // FEATURED_COUNT = 6
```

So an unpublished or deleted curated product simply drops out, and an empty
result never leaves a blank strip.

## Scope & safety

- **Scoped to balasistore** — only the balasistore `HomePage` consumes the hook.
- **No core schema change** — selection lives in the existing `settings` collection.
- **No regression** — every failure path (no selection, read error, all picks
  unpublished) falls back to the previous first-6 behavior.
- **Tenant-isolated** — read and write both go through `getPath({ companyId, storeId, ... })`.

## ⚠️ Needs developer (Philip) before it works live

1. **Firestore security rules** (not in this repo) must allow:
   - **public client read** of `{companyId}/{storeId}/settings/homeFeatured` (the storefront reads it unauthenticated), and
   - **admin write** to the same doc.

   The `settings` collection name exists in the union but was unused until now.
   If the rules don't permit this, the storefront still shows the automatic
   fallback (no breakage), but **saving in admin will fail** until the rule is added.
2. **Deploy** — a publish is needed for the strip to appear on the live site.

## Future direction

This is the manual interim. The intended end state is an automated trending
ranking via **Algolia Trending** (issue #8); when that lands, this curated list
can either feed it or be replaced by it.

## Related

- [Multi-tenant](/architecture/multi-tenant) — why every read/write is scoped to `{companyId}/{storeId}`
- [Database](/architecture/database) — Firestore path conventions and `getPath`
