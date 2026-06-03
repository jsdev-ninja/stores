# ⚛️ HeroUI v3 + React 19 Migration Audit

The migration in commit `1350e4f` went well overall. TypeScript is clean (`tsc --noEmit` passes with 0 errors), no `@nextui-org/*` imports remain, no React 19 anti-patterns detected. The remaining findings are migration-related regressions and HeroUI v3 misuse.

## Clean checks ✅

- TypeScript `tsc --noEmit` — 0 errors
- No `@nextui-org/*` imports
- No `useRef()` without an initial argument (React 19 requirement)
- No `defaultProps` on function components
- No `propTypes`
- No `findDOMNode`
- No string refs
- No legacy context API
- No raw `// @ts-ignore` / `// @ts-nocheck`

---

## UI-01 🔴 Double `actions.dispatch` wraps order action

**File:** [`apps/store/src/app/App.tsx:117-121`](../../../apps/store/src/app/App.tsx)

**The issue**

```tsx
callback: (orders) => {
  actions.dispatch(
    actions.dispatch(actions.orders.setOrders(orders ?? [])), // ← outer dispatch wraps inner
  );
},
```

Redux `dispatch(action)` returns the action; the outer call re-dispatches it. Every order-list subscription update fires `setOrders` twice → re-renders subscribers twice + thrashes Redux DevTools.

**Fix**

```tsx
callback: (orders) => {
  actions.dispatch(actions.orders.setOrders(orders ?? []));
},
```

The adjacent block at line 142 dispatches `setCart` correctly (single-wrapped). The line-118 anomaly is a typo, not a pattern.

---

## UI-02 🟠 NumberField → Input migration broke decimal entry

**Files (pattern repeats 5+ times):**
- [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:626-712`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)
- [`apps/store/src/pages/admin/Orders/AdminOrderPickPage.tsx:537-543, 721-724`](../../../apps/store/src/pages/admin/Orders/AdminOrderPickPage.tsx)
- [`apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx:1114-1120`](../../../apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx)

**The issue**

Pattern:

```tsx
value={row.quantity === 0 ? "" : String(row.quantity)}
onChange={(e) => updateRow(row.id, "quantity", Number(e.target.value) || 0)}
```

Two regressions:

1. **Decimal typing breaks.** User types `"1."`:
   - `Number("1.")` returns `1`
   - Display reverts to `"1"`
   - Cursor jumps
   - User can never finish typing decimals
   
   This affects: `purchasePrice`, `lineDiscount`, `profitPercentage`, `price` — the exact fields users type decimals into.

2. **`|| 0` swallows valid zero typing AND silently maps NaN to 0.** Cleared field becomes `0`. Invalid input becomes `0`. No validation feedback.

**Fix — Option A (preferred): store the string while editing**

The `AdminBudgetPage` already does this at line 447:

```ts
// Local string state per field
const [quantityStr, setQuantityStr] = useState(row.quantity ? String(row.quantity) : "");

// In input:
value={quantityStr}
onChange={(e) => setQuantityStr(e.target.value)}
onBlur={() => {
  const parsed = parseFloat(quantityStr);
  if (Number.isFinite(parsed) && parsed >= 0) {
    updateRow(row.id, "quantity", parsed);
  } else {
    setQuantityStr(row.quantity ? String(row.quantity) : "");
    setError("...");
  }
}}
```

**Fix — Option B: use HeroUI v3 `<NumberField>`**

HeroUI v3 ships a `<NumberField>` component (verified — `mcp__heroui-react__list_components`). It handles locale-aware decimal parsing, intermediate states, min/max, and increment buttons.

```tsx
<NumberField
  value={row.quantity}
  onChange={(v) => updateRow(row.id, "quantity", v)}
  minValue={0}
  step={0.01}
  formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }}
/>
```

This is the *intended* v3 replacement for the v2 NumberField, and the migration just replaced it with raw `<Input>` instead.

---

## UI-03 🟠 Standalone `Badge` used as a status pill — wrong v3 component

**File:** [`apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx:178, 184, 189, 434`](../../../apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx)

**The issue**

HeroUI v3 `Badge` is designed to position relative to another element via `Badge.Anchor`. The official v3 docs explicitly say: *"For standalone label usage, use the Chip component instead."*

These Badges are used as standalone status indicators — they will render visually broken (positioning context missing) or rely on context-less defaults.

**Fix**

```tsx
// Before
<Badge color="warning">{status}</Badge>

// After
<Chip color="warning" variant="soft">{status}</Chip>
```

`Chip` supports `color="warning"|"success"|"accent"` + `variant="soft"|"flat"|"bordered"`.

---

## UI-04 🟠 Inventory Save silently fails on missing supplier / empty rows

**File:** [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:435-445`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)

**The issue**

```ts
if (!supplierInvoice.supplier) {
  // TODO: Show error message
  return;
}
if (!supplierInvoice.rows?.length) {
  // TODO: Show error message
  return;
}
```

Two TODOs left from migration. Save button becomes no-op when invalid. No `disabled` while saving → double-click submits twice.

**Fix**

```ts
const [saveError, setSaveError] = useState<string | null>(null);
const [isSaving, setIsSaving] = useState(false);

async function handleSave() {
  if (!supplierInvoice.supplier) {
    setSaveError("נא לבחור ספק");
    return;
  }
  if (!supplierInvoice.rows?.length) {
    setSaveError("נא להוסיף לפחות שורה אחת");
    return;
  }
  setSaveError(null);
  setIsSaving(true);
  try {
    await saveInventoryCertificate(...);
  } finally {
    setIsSaving(false);
  }
}

// In JSX
<Button onPress={handleSave} isDisabled={isSaving} isLoading={isSaving}>שמירה</Button>
{saveError && <Alert color="danger">{saveError}</Alert>}
```

---

## UI-05 🟡 `Checkbox` missing `Control` + `Indicator` slots in VAT settings

**File:** [`apps/store/src/pages/admin/AdminSettingsPage/index.tsx:193-198`](../../../apps/store/src/pages/admin/AdminSettingsPage/index.tsx)

**The issue**

Other Checkboxes in the codebase use the v3 compound pattern:

```tsx
<Checkbox>
  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
  <Checkbox.Content>...</Checkbox.Content>
</Checkbox>
```

This one only has `<Checkbox.Content>`, so the checkbox visual control (the box itself) won't render. TS doesn't catch this because Checkbox children are loosely typed `ReactNode`.

**Fix**

Add the missing compound slots:

```tsx
<Checkbox isSelected={...} onValueChange={...}>
  <Checkbox.Control>
    <Checkbox.Indicator />
  </Checkbox.Control>
  <Checkbox.Content>VAT included in price</Checkbox.Content>
</Checkbox>
```

---

## UI-06 🟡 Indentation broken in `AdminInvoicesPage` checkbox markup

**File:** [`apps/store/src/pages/admin/AdminInvoicesPage/AdminInvoicesPage.tsx:151-156, 203-208`](../../../apps/store/src/pages/admin/AdminInvoicesPage/AdminInvoicesPage.tsx)

**The issue**

```tsx
<Checkbox.Control>
<Checkbox.Indicator />  // ← unindented
</Checkbox.Control>
<Checkbox.Content>  // ← unindented
  <span className="sr-only">…</span>
</Checkbox.Content>
```

Mechanical search-and-replace artifact from the v2→v3 migration. Doesn't break runtime but signals a sloppy migration touch — Prettier/ESLint should catch this.

**Fix**

Run Prettier on the file. Add a pre-commit hook if not present.

---

## UI-07 🟡 `value: any` parameter on `updateRow`

**File:** [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:227`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)

**The issue**

```ts
function updateRow(id: string, field: keyof InventoryRow, value: any) { ... }
```

Loses type safety on the most critical mutation path (price/quantity edits).

**Fix**

Discriminated union (the verbose-but-safe version):

```ts
type RowUpdate<F extends keyof InventoryRow> = { field: F; value: InventoryRow[F] };

function updateRow<F extends keyof InventoryRow>(
  id: string,
  field: F,
  value: InventoryRow[F],
) { ... }
```

---

## UI-08 ⚪ `forwardRef` usages are now technically redundant

Multiple components still use `forwardRef`. Under React 19, refs pass as props on function components — `forwardRef` is no longer needed.

**Decision**

Not a bug. The wrapped form still works. Worth a sweep in a dedicated cleanup PR when time permits, but **not urgent**.

---

## UI-09 ⚪ Tabs missing `Tabs.ListContainer` slot

**Files:**
- [`apps/store/src/pages/admin/AdminProductsPage.tsx:44-61`](../../../apps/store/src/pages/admin/AdminProductsPage.tsx)
- [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:968-980`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)

The official v3 anatomy includes `Tabs.ListContainer`. Works without (TSC passes), but future style/layout regression is possible.

**Fix**

Add the slot to match the official anatomy. Reference: `mcp__heroui-react__get_component_docs({ component: "tabs" })`.

---

## UI-10 ⚪ Back-button arrow icon hardcoded to `arrow-right` regardless of locale

**File:** [`apps/store/src/pages/store/ProductPage/index.tsx:41-44`](../../../apps/store/src/pages/store/ProductPage/index.tsx)

Correct for Hebrew RTL (default), wrong for any LTR locale. App is i18n-aware (`i18n.dir()` set on body).

**Fix**

```tsx
const isRtl = i18n.dir() === "rtl";
<Icon icon={isRtl ? "lucide:arrow-right" : "lucide:arrow-left"} />
```

---

## UI-11 ⚪ Avatar v2→v3 color mapping inline

**File:** [`apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx:143-148`](../../../apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx)

Inline migration scaffold ("v2 'primary' → 'accent', v2 'secondary' → 'default'") in 2 places. After the migration settles, this should be removed (and any source data should use v3 color names).

**Fix**

Sweep call sites; convert stored color values to v3 vocabulary; drop the mapping helper.

---

## UI-12 ⚪ File misnamed `thme.css` (typo)

**File:** [`apps/store/src/websites/tester/thme.css`](../../../apps/store/src/websites/tester/thme.css)

Referenced from [`apps/store/src/components/renders/ThemeRender/themeConfig.ts:24`](../../../apps/store/src/components/renders/ThemeRender/themeConfig.ts) — import path matches the typo so it works, but the typo will keep showing up in greps and onboarding.

**Fix**

```bash
mv apps/store/src/websites/tester/thme.css apps/store/src/websites/tester/theme.css
# update the one import path
```

---

## What the migration did right

- All form components migrated to v3 patterns
- Modal/Dialog API correctly uses v3 slots in most places
- ChatInput, FileUpload, FileDropzone migrated cleanly
- Catalog vs store navigation registry refactor is clean
- No mass `useRef()` regressions from React 19's stricter requirements
- Type-clean migration (the 0-error TypeScript pass is impressive given the surface)

The remaining issues are concentrated in:
- Two admin inventory/orders pages (NumberField → Input regression)
- One client profile page (Badge misuse)
- Migration artifacts (typos, broken indentation, stray console.log)

A single focused PR can clean up UI-01 through UI-04 and resolve the highest-impact issues.
