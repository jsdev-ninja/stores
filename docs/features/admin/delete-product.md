# Admin — Delete Product

## Feature

Admin deletes a product. The product doc is removed from Firestore and the
Firestore `onProductDelete` trigger removes it from Algolia search.

> **Flow**: admin delete → product doc removed at
> `{companyId}/{storeId}/products/{sku}` → `onProductDelete` trigger →
> `searchSync.remove(sku)` (Algolia).
> The catalog `deleteProduct` callable is built but **unwired** — not used today.

## Test plan (user workflow)

1. Admin → Products → delete a product.
2. Confirm it disappears from the product list.
3. Confirm it no longer appears in search (Algolia).

## Three surfaces a delete must touch

A product lives in **three** places. A correct delete must clean all three:

| Surface | Path | Who removes it today |
|---|---|---|
| Firestore doc | `{companyId}/{storeId}/products/{sku}` | client `productDelete` (`firestore.remove`) |
| Algolia index | `products` index, objectID = sku | `onProductDelete` trigger → `searchSync.remove(sku)` |
| Storage images | `{companyId}/{storeId}/products/{sku}/{uuid}` | ⚠️ **client `productDelete` removes ONLY `images[0]`** |

## Expected state after — and the gaps

- ✅ Firestore: no doc at `products/{sku}`.
- ✅ Algolia: product removed from index.
- ❌ **Storage: NOT fully cleaned.** `productDelete` only deletes `images[0].url`.
  - Multi-image products → `images[1..n]` are **orphaned** forever.
  - Any delete that doesn't go through the client `productDelete` (bulk, direct
    doc delete, future server path) leaves **all** images orphaned.
  - `onProductDelete` trigger does **not** touch Storage at all.

### Verified orphans on tester_store (2026-05-30)

| sku | Firestore | Algolia | Storage |
|---|---|---|---|
| `123` (live) | exists | indexed | 5 image files (edits also leak old uploads) |
| `1` (deleted) | gone | gone | ⚠️ 1 orphaned image |
| `kll;` | gone | gone | ⚠️ 1 orphaned image |

## Events emitted

_None._

## Subscribers

_None._

## Cloud Functions / triggers fired

| Function | When | Effect |
|---|---|---|
| `onProductDelete` (trigger) | on doc deletion | `searchSync.remove(sku)` (Algolia) — **does not clean Storage** |

## Recommended fix (orphan cleanup)

Move Storage cleanup into the `onProductDelete` trigger (fires on every delete,
regardless of source): delete the entire `products/{sku}/` Storage prefix, not
just `images[0]`. That makes deletion complete and source-agnostic, and lets the
client stop hand-removing `images[0]`.

## Logs to expect (jsdev-stores-prod)

After the staged logging deploy, `onProductDelete` logs:
```
onProductDelete  { productId, companyId, storeId }
onProductDelete: search index removed  { productId }   (or: search sync failed)
```
Before that deploy it logs only `Function execution took … ok` (can't tell which product).
