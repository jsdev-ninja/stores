# 🎨 Frontend Code Quality Findings

Focus paths:
- `apps/store/src/pages/admin/` (organization CRUD, invoices, inventory, orders)
- `apps/store/src/widgets/`
- `apps/store/src/websites/` (Balasi storefront port, catalog refactor)
- `apps/store/src/components/`

---

## FE-01 🔴 Operator-precedence bug breaks every new row's `rowNumber`

**File:** [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:256`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)

**The issue**

```ts
rowNumber: supplierInvoice.rows?.length || 0 + 1,
```

JS parses this as `(rows?.length) || (0 + 1)` because `+` binds tighter than `||`. Every new row gets a wrong number — when there are no rows yet, the new row gets `1` (correct only by accident); when there are N existing rows, the new row gets `N` instead of `N+1`.

**Fix**

```ts
rowNumber: (supplierInvoice.rows?.length ?? 0) + 1,
```

Wrap the `||`-replaced-with-`??` plus the `+1` in the right grouping.

---

## FE-02 🔴 "Mark as Paid" fires on $0 / NaN with confusing UX

**File:** [`apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx:112-114, 1168-1172`](../../../apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx)

**The issue**

```ts
if (!debtShekels || debtShekels <= 0) return; // silent return — no UI error
// ...
<Button isDisabled={!paidAmount}>  // enabled if "0" or "-5"
```

User can type "0" or "-5" or "abc" and press confirm — the function returns silently, modal stays open, no feedback.

**Fix**

```ts
const debtShekels = parseFloat(paidAmount);
if (!Number.isFinite(debtShekels) || debtShekels <= 0) {
  setMarkPaidError("נא להזין סכום חיובי");
  return;
}
// also: isDisabled={!paidAmount || parseFloat(paidAmount) <= 0}
```

---

## FE-03 🟠 `removeProfile()` is a TODO stub wired to a destructive button

**File:** [`apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx:747-749, 778`](../../../apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx)

**The issue**

```ts
function removeProfile() {
  /* TODO: Implement profile removal logic */
}
```

The "Remove Client" button in `ClientProfileHeader` calls this. User sees the confirm modal, clicks "Remove", spinner runs (or doesn't), nothing happens, modal closes.

**Impact**

Misleading admin UI. If an admin is trying to clean up data and the button does nothing, they might try to delete via the database directly, or call support, or just escalate to dev.

**Fix**

Either:
1. Wire it up (call the backend `deleteProfile` flow — but **note this needs SEC-02 fixed first**, the customers module is currently insecure)
2. Hide the button until the backend exists
3. Disable the button with a tooltip "Coming soon"

---

## FE-04 🟠 Falsy-`0` bug renders literal `0` next to org names

**File:** [`apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx:672-673`](../../../apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx)

**The issue**

```tsx
{org.discountPercentage && ` (${org.discountPercentage}% ...)`}
```

When `discountPercentage === 0`, React renders the literal `0` next to the org name.

**Fix**

```tsx
{org.discountPercentage != null && org.discountPercentage > 0 && (
  <> ({org.discountPercentage}% ...)</>
)}
```

---

## FE-05 🟠 Stale-closure bug in `handleSelectionChange` for organizations list

**File:** [`apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx:575-633`](../../../apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx)

**The issue**

`selectedIds` is derived from `profile.organizationIds` inside the component body. `handleSelectionChange` reads `selectedIds` from closure when computing `added`/`removed`. If the user toggles two orgs quickly, the second toggle sees the pre-first-toggle `selectedIds` (since `profile` hasn't refreshed yet — `onRefresh` is awaited at the end), so removing org A then adding org B can clobber A's removal.

**Fix**

Maintain a local optimistic copy that updates immediately:

```ts
const [optimisticIds, setOptimisticIds] = useState(profile.organizationIds);
useEffect(() => setOptimisticIds(profile.organizationIds), [profile.organizationIds]);

async function handleSelectionChange(newIds: Set<string>) {
  const added = [...newIds].filter(id => !optimisticIds.includes(id));
  const removed = optimisticIds.filter(id => !newIds.has(id));
  setOptimisticIds([...newIds]); // optimistic update
  try {
    await Promise.all([
      ...added.map(id => api.addOrgToClient({ clientId, orgId: id })),
      ...removed.map(id => api.removeOrgFromClient({ clientId, orgId: id })),
    ]);
  } finally {
    onRefresh();
  }
}
```

---

## FE-06 🟠 `useEffect([activeTab])` skips reload after first visit

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:255-260`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

**The issue**

```ts
useEffect(() => {
  if (activeTab === "actions" && actions.length === 0 && !actionsLoading) loadActions();
}, [activeTab]);
```

Two problems:
1. If the first load returns an empty array, `actions.length === 0` stays true → reloading the tab refetches every time the user toggles
2. Once `actions.length > 0`, navigating away and back never refreshes → stale data after creating a new invoice/delivery note in another tab

**Fix**

Track a separate `hasLoadedActions` ref:

```ts
const hasLoadedActions = useRef(false);
useEffect(() => {
  if (activeTab === "actions" && !hasLoadedActions.current && !actionsLoading) {
    hasLoadedActions.current = true;
    loadActions();
  }
}, [activeTab, actionsLoading]);
```

Then invalidate `hasLoadedActions.current = false` whenever an action that affects the list is performed (new invoice, new delivery note).

---

## FE-07 🟠 Stray `console.log("res", res)` in admin org detail

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:155`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

Debug leftover that runs on every load. Logs the budget account API response, which may include PII.

**Fix**

Delete the line.

---

## FE-08 🟠 Inventory `useEffect` deps disabled via eslint comment — fragile pattern

**File:** [`apps/store/src/pages/admin/AdminOrganizationsPage.tsx:737-746`](../../../apps/store/src/pages/admin/AdminOrganizationsPage.tsx) (and many similar)

**The issue**

```ts
const loadOrganizations = useCallback(async () => {
  ...await appApi.admin.listOrganizations();...
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

The disable hides a stale-closure risk if `useAppApi()` ever returns a non-stable reference. Same pattern repeats across many admin pages.

**Fix — Option A (preferred)**

If `useAppApi()` truly returns a stable ref, document it:

```ts
// useAppApi returns a stable reference; safe to omit from deps.
const loadOrganizations = useCallback(async () => { ... }, []);
```

**Fix — Option B**

Include `appApi` in deps and let React's deep-equality memoization handle it.

**Fix — Option C (real fix)**

Migrate admin API calls to React Query / RTK Query / TanStack Query. The codebase doesn't have a query layer — every admin page invents its own fetch pattern with `useState`/`useEffect`. A single source of truth eliminates the stale-closure question entirely.

---

## FE-09 🟠 `useEffect` dependency on object `state` may wipe unsaved form edits

**File:** [`apps/store/src/pages/admin/AdminOrganizationsPage.tsx:127-133, 477-479, 614-616`](../../../apps/store/src/pages/admin/AdminOrganizationsPage.tsx)

**The issue**

```ts
useEffect(() => {
  if (state.kind === "open") { setForm(...); setTab("details"); setSaveError(null); }
}, [state]);
```

`state` is a new object reference each parent render. Currently fine because the parent only changes `state` via explicit setter — but the dependency is fragile.

**Fix**

```ts
useEffect(() => {
  if (state.kind === "open") { setForm(...); setTab("details"); setSaveError(null); }
}, [state.kind, state.org?.id]);
```

Only re-runs when the modal target actually changes.

---

## FE-10 🟡 `Notifications` icon button has no `onPress` — dead control

**File:** [`apps/store/src/pages/admin/AdminLayout/Header.tsx:46`](../../../apps/store/src/pages/admin/AdminLayout/Header.tsx)

**The issue**

```tsx
<Button isIconOnly variant="ghost" size="sm" aria-label="התראות">
  <Icon icon="lucide:bell" ... />
</Button>
```

Visible UI, no behavior.

**Fix**

Either delete the button or wire it up to a notifications drawer.

---

## FE-11 🟡 `useStore()` is captured in async callback — stale VAT setting

**File:** [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:44-45`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)

**The issue**

`isVatIncludedInPrice` is captured at render time and used inside `calculateRowValues`. If `store.isVatIncludedInPrice` toggles mid-flight (during `loadProductBySku`), prices are computed with stale VAT.

**Fix**

Low likelihood, but a `useRef` for the current value avoids the closure trap:

```ts
const vatIncludedRef = useRef(store?.isVatIncludedInPrice ?? false);
useEffect(() => {
  vatIncludedRef.current = store?.isVatIncludedInPrice ?? false;
}, [store?.isVatIncludedInPrice]);

// Inside async paths:
const isVatIncluded = vatIncludedRef.current;
```

---

## FE-12 🟡 `key={index}` for billing-accounts list breaks reorder/delete

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:1181`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

**The issue**

```tsx
{organization.billingAccounts.map((account, index) => (
  <div key={index} className="...">
```

`account.id` exists right there in the type. Index keys cause state mix-ups when an account is deleted from the middle of the list.

**Fix**

```tsx
<div key={account.id} className="...">
```

---

## FE-13 🟡 `crypto.randomUUID()` not available in older Safari/iOS

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:631`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

**The issue**

```ts
const newAccount = { ...billingFormData, id: crypto.randomUUID() };
```

Available in Safari 15.4+/Chrome 92+. Admin tool, low risk, but a fallback is safer.

**Fix**

```ts
import { v4 as uuidv4 } from "uuid"; // already in tree
const newAccount = { ...billingFormData, id: uuidv4() };
```

Or detect:

```ts
const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : uuidv4();
```

---

## FE-14 🟡 Two native `alert()` calls — blocking + Hebrew-only, bypasses i18n

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:625, 660`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

**The issue**

```ts
alert("מספר חשבון חיוב כבר קיים בארגון אחר");
```

Native `alert()` is jarring vs. the rest of the HeroUI-based UX. Also bypasses i18n — string is hard-coded Hebrew.

**Fix**

Replace with HeroUI `Alert` or set `billingFormError` and render in the modal.

---

## FE-15 🟡 Org detail page makes 5 sequential API calls on load

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:149-169, 194-196`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

**The issue**

```ts
useEffect(() => {
  loadOrganization(id); // → awaits loadOrganizationClients, loadOrganizationOrders, loadOrganizationInvoices sequentially
  loadOrganizationGroups();
  FirebaseApi.api.getBudgetAccount(id);
}, [id]);
```

5 sequential calls = 5× network latency stack-up.

**Fix**

```ts
useEffect(() => {
  Promise.all([
    loadOrganizationClients(id),
    loadOrganizationOrders(id),
    loadOrganizationInvoices(id),
  ]);
  loadOrganizationGroups();
  FirebaseApi.api.getBudgetAccount(id);
}, [id]);
```

(With the React Query migration recommendation in FE-08, this becomes trivial — declare 3 queries, they parallelize automatically.)

---

## FE-16 🟡 `isBillingNumberTaken` round-trips entire org list per save

**File:** [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:603-618`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

**The issue**

`isBillingNumberTaken` calls `appApi.admin.listOrganizations()` to validate uniqueness on every billing-account save. For tenants with many orgs this is wasteful.

**Fix**

Either:
- Add a dedicated `appApi.admin.checkBillingNumberAvailable({ number, excludeOrgId })` callable
- Cache the org list in a Redux slice / React Query and reuse it
- Build a server-side uniqueness index and rely on `.create()` failing on collision

---

## FE-17 🟡 Catalog sort `<select>` is non-functional

**File:** [`apps/store/src/websites/balasistore/catalog/CatalogRowHead.tsx:46-57`](../../../apps/store/src/websites/balasistore/catalog/CatalogRowHead.tsx)

**The issue**

User-facing sort dropdown ("price: low to high", etc.) — picking an option doesn't change the displayed products. Silent UX failure.

**Fix**

Either:
1. Hide the control until backend sorting exists
2. Wire it up to the Algolia search params
3. Add a "coming soon" toast on change

---

## FE-18 🟡 Disabled-but-visible filter chips on catalog

**File:** [`apps/store/src/websites/balasistore/catalog/CatalogAside.tsx:97-105, 119-128`](../../../apps/store/src/websites/balasistore/catalog/CatalogAside.tsx)

**The issue**

Diet and brand filter buttons are `disabled` but rendered visually. Mobile users especially will tap and get nothing. 16 fake items take significant scroll real-estate.

**Fix**

Hide entirely behind a feature flag until the data exists. Or render a "Coming soon" badge.

---

## FE-19 🟡 `<WebsiteLogo>` is `<img onClick>` — keyboard-inaccessible navigation

**File:** [`apps/store/src/widgets/WebsiteLogo/index.tsx:8-21`](../../../apps/store/src/widgets/WebsiteLogo/index.tsx)

**The issue**

```tsx
<img src={...} alt="" onClick={() => navigate(...)} />
```

- `<img>` is not a button. Keyboard users can't activate it
- `alt=""` makes it decorative, but it's actually a navigation control

**Fix**

```tsx
<button
  type="button"
  onClick={() => navigate(...)}
  className="focus:outline-none focus-visible:ring-2 ring-accent"
  aria-label={store?.name ?? "Home"}
>
  <img src={...} alt="" /> {/* alt="" OK now — button has the label */}
</button>
```

---

## FE-20 🟡 `useHomeProducts` never sets `loading: false` if store IDs missing

**File:** [`apps/store/src/websites/balasistore/useHomeProducts.ts:26-52`](../../../apps/store/src/websites/balasistore/useHomeProducts.ts)

**The issue**

`loading` defaults to `true` and stays true forever for stores that never resolve `companyId`/`id`. The `cancelled` flag handles in-flight cancellation, but there's no `else { setLoading(false); }`.

**Fix**

```ts
useEffect(() => {
  let cancelled = false;
  if (!store?.companyId || !store?.id) {
    setLoading(false); // ← add this
    return;
  }
  // ... existing logic
  return () => { cancelled = true; };
}, [store?.companyId, store?.id]);
```

---

## FE-21 🟡 `ContextMenu` async `onAction` recreated on every render

**File:** [`apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx:314-352`](../../../apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx)

**The issue**

`onAction` is an async closure inside JSX, recreated each render. react-aria re-attaches the handler on each keystroke → dev console warning + minor perf hit.

**Fix**

```ts
const handleAction = useCallback(async (key: Key) => {
  // ...
}, [/* deps */]);

<Dropdown onAction={handleAction} />
```

---

## FE-22 ⚪ Translation key `as any` / `as never` casts hide missing keys

**Files:**
- [`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx:829, 834, 842, 850`](../../../apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx)
- [`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx:897, 900, 903, 970, ...`](../../../apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx)

12+ `t("...key" as any)` / `as never` casts. Either the keys exist (and the typed `t` should accept them — fix the i18n type imports) or they don't (and you're silently rendering an empty string).

**Fix**

- If using `i18next-resources-to-backend` / similar: regenerate types
- If the keys are missing from the translation JSON: add them
- If the cast is masking a real bug: surface it

---

## FE-23 ⚪ Duplicate cancel-selection bars in AdminInvoicesPage

**File:** [`apps/store/src/pages/admin/AdminInvoicesPage/AdminInvoicesPage.tsx:128-138, 264-274`](../../../apps/store/src/pages/admin/AdminInvoicesPage/AdminInvoicesPage.tsx)

Same "X orders selected — cancel selection" bar at top + bottom. Probably intentional for long tables; on short tables both stack.

**Fix**

Conditionally render bottom bar only when table height > N rows.

---

## FE-24 ⚪ `modal.props as any` with TODO

**File:** [`apps/store/src/widgets/Modals/index.tsx:101`](../../../apps/store/src/widgets/Modals/index.tsx)

```ts
const component = modals[modal.id as keyof typeof modals](modal.props as any); //todo fix any
```

Migrating modal props to a discriminated union by `id` would erase the `any`.

---

## FE-25 ⚪ Stale commented-out v2 props

**Files:**
- [`apps/store/src/pages/store/UserOrdersPage/index.tsx:136-147`](../../../apps/store/src/pages/store/UserOrdersPage/index.tsx) — `variant="solid" color="danger"` (invalid for v3 Button)
- [`apps/store/src/pages/store/ProfilePage/ProfileView.tsx:129-136`](../../../apps/store/src/pages/store/ProfilePage/ProfileView.tsx) — `variant="flat"` (invalid for v3 Chip)

Both inside `/* … */` comment blocks. If uncommented, they would run on v3 components and be silently ignored or fail type check.

**Fix**

Delete the comment blocks (they're dead code).
