# Client — Add Item to Cart

## Feature

A logged-in client adds a product to their cart. Pure **client-side write** —
`appApi.user.addItemToCart` writes the cart doc directly via `setV2` (merge).
No Cloud Function, no callable, no event bus involved.

> **Flow**: client clicks "Add to cart" → `addItemToCart({ product })`
> → guards (must be a valid user; anonymous → auth modal) → `ProductSchema`
> validate → write cart doc at `{companyId}/{storeId}/cart/{cartId}` via `setV2`.
> Logs `"user add item to cart"` to `uiLogs`; tracks Mixpanel
> `USER_ADD_ITEM_TO_CART`.

## Test plan (user workflow)

1. Log in as a **client** (not admin) on the store (5175).
2. Browse to a product.
3. Click **Add to cart**.
4. Confirm the cart shows the item (amount 1).
5. Add the **same** product again → amount increments to 2 (not a new line).
6. (Optional) Add a **different** product → new line item.

## DB changes

| Path | Operation | Notes |
|---|---|---|
| `{companyId}/{storeId}/cart/{cartId}` | `set` merge (`setV2`) | `items` array updated |

## Expected DB state after

- Cart doc at `{companyId}/{storeId}/cart/{cartId}`:
  - `items: [{ amount, product }]`
  - same product added again → that line's `amount += 1` (no duplicate line)
  - different product → appended as a new `{ amount: 1, product }` entry
- `cartId` is stable for the session (reused; not a new doc per add).

## Events emitted

_None — adding to cart is a direct Firestore write, no event-bus events._

## Subscribers

_None on add._ (The cart module only reacts to `order.placed` via
`onOrderPlacedCloseCart` — that's at checkout, not add-to-cart.)

## Cloud Functions / triggers fired

_None._ No trigger on cart writes; no callable.

## Logs to expect (jsdev-stores-prod)

- `uiLogs`: `"user add item to cart"` (severity INFO) with the active
  `companyId` / `storeId`.
- Invalid product → `uiLogs`: `"add item to cart - invalid product data"` (ERROR).
- Mixpanel `USER_ADD_ITEM_TO_CART` (analytics — not in Cloud Logging).
- ⚠️ No function logs (client-direct write). I verify the action via `uiLogs`;
  the cart doc itself I can't read directly (Firestore read needs ADC re-auth).

## Guards / edge cases worth testing

- **Anonymous user** + anonymous not allowed → **auth modal** opens, no write.
- **Not a valid user** → no-op.
- Invalid product (schema fails) → logged ERROR, no write.
