# catalog module

Owns all server-side reads and writes for `products` and `categories`.

## Firestore paths

| Data | Path |
|---|---|
| Products collection | `{companyId}/{storeId}/products/` |
| Single product doc | `{companyId}/{storeId}/products/{sku}` |
| Categories (single doc) | `{companyId}/{storeId}/categories/categories` |

Categories are stored as a single document (`id: "categories"`) with a `categories: TCategory[]` array field. Create appends one entry; updateCategories overwrites the entire array.

## Admin write endpoints (callable, admin-only)

All 4 endpoints require `auth.token.admin === true`. `companyId` and `storeId` are always derived from the token claims — any client-supplied tenant fields in the payload are overridden.

| Function | Description |
|---|---|
| `saveProduct` | Validate + **upsert** a product (`set` with `{ merge: true }`, doc id = sku). Matches the client's `setV2` behavior 1:1 — used for both create and edit. |
| `deleteProduct` | Delete a product by id. Rejects `NOT_FOUND` if it doesn't exist. |
| `createCategory` | Append a category to the array (inside a Firestore transaction — concurrent-append safe). Rejects `ALREADY_EXISTS` if id duplicates. |
| `updateCategories` | Overwrite the entire category array. |

These are exported from `catalog/index.ts` but are NOT wired in the root `functions/src/index.tsx`. Client migration is a separate step.

## Search sync

Search sync to Algolia happens via the existing Firestore triggers (`triggers/product.ts`):
- `onProductCreate` → upsert to Algolia
- `onProductUpdate` → upsert to Algolia
- `onProductDelete` → remove from Algolia

The new write endpoints trigger these automatically on every product write. **Do not duplicate search logic in the api or service layer.**

## Image handling

Image upload and removal from Firebase Storage is performed **client-side only**. These endpoints receive the product with image URLs already resolved. This matches the existing client-side flow where the client uploads to Storage and then calls the write endpoint with the resulting URL(s).

## Module structure

```
catalog/
├── README.md
├── index.ts              public surface — exports callables + triggers
├── api/                  thin callable handlers (auth check → delegate to service)
│   ├── saveProduct.ts
│   ├── deleteProduct.ts
│   ├── createCategory.ts
│   └── updateCategories.ts
├── services/             business logic
│   ├── saveProduct.ts    validate + upsert product
│   ├── deleteProduct.ts  delete product with existence check
│   ├── appendCategory.ts validate + append one category (no-duplicate check)
│   └── overwriteCategories.ts  validate + overwrite categories array
├── triggers/             Firestore triggers (search sync)
│   └── product.ts
└── internal/             module-private — do NOT import from outside this module
    ├── paths.ts
    ├── productsStore.ts
    ├── categoriesStore.ts
    └── searchSync.ts
```
