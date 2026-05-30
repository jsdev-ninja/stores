# Admin — Create Product

## Tenant (test)

- `companyId` === `tester_company`
- `storeId` === `tester_store`

> On the post-test check I verify the product doc lives under
> `tester_company/tester_store/...` and that the doc's `companyId`/`storeId`
> fields match. **Any other tenant value = wrong, I flag it.**

## Feature

Admin creates a new product from the admin panel. Image (optional) is uploaded
to Firebase Storage **client-side**, then the resolved product is sent to the
backend `createProduct` callable, which writes it atomically with `ref.create()`.
A Firestore trigger syncs the product to Algolia for search.

> **New flow (this fix)**: `AddProductPage` → `appApi.admin.productCreate`
> → `createProduct` callable (admin-only, tenant from token) → `ref.create()` at
> `{companyId}/{storeId}/products/{sku}` → `onProductCreate` trigger → Algolia.
> Edit still uses the old `saveProduct` → `setV2` merge path (unchanged).

## Test plan (user workflow)

1. Log in as admin on the test store (5175).
2. **Create new SKU** — Add Product → fill fields (new unique sku) → save →
   product appears in list + searchable.
3. **Create duplicate SKU** — Add Product → use a sku that already exists → save
   → rejected with "SKU already in use" (כבר בשימוש), stays on form. The existing
   product must be **unchanged** (not overwritten).
4. **Edit existing product** — EditProductPage → change a field → save → succeeds
   (regression check; edit path untouched).

## DB changes

| Path | Operation | Notes |
|---|---|---|
| `{companyId}/{storeId}/products/{sku}` | `create()` (atomic) — fails if exists | doc id = `sku`, `objectID` = `sku`, `images: []` if none |

## Expected DB state after

**Create new SKU:**
- One product doc at `{companyId}/{storeId}/products/{sku}`:
  - `id` === `sku`, `objectID` === `sku`
  - `images`: `[{ id, url }]` if image uploaded, else `[]`
  - `undefined` fields stripped (`removeUndefinedFields`)
- If image uploaded: file in Storage at `{companyId}/{storeId}/products/{sku}/{uuid}`

**Create duplicate SKU:**
- **No write.** Existing doc byte-identical to before. `createProduct` throws
  `already-exists`.

## Events emitted

_None — create-product does not emit event-bus events. Search sync happens via
Firestore trigger, not the event bus._

## Subscribers

_None._

## Cloud Functions / triggers fired

| Function | When | Effect |
|---|---|---|
| `createProduct` (callable) | every create attempt | atomic write; duplicate sku → `already-exists` |
| `onProductCreate` (trigger) | only on a successful create | upsert product to Algolia (`searchSync.upsert`) |

## Logs to expect (jsdev-stores-prod)

- `createProduct: success` with `{ productId, companyId: tester_company, storeId: tester_store }` on a new sku.
- On duplicate: callable throws `already-exists` (no `createProduct: success` log, no `onProductCreate` firing).
- `onProductCreate` invocation only for successful creates.
