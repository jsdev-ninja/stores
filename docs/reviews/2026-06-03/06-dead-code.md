# 🧹 Dead Code Findings

Scanned across 4 surfaces: frontend (`apps/store/src/`), backend (`functions/src/`), shared core (`packages/core/`), and npm deps + root clutter.

**Total removable: ~4,150 LOC across ~60 files, plus ~33 MB of root-folder clutter and a handful of unused npm packages.**

Two surprises hidden in the dead code:
1. **`_secrets` file at repo root contains a live npm publish token** in plaintext — rotate immediately
2. **`getCartCost` accepts a `discounts` parameter that's silently ignored** — three call sites in admin Orders think they're applying store-level discounts, but only per-product discounts run

---

## DC-01 🔴 Live secrets in dead/clutter files

### `_secrets` file with active npm publish token

**File:** [`_secrets`](../../../_secrets) (56 bytes, gitignored but on disk in plaintext)

Contains an active `npm_qJl…` publish token. Even though it's gitignored, it's in plaintext on disk and could be copied into a backup or shared via screenshot.

**Fix**

1. Rotate the npm token via npm dashboard
2. `rm /Users/philbro/workspace/@jsdev-store/_secrets`
3. If automation needs it, store it as a GitHub Actions secret or in 1Password

### Hardcoded demo API key in vendor sample

**File:** [`EZcount.NodeJs.example/clearing-and-invoice/main.js`](../../../EZcount.NodeJs.example/clearing-and-invoice/main.js)

Vendor SDK example with a demo API key committed to git. The real integration lives in `functions/src/services/ezCountService/` — the example folder is unused.

**Fix**

Delete the entire `EZcount.NodeJs.example/` folder.

### Leftover OpenAI key in `.env.jsdev-stores-prod`

**File:** `functions/.env.jsdev-stores-prod` (gitignored)

Contains `OPENAI_API_KEY` but the `openai` npm package is not imported anywhere. The project uses Genkit + `@genkit-ai/google-genai` instead.

**Fix**

Rotate the OpenAI key (it's a live credential), then remove the env var. Audit `.env.*` files for other unused secrets.

---

## DC-02 🐛 Bug surfaced by dead code: `getCartCost` silently ignores `discounts`

**File:** [`packages/core/lib/utils/index.ts:38-59`](../../../packages/core/lib/utils/index.ts)

```ts
export function getCartCost(
  items: TCartItem[],
  discounts: TDiscount[],          // ← parameter
  isVatIncludedInPrice: boolean,
  freeDeliveryPrice?: number,
) {
  // ... product-level discount logic ...
  // import { DiscountEngine } from "..." ← COMMENTED OUT
  // engine.apply(...) ← COMMENTED OUT
  // discounts parameter is never read
}
```

**Callers passing discounts (and silently getting none applied):**
- [`apps/store/src/appApi/index.ts:909`](../../../apps/store/src/appApi/index.ts)
- [`apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx:68`](../../../apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx)
- [`apps/store/src/pages/admin/Orders/AdminOrderPage.tsx:178, 258`](../../../apps/store/src/pages/admin/Orders/AdminOrderPage.tsx) — but this file is itself dead (see DC-03)

**Plus a related dead param:** `calculateDiscount(product, isVatIncludedInPrice)` — the second arg is never read inside the helper.

**Impact**

Cart-level configured store discounts (`bundle`, etc. from the Discount engine) are not being applied. Only per-product `product.discount` fields run. Admins think they configured a 10%-off-cart discount; customers see no change.

**Fix**

Pick one:
1. **Re-enable the DiscountEngine.** Uncomment the engine import + apply call. Run the existing tests under `packages/core/lib/entities/Discount/__tests__/`.
2. **Drop the dead parameter** if cart-level discounts are no longer a product requirement. Remove `discounts` and `freeDeliveryPrice` from the signature; update callers.

---

## DC-03 🟠 Dead legacy admin Orders pages (~1,400 LOC)

These two files are the largest single dead-code chunk in the frontend.

| File | Lines | Replaced by | How dead |
|---|---|---|---|
| [`apps/store/src/pages/admin/Orders/AdminOrderPage.tsx`](../../../apps/store/src/pages/admin/Orders/AdminOrderPage.tsx) | 1099 | `AdminOrderPageNew.tsx` | Only ref is a commented-out import in [`AdminLayout/AdminLayout.tsx:10`](../../../apps/store/src/pages/admin/AdminLayout/AdminLayout.tsx) |
| [`apps/store/src/pages/admin/Orders/AdminOrdersPages.tsx`](../../../apps/store/src/pages/admin/Orders/AdminOrdersPages.tsx) | 330 | `AdminOrdersPage.tsx` | Only ref is a commented-out import in `AdminLayout/AdminLayout.tsx:34` |

**Fix**

Delete both files and the 4 commented-out import lines in `AdminLayout.tsx` (`:10, :34, :95, :99`).

Note: the active replacement file is `AdminOrdersPage.tsx` (singular) but its exported function is *also* called `AdminOrdersPages` (plural). Rename for clarity while cleaning up.

---

## DC-04 🟠 Dead `HomePage/components/` folder (~520 LOC)

The active `pages/store/HomePage/HomePage.tsx` is a registry that lazy-loads per-store implementations from `websites/`. The local `components/` folder was never wired up — all 8 subfolders are orphaned.

**Delete:**

```
apps/store/src/pages/store/HomePage/components/
├── CompleteSolution/index.tsx   (58 lines)
├── ContactForm/index.tsx        (166 lines)
├── Footer/index.tsx             (46 lines)
├── Header/index.tsx             (35 lines)
├── Hero/index.tsx               (62 lines)
├── OrderingOptions/index.tsx    (50 lines)
├── ProductCategories/index.tsx  (61 lines)
└── WhyBlesi/index.tsx           (39 lines)
```

---

## DC-05 🟠 Dead backend platform/integration scaffolding (~700 LOC)

Three whole folders never wired into `functions/src/index.tsx`:

| Folder | Lines | Notes |
|---|---|---|
| [`functions/src/integration/webhooks/`](../../../functions/src/integration/webhooks/) | ~57 | `WebhookSubscriptionSchema` + path helpers. Zero importers. |
| [`functions/src/platform/audit/`](../../../functions/src/platform/audit/) | ~190 | Audit logging API + `record(...)`. Only references are within the folder and its `example.ts`. |
| [`functions/src/platform/db/`](../../../functions/src/platform/db/) | ~140 | `tenantDb`, `TenantCtx` — abstraction never used. |

Plus 3 self-described "reference-only" files:
- [`functions/src/platform/audit/example.ts`](../../../functions/src/platform/audit/example.ts) (98 LOC)
- [`functions/src/platform/db/example.ts`](../../../functions/src/platform/db/example.ts) (81 LOC)
- [`functions/src/platform/eventBus/example.ts`](../../../functions/src/platform/eventBus/example.ts) (129 LOC) — exports `exampleCreateDeliveryNoteOnOrderPlaced` which, if ever wired, would create a duplicate `order.placed` subscriber

**Fix**

Delete all three folders + the three `example.ts` files.

---

## DC-06 🟠 Dead catalog admin chain (~350 LOC)

`functions/src/modules/catalog/index.ts` exports `saveProduct`, `deleteProduct`, `createCategory`, `updateCategories` but `functions/src/index.tsx` only re-exports `createProduct` + the product triggers. The four admin callables are **declared but never deployed**, and the frontend uses direct Firestore writes via `appApi`.

**Delete chain:**

```
functions/src/modules/catalog/
├── api/
│   ├── saveProduct.ts          (40 lines)  ← undeployed
│   ├── deleteProduct.ts        (48 lines)  ← undeployed
│   ├── createCategory.ts       (37 lines)  ← undeployed
│   └── updateCategories.ts     (46 lines)  ← undeployed
├── services/
│   ├── saveProduct.ts          (46 lines)
│   ├── deleteProduct.ts        (24 lines)
│   ├── appendCategory.ts       (56 lines)
│   └── overwriteCategories.ts  (48 lines)
└── internal/
    └── categoriesStore.ts      (59 lines)  ← only callers are dead services
```

Also remove the matching exports in [`functions/src/modules/catalog/index.ts:18-22`](../../../functions/src/modules/catalog/index.ts).

In [`functions/src/modules/catalog/internal/productsStore.ts`](../../../functions/src/modules/catalog/internal/productsStore.ts): keep `createProductDoc` (used live), delete `upsertProductDoc` and `deleteProductDoc` (only used by dead services).

---

## DC-07 🟠 Deployed Cloud Functions with no callers

These are deployed but no frontend code calls them. Decommission with a controlled deploy (remove from `index.tsx`, deploy, then remove source).

| Function | File | Notes |
|---|---|---|
| `markOrderPaid` | [`budget/api/budgetApi.ts:137-164`](../../../functions/src/modules/budget/api/budgetApi.ts) | Explicitly marked "DISABLED" + "DO NOT delete". Schedule removal. |
| `migrateProfilesToMultiOrg` | [`customers/api/migrateProfiles.ts`](../../../functions/src/modules/customers/api/migrateProfiles.ts) (96 LOC) | One-time migration callable. Frontend wrapper exists but no caller. |
| `appInit` | [`application/api/init.ts`](../../../functions/src/modules/application/api/init.ts) (38 LOC) | Has `FirebaseApi.api.init(...)` wrapper but zero invocations. |
| `getMixpanelData` | [`analytics/api/mixpanelData.ts`](../../../functions/src/modules/analytics/api/mixpanelData.ts) (79 LOC) | `pubsub.schedule("every 1 hours")` — but targets hardcoded stores `tester-store`, `opal-market-store` that no longer exist. Also has a committed Mixpanel API token (SEC-01). |

**Note:** `getMixpanelData` runs *every hour* against dead store IDs, generating noise. Stop the schedule first, then delete.

---

## DC-08 🟠 Dead event types

### Emitted but never subscribed

| Event | Emit site | Subscribers |
|---|---|---|
| `payment.received` / `PaymentReceivedPayload` | [`payments/internal/emitPaymentReceived.ts:20`](../../../functions/src/modules/payments/internal/emitPaymentReceived.ts) | None — and `emitPaymentReceived` itself has zero callers (40-LOC file completely dead) |
| `ledger.duplicate_charge_detected` | [`ledger/services/detectDuplicateCharges.ts:50`](../../../functions/src/modules/ledger/services/detectDuplicateCharges.ts) | None — produces noise |
| `documents.delivery_note_created` | [`documents/internal/emitDeliveryNoteCreated.ts:12`](../../../functions/src/modules/documents/internal/emitDeliveryNoteCreated.ts) | None |

### Declared but never emitted

These are in `orders/events.ts` and similar — never used at all:

- `order.completed` / `OrderCompletedPayload`
- `payment.refunded` / `PaymentRefundedPayload`
- `payment.failed` / `PaymentFailedPayload`

**Fix**

Decide per-event: either subscribe (add the missing handler) or delete the event type. Each unused event is a future trap — a developer may see it and assume the integration exists.

Note: the `emit*.ts` wrapper files violate CLAUDE.md anyway (see [SBE-03](03-backend-structure.md#sbe-03)) — deleting them solves two problems.

---

## DC-09 🟡 Dead components, modals, widgets in frontend

### Unused widgets
- [`apps/store/src/widgets/UnPaidPendingOrder/UnPaidPendingOrder.tsx`](../../../apps/store/src/widgets/UnPaidPendingOrder/UnPaidPendingOrder.tsx) (19 LOC) — only referenced via commented-out JSX in `StoreLayout.tsx`
- [`apps/store/src/widgets/SideNavigator/index.tsx`](../../../apps/store/src/widgets/SideNavigator/index.tsx) (9 LOC) — never imported (the string `"SideNavigator"` in AdminProductsPage is an HTML id)
- [`apps/store/src/widgets/Profile/Profile.tsx`](../../../apps/store/src/widgets/Profile/Profile.tsx) (20 LOC) — re-exported but never rendered

### Unused modals (in registry but never opened)
- [`AdminCompanyCreateModal/index.tsx`](../../../apps/store/src/widgets/Modals/modals/AdminCompanyCreateModal/index.tsx) (112 LOC) — registered as `"AdminCompanyCreateModal"`, `modalApi.openModal(...)` never called with that key
- [`DeliveryNoteDetailsModal.tsx`](../../../apps/store/src/widgets/Modals/DeliveryNoteDetailsModal.tsx) (147 LOC) — registered as `"deliveryNoteDetails"`, never opened (project uses `invoiceDetails` / `createDeliveryNote` instead)

Also remove their entries from [`widgets/Modals/index.tsx:24`](../../../apps/store/src/widgets/Modals/index.tsx) and the import lines.

### Unused components
- [`components/CategoryList/CategoryList.tsx`](../../../apps/store/src/components/CategoryList/CategoryList.tsx) (33 LOC)
- [`components/Dropdown/index.tsx`](../../../apps/store/src/components/Dropdown/index.tsx) (39 LOC)
- [`components/List/index.tsx`](../../../apps/store/src/components/List/index.tsx) (13 LOC)
- [`components/select.tsx`](../../../apps/store/src/components/select.tsx) (162 LOC) — lowercase, ShadCN-style; replaced by `components/Select/Select.tsx`
- [`components/Card/index.tsx`](../../../apps/store/src/components/Card/index.tsx) (9 LOC) — only imported by the dead `AdminCompanyCreateModal`; delete with it

### Unused Form compound parts
The `Form` barrel ([`components/Form/index.tsx`](../../../apps/store/src/components/Form/index.tsx)) attaches several methods, but three are never called externally:
- `Form.Locales` — [`components/Form/Locales.tsx`](../../../apps/store/src/components/Form/Locales.tsx) (51 LOC)
- `Form.Field` — [`components/Form/Field.tsx`](../../../apps/store/src/components/Form/Field.tsx) (53 LOC)
- `Form.File` — [`components/Form/FileInput.tsx`](../../../apps/store/src/components/Form/FileInput.tsx) (21 LOC)

Delete the files + corresponding `Form.X = X` assignments in the barrel.

### Tester website orphan
- [`apps/store/src/websites/tester/index.tsx`](../../../apps/store/src/websites/tester/index.tsx) (5 LOC, returns `<div>tester market</div>`) — the `ProductRender` registry maps `tester_store` to the **balasistore** card, not this. Only `tester/thme.css` (note the typo) is loaded via `THEME_CONFIG`.

### Misc dead files
- [`infra/modals/Base.tsx`](../../../apps/store/src/infra/modals/Base.tsx) (6 LOC) — duplicate `ModalsContainer`; not imported
- [`infra/theme/index.tsx`](../../../apps/store/src/infra/theme/index.tsx) (19 LOC) — stub `useTheme` returning empty strings
- [`domains/cart/CartService.ts`](../../../apps/store/src/domains/cart/CartService.ts) (14 LOC) — stubbed, never imported
- [`appApi/apiType.ts`](../../../apps/store/src/appApi/apiType.ts) (5 LOC) — empty `AppApiType` type
- [`features/admin/categoryCreate/index.ts`](../../../apps/store/src/features/admin/categoryCreate/index.ts) (3 LOC) — empty stub function
- [`features/paymnet/PaymentStrategy/index.ts`](../../../apps/store/src/features/paymnet/PaymentStrategy/index.ts) (13 LOC) — empty interface + empty class (also: parent folder is misspelled "paymnet")

---

## DC-10 🟡 Dead exports from `@jsdev_ninja/core` shared package

### Entirely unused exports

| Export | File | Status |
|---|---|---|
| `Chatbot` entity (whole folder) | [`packages/core/lib/entities/Chatbot/`](../../../packages/core/lib/entities/Chatbot/) | Zero references; chatbot has its own local types in `apps/store/src/features/chatbot/context.tsx` |
| `Discount/utils.ts` exports (`formatCurrency`, `formatCurrencyString`, `ensureNonNegative`, `calculatePercentageDiscount`) | [`packages/core/lib/entities/Discount/utils.ts`](../../../packages/core/lib/entities/Discount/utils.ts) | Zero callers; templates have their own local `formatCurrency` |
| `firebase-api/app.ts` | [`packages/core/lib/firebase-api/app.ts`](../../../packages/core/lib/firebase-api/app.ts) | Hardcoded `jsdev-stores-prod` Firebase init; not exported from `lib/index.ts`, never imported |
| `LocaleValueSchema` | [`packages/core/lib/entities/Locale.ts:8`](../../../packages/core/lib/entities/Locale.ts) | Defined, never referenced |
| Legacy Budget schemas (`BudgetTransactionSchema`, `TBudgetTransaction`, `BudgetAccountSchema`, `TBudgetAccount`) | [`packages/core/lib/entities/Budget.ts`](../../../packages/core/lib/entities/Budget.ts) | Replaced by event-driven module; `apps/store` redefines as inline types. Keep `BudgetTransactionTypeSchema`/`PaymentMethodSchema` — those ARE used. |

### Vite scaffolding leftovers
- [`packages/core/src/main.tsx`](../../../packages/core/src/main.tsx) (one line: `export {};`)
- [`packages/core/index.html`](../../../packages/core/index.html) (Vite template)
- [`packages/core/tsconfig.app.json`](../../../packages/core/tsconfig.app.json) — Vite-template leftover
- [`packages/core/tsconfig.node.json`](../../../packages/core/tsconfig.node.json) — same

This package builds a library from `lib/index.ts`. The `src/` + `index.html` are leftover from `npm create vite@latest`.

### Empty directories
- [`packages/core/lib/data/`](../../../packages/core/lib/data/)
- [`packages/core/lib/rule-engine/`](../../../packages/core/lib/rule-engine/)

### Build artifact committed
- [`packages/core/tsconfig.tsbuildinfo`](../../../packages/core/tsconfig.tsbuildinfo) — should be `.gitignore`d. Run `git rm --cached`.

### Unused type aliases (schemas stay; only the `T*` types are dead)

Delete just these named exports (keep the schemas they alias if the schemas are used in compositions):
- `TInvoice`, `TEzInvoice` in [`Invoice.ts`](../../../packages/core/lib/entities/Invoice.ts) — schemas compose into Order; types have zero importers
- `TCalculatedData` in [`DeliveryNote.ts:70`](../../../packages/core/lib/entities/DeliveryNote.ts)
- `TCartItemProduct` in [`Cart.ts:12`](../../../packages/core/lib/entities/Cart.ts)
- `NewSupplierInvoiceSchema`, `TNewSupplierInvoice` in [`SupplierInvoice.ts:49`](../../../packages/core/lib/entities/SupplierInvoice.ts)

---

## DC-11 🟡 Unused npm dependencies

### `apps/store/package.json` — likely safe to remove

| Package | Why dead |
|---|---|
| `@radix-ui/colors` | Zero imports |
| `@radix-ui/themes` | Zero imports |
| `@internationalized/date` | HeroUI v2 DatePicker leftover — v3 dropped it |
| `tailwindcss-animate` | Tailwind v4 uses `@plugin` in CSS, not loaded |
| `@tailwindcss/forms` | Not in postcss config or `@plugin` directives |
| `@babel/preset-env` | Project uses SWC, no babel config |
| `@storybook/addon-styling-webpack` | Vite-based Storybook, never referenced |
| `@storybook/addon-links` | Not in `.storybook/main.ts` |
| `@storybook/blocks` | Not imported anywhere |

### `functions/package.json` — likely safe to remove

| Package | Why dead |
|---|---|
| `@genkit-ai/vertexai` | Only `@genkit-ai/google-genai` is imported |
| `@getbrevo/brevo` | `resend` is the active transport |
| `openai` | Zero imports (Genkit is used) |
| `@types/html-to-text` | Stale stub (no `html-to-text` dep) |
| `@types/prismjs` | Stale stub (no `prismjs` dep) |
| `firebase-functions-test` | Tests use hand-rolled vitest fakes |
| `genkit-cli` | No script invokes it |

### `packages/core/package.json` — likely safe to remove

- `ts-node` — no `.ts-noderc`, no scripts call it

Move `parcel` + `@parcel/transformer-typescript-tsc` from `functions/package.json` into the nested `functions/src/services/documents/dev-preview/package.json` where they're actually used.

---

## DC-12 🟡 Root folder clutter

Estimated savings: **~33 MB**.

| Path | Size | Tracked? | Recommendation |
|---|---|---|---|
| `migration-new-ui/` | 2.1 MB | gitignored | DELETE — HeroUI migration scratch (`balasi-all/` + `balasi-store-export/`), migration done in `1350e4f` |
| `storebrix marketing and campain manager/` | 31 MB | **tracked** | MOVE OUT OF REPO — 30 MB of JPGs/MP4 + marketing brief. Belongs in Notion/Drive |
| `EZcount.NodeJs.example/` | 20 KB | **tracked** | DELETE — vendor sample, real integration is elsewhere (and has a leaked demo key) |
| `Untitled-2024-03-29-1301.excalidraw` | 27 KB | **tracked** | DELETE or rename + move to `docs/` |
| `database-schema.excalidraw` | 33 KB | **tracked** | MOVE to `docs/` |
| `assets/` | 0 B | not tracked | DELETE empty dir |
| `.playwright-mcp/` (9 PNG snapshots slipped past `.gitignore`) | 812 KB | mixed | DELETE the tracked PNGs, fix `.gitignore` |

---

## DC-13 🟡 Git tracking errors (build artifacts committed)

| Path | Why wrong |
|---|---|
| `apps/store/dist/*.{png,jpeg,svg}` (13 files) | `dist/` is in `.gitignore` but these 13 images were committed before the rule. **Identical copies exist in `apps/store/public/`** (verified). |
| `functions/src/services/documents/dist/dev-preview.c234f0d5.js` + `.map` + `index.html` | Parcel build output |
| `functions/ui-debug.log` (80 bytes) | Stale log, tracked |
| `packages/core/tsconfig.tsbuildinfo` | TypeScript incremental build artifact |

**Fix**

```bash
git rm --cached apps/store/dist/*.{png,jpeg,svg}
git rm --cached functions/src/services/documents/dist/*
git rm --cached functions/ui-debug.log
git rm --cached packages/core/tsconfig.tsbuildinfo
# add appropriate gitignore entries
```

---

## DC-14 🟡 Completed plans to archive

These plans are already shipped per the recent commit log. Move to `docs/plans/_archive/`:

| Plan | Shipped in |
|---|---|
| [`docs/plans/budget-implementation.md`](../../plans/budget-implementation.md) | Budget module exists & deployed |
| [`docs/plans/budget-model.md`](../../plans/budget-model.md) | Implementation matches |
| [`docs/plans/heroui-v3-migration.md`](../../plans/heroui-v3-migration.md) | Commit `1350e4f` |
| [`docs/plans/per-store-theme-loading.md`](../../plans/per-store-theme-loading.md) | Commits `f983a79`, `0c2ae44` |
| [`docs/plans/create-product-backend-route.md`](../../plans/create-product-backend-route.md) | `createProduct.ts` exists (note edit/delete still legacy) |

Keep active plans (`order-approve-flow.md`, `budget-cart-edit-sync.md`, `invoice-flow-adaptation.md`).

`docs/SESSION-HANDOFF.md` is stale (references uncommitted state, mentions `markOrderPaid` as disabled) — refresh or archive.

`docs/test-plan` is a 196-byte file outline — convert to directory or merge into `docs/features/`.

---

## DC-15 🟡 Dead config

### `eslint-plugin-boundaries` loaded but all rules commented out

**File:** `functions/.eslintrc.cjs`

`plugins: ["boundaries"]` is loaded, but ALL boundaries rules are commented out (lines 36-55 settings, 69-102 rules, 104-141 overrides). The plugin was disabled in a recent refactor.

**Fix**

Either:
1. **Re-enable** — the modular monolith pattern is in place, the rules would enforce CLAUDE.md compliance
2. **Drop** — remove `plugins: ["boundaries"]` AND `eslint-plugin-boundaries` from devDependencies

### Cursor IDE configs duplicate `CLAUDE.md`

- `.cursorrules` (1.7 KB) — duplicates partial info from CLAUDE.md
- `.cursor/rules/*.mdc` (3 files) — possibly stale relative to current Claude-driven workflow

**Fix**

If Cursor is no longer used: delete. Otherwise: collapse into CLAUDE.md.

---

## DC-16 ⚪ Empty / trivial files

- `apps/store/src/websites/config.ts` (0 bytes)
- `apps/store/src/domains/index.ts` (`export {}`)
- `apps/store/src/shared/index.ts` (`export {}`)
- `apps/store/src/pages/admin/AdminLayout/index.tsx` (1 line; `App.tsx` imports directly, this re-export is unused)
- 10 empty `xxxModule = {} as const` placeholders at the top of each backend `modules/*/index.ts` (except `customersModule.onAuthUserDeleted` which IS used)

---

## DC-17 ⚪ Commented-out code blocks

- `apps/store/src/lib/router/router.tsx:8-18` — 11 lines of TODO list. Move to GitHub issues or delete.
- `apps/store/src/pages/store/StoreLayout.tsx:62-68` — 7 lines of commented JSX rendering the dead `UnPaidPendingOrder`. Delete with the widget.
- `apps/store/src/pages/admin/AdminLayout/AdminLayout.tsx:10, 34, 95, 99` — commented-out imports/JSX for the old Order pages. Delete with the pages.
- `apps/store/src/features/auth/components/AuthLayout.tsx:11-15` — 5 lines of commented title/button/description code.
- `functions/src/modules/documents/api/createInvoice.ts:4, 90-99` — 10 lines for a nonexistent `documentsService.generateAndUploadInvoicePDF`
- `functions/src/services/ezCountService/index.ts:5-9` — 5 lines of commented hardcoded "balasistore" tenant from old code
- `functions/src/modules/payments/api/createPayment.ts:34-36` — unused `store` Firestore load
- `functions/src/modules/payments/api/createPaymentRedirect.ts:45-47` — same pattern

---

## Suggested cleanup order

### Round 1 — Security + lowest-risk (no code behavior changes)
1. Rotate npm token, delete `_secrets`
2. Rotate OpenAI key (or remove if unused)
3. Delete `EZcount.NodeJs.example/` (and the leaked demo key with it)
4. Delete `migration-new-ui/`
5. Move `storebrix marketing and campain manager/` out of repo
6. Run `git rm --cached` for build artifacts (DC-13)
7. Archive completed plans (DC-14)

### Round 2 — Remove dead frontend files (~2,750 LOC)
8. Delete the two big legacy Orders pages (~1,400 LOC)
9. Delete `HomePage/components/` folder (~520 LOC)
10. Delete unused widgets, modals, components (DC-09)
11. Delete dead Form compound parts + clean barrel
12. Delete trivial empty files

### Round 3 — Remove dead backend files (~1,400 LOC)
13. Delete `integration/webhooks/`, `platform/audit/`, `platform/db/` + all `example.ts` files
14. Delete dead catalog admin chain (4 callables + services + helpers)
15. Delete dead event types + emit wrappers
16. Delete empty `xxxModule` placeholders
17. Remove unused `store` loads in payment files

### Round 4 — Decommission deployed-but-unused functions (DC-07)
18. Stop the `getMixpanelData` schedule + delete after rotation
19. Decommission `markOrderPaid`, `migrateProfilesToMultiOrg`, `appInit` (remove from `index.tsx`, deploy, then remove source)

### Round 5 — Shared core cleanup
20. Delete `Chatbot/` entity folder
21. Delete `Discount/utils.ts` + its test file
22. Delete `firebase-api/app.ts`
23. Delete Vite scaffolding (`src/`, `index.html`, scaffolding tsconfigs)
24. Delete empty `data/`, `rule-engine/` dirs
25. Remove dead type aliases (DC-10)
26. Decide on legacy Budget schemas

### Round 6 — Dep cleanup
27. Run `yarn remove` for the 17+ unused deps across workspaces
28. Move `parcel` + `@parcel/transformer-typescript-tsc` to the nested dev-preview package
29. Decide on `eslint-plugin-boundaries` (re-enable or drop)

### Round 7 — Fix `getCartCost` (DC-02)
Either re-enable `DiscountEngine` or drop the dead `discounts` parameter and update 3 call sites.

---

## Estimated impact

- **Total LOC removable: ~4,150** across ~60 files (zero functional impact, assuming verification per round)
- **Repo size reduction: ~33 MB**
- **Unused packages removed: ~17** across 3 workspaces
- **Dead Cloud Functions removed: 4** (after controlled deploy)
- **One real bug fixed:** `getCartCost` discount parameter
- **One credential rotated:** npm publish token

Each round is independently mergeable. Start with Round 1 (zero-risk + security wins) and proceed only as confidence allows.
