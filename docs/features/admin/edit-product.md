# Admin — Edit Product

## Tenant (test)

- `companyId` === `tester_company`
- `storeId` === `tester_store`

> Post-test check: I verify the updated doc stays under
> `tester_company/tester_store/products/{sku}` with matching `companyId`/`storeId`.
> Any other tenant value = wrong, I flag it.

## Feature

Admin edits an existing product. **This path was intentionally left unchanged by
the create-product backend-route fix** — edit still writes directly from the
client via `setV2` (merge-upsert), which is correct for an update.

> **Flow**: `EditProductPage` → `appApi.admin.saveProduct` → `productSave`
> (client) → `setV2` = `setDoc(ref, doc, {merge:true})` at
> `{companyId}/{storeId}/products/{sku}` → `onProductUpdate` trigger → Algolia.
> The new `createProduct` callable is NOT involved.

## Test plan (user workflow)

1. Admin → Products → open an existing product (e.g. sku `1`).
2. Change a field (name, price, description, isPublished, etc.).
3. Save.
4. Confirm the change persisted (reopen / product list).
5. Confirm search reflects the change (Algolia).

## DB changes

| Path | Operation | Notes |
|---|---|---|
| `{companyId}/{storeId}/products/{sku}` | `set` merge (`setV2`) | updates changed fields; `updated_at` refreshed |

## Expected DB state after

- Same doc at `{companyId}/{storeId}/products/{sku}` (doc id unchanged):
  - edited fields reflect new values
  - `updated_at` = new epoch millis
  - `id` / `objectID` / tenant unchanged
- If a new image uploaded: old image removed from Storage, new URL in `images`.

## Events emitted

_None — edit emits no event-bus events. Search sync is via Firestore trigger._

## Subscribers

_None._

## Cloud Functions / triggers fired

| Function | When | Effect |
|---|---|---|
| `onProductUpdate` (trigger) | on the merge write | upsert product to Algolia (`searchSync.upsert`) |

## Logs to expect (jsdev-stores-prod)

`onProductUpdate` now logs a structured **diff of what changed** (via microdiff):

```
onProductUpdate  { productId, companyId, storeId, changes: [ ... ] }
```

- `changes` = microdiff array of `{ type, path, oldValue, value }` for every
  field that changed between before → after.
- Post-test check: I read `jsonPayload.changes` and confirm the changed paths +
  new values match exactly what you edited (e.g. you changed `price` 100→120 →
  expect `{ type:"CHANGE", path:["price"], oldValue:100, value:120 }`).
- Tenant: `jsonPayload.companyId` / `storeId` must be `tester_company` /
  `tester_store`.
- `updated_at` will always appear in `changes` (it's refreshed on every save) —
  that's expected, not a real edit.

> Requires the `onProductUpdate` redeploy to take effect. Before that deploy, the
> trigger still logs nothing.

## Known pre-existing risk (not introduced by this fix)

- If the admin changes the **SKU** field while editing, the merge writes to a
  *new* doc id (`products/{newSku}`) and leaves the old doc orphaned. Pre-existing
  behavior; flagged in the create-product plan as a future follow-up (route edit
  through a backend `saveProduct` callable too).
