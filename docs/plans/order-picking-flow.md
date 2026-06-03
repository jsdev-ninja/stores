# Plan: order picking flow (per-line fulfillment)

**Status:** Planned — not implemented.
**Goal:** When picking an order, the admin marks each line **delivered / missing / substituted** (with a replacement product + qty for substitutions). The order total becomes the **fulfilled total** (missing excluded, substitutions repriced), so the later charge / delivery note reflect what was *actually* delivered — matching the balasi-all demo (`openPickerMode` / `pickerSetStatus` / `pickerSavePicking`).

---

## Demo behavior (target) — TWO screens, one shared model

**Shared per-item model** (both screens write it):
- `status` ∈ `delivered` (default) | `missing` (not supplied → **₪0**) | `substituted` (replaced — carries `substitutedWith`).
- `substitutedWith` = `{ product/pid, qty, price, ... }` (defaults to the original qty).
- **Fulfilled total** = `Σ items where status≠missing` (substituted → `substitutedWith.price × qty`, else `price × qty`).

### Screen A — Picking (`openPickerMode` / `renderPickerMode`) — warehouse, FULLSCREEN
- Big touch cards; per card 3 buttons: **✓ נלקט / ❌ חסר במלאי / 🔄 החלף בדומה** (substitute only if `substitutionPref === "allow"`).
- Substitute → product dropdown + qty input.
- Progress bar (handled/total) + stats, substitution-pref banner, **"סמן הכל כנלקט"** (mark all delivered), sticky save.
- Save (`pickerSavePicking`) → writes items + recomputes fulfilled total. **Status only — no qty/add/remove.**

### Screen B — Edit order (`editOrderModal` / `renderEditOrderItems`) — office admin, MODAL
- Form: company (locked), **billing account** select, **notes**.
- Per item row: **qty +/− steppers**, **status dropdown** (זמין / חסר–הסר / חסר–החלף), substitute picker + qty, **remove 🗑**, live line total.
- **+ הוסף פריט** (add item), live order total, web "customer account choice" banner + reset.
- Save (`saveEditedOrder`) → writes items (qty/add/remove + status/substitution) + total. **Full composition editing PLUS status.**

**Relationship:** Picking = touch-friendly *status marking only*. Edit-order = full *composition* (qty/add/remove/account/notes) **plus** status. Same `status`/`substitutedWith` fields, same fulfilled-total math. Your app already has an `AdminOrderPickPage` (qty editing) closer to Screen B's editing; neither does fulfillment status yet.

## Current state
- `AdminOrderPickPage.tsx` exists but only does **qty edit / add / remove**, recomputing `cartTotal` via `getCartCost`. No fulfillment status.
- **`CartItemProductSchema` has NO `status` / `substitutedWith`** (`packages/core/lib/entities/Cart.ts`). This is the core gap.
- Approve/charge/DN already use `order.cart.cartTotal` — so if picking writes the fulfilled total into `cartTotal`, the downstream charge & delivery note are automatically correct.

---

## Changes

### 1. Core schema (`@jsdev_ninja/core` — `Cart.ts`) — additive, backward-compatible
Add to `CartItemProductSchema`:
```ts
status: z.enum(["delivered", "missing", "substituted"]).optional(),   // default = delivered
substitutedWith: z
  .object({ product: ProductSchema, amount: z.number().positive(), price: z.number() })
  .nullable()
  .optional(),
```
Optional → existing orders/items stay valid (treated as `delivered`).

### 2. Picker UI
Extend `AdminOrderPickPage.tsx` (it already lists items + qty controls). Per line add:
- a 3-way control: **✓ נמסר** (delivered) · **❌ חסר** (missing) · **🔄 הוחלף** (substituted)
- when `substituted`: a product picker (reuse the existing add-product search in this page) + qty for the replacement
- missing/substituted lines render struck-through, matching the demo styling (and the popup's per-line states we already built but couldn't populate)

### 3. Save → fulfilled total
On save, write `cart.items` (with `status`/`substitutedWith`) and set `cart.cartTotal` (+ vat/discount via `getCartCost`) to the **fulfilled** total: exclude `missing`, use `substitutedWith` price×qty for `substituted`. Reuse `getCartCost` by mapping items first.

### 4. Downstream (free, once cartTotal is fulfilled)
- **Approve → charge (j5):** captures the fulfilled `cartTotal`. ✓
- **Approve → delivery note (external):** DN built from `cart.items` reflects delivered/substituted lines, missing excluded. ✓
- **Budget:** debt was added at `order.placed` on the *original* total — if picking changes the total, debt is now stale (the **cart-edit-budget-sync** gap, already documented in `docs/plans/budget-cart-edit-sync.md`). Picking is exactly that scenario → resolve together, or accept the known gap for now.

### 5. Popup
The `OrderDetailsModal` already has placeholders for per-line missing/substituted + a fulfillment summary (built earlier, currently dormant). Once items carry `status`, wire those sections on.

---

## Phasing
- **Phase 1 (recommended first):** `delivered` / `missing` only — schema (status), picker toggle, fulfilled total (exclude missing), popup states. No product-substitution picker yet. Smaller, delivers most of the value.
- **Phase 2:** `substituted` — replacement-product picker + qty + repricing.

## Open decisions
1. **Extend `AdminOrderPickPage`** (recommended — already has the item list + add-product search) vs a new fullscreen picker like the demo's tablet view?
2. **Phase 1 only (delivered/missing) first**, or build substitution too?
3. **Budget sync on pick:** resolve the stale-debt issue now (per `budget-cart-edit-sync.md`) or defer?
4. **Core schema change OK?** (additive/optional, backward-compatible — but it's `@jsdev_ninja/core`, so needs the build + all consumers green.)

## Key files
- `packages/core/lib/entities/Cart.ts` — `CartItemProductSchema` (+ status/substitutedWith)
- `apps/store/src/pages/admin/Orders/AdminOrderPickPage.tsx` — picker UI + save
- `apps/store/src/widgets/Modals/OrderDetailsModal.tsx` — wire per-line states
- demo ref: `migration-new-ui/balasi-all/admin.js` (`pickerSetStatus`, `pickerSetSubstitution`, `pickerSavePicking`)
- `docs/plans/budget-cart-edit-sync.md` — the related debt-sync gap
