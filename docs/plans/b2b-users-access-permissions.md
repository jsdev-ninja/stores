# B2B Users & Access Permissions — admin customer editor

**Status:** SPEC — awaiting developer (Philip) approval. Requested by the owner (David).
**Why this needs sign-off:** changes `@jsdev_ninja/core` entity schemas (`Organization`, `Profile`) and
adds new business logic (per-user access list + role semantics). Owner-restricted per CLAUDE.md.

## What the owner asked for

David wants the admin **customer edit** screen (`AdminUsersPage` modal) to match an HTML mockup
he built (`OneDrive/…/בלסי סטור/admin.js`, `openCustomerModal` / `renderAccessRows`). He explicitly
wants it to **actually work**, not be a visual-only preview.

## The mockup (exact behaviour)

Modal title: `עריכת משתמש — {name}` / `משתמש חדש`. Width 780px. An info banner at top explains the model.

Top fields (2×2 grid):
- `שם מלא` (name) — required
- `תפקיד` (role) — free text, placeholder `לדוגמה: מנהלת משרד`
- `טלפון` (phone)
- `דוא"ל` (email) — required

Then a section `הרשאות גישה` with a `+ הוסף הרשאה` button and a list of access rows. Each row (numbered):
- `חברה` select (company)
- `סניף` select (branch) — options depend on selected company; primary marked ` (ראשי)`
- `חשבון` select (account) — options depend on selected company; shows `{label} ({customerNumber})`
- `תפקיד` select (role): `🛒 מזמין — הזמנות יוצאות ישירות` / `✓ מאשר נוסף (אופציונלי)` / `👁 צופה בלבד`
- `×` to remove the row

Rules from the mockup:
- A user may have many access rows, across multiple companies / branches / accounts.
- Default role = `orderer` (מזמין) → orders go out immediately, no extra approval.
- `approver` (מאשר נוסף) and `viewer` (צופה בלבד) are optional; approver only matters once an
  approvals workflow exists.
- Changing the company in a row resets its branch+account to that company's primary.
- Save requires at least one access row.
- In the customers table, each customer shows role badges + company display + "N הרשאות".

## Gap vs. the real system today

Real `Organization` (core) has `billingAccounts[] {id, number, name}` → maps to the **חשבון** select.
Everything else is missing:

| Mockup concept | Real core today | Needed |
| --- | --- | --- |
| company account (חשבון) | `Organization.billingAccounts[]` | ✅ exists |
| company branch (סניף) | — | NEW `Organization.branches[]` |
| user role text (תפקיד) | — | NEW `Profile.role?` |
| per-user access list | `Profile.organizationIds[]` only | NEW `Profile.accessList[]` |
| orderer/approver/viewer semantics | — | NEW role enum + future approval logic |
| save customer from admin | modal is UI-only (not wired) | NEW persistence path |

## Proposed data-model changes (need approval — core schema)

```ts
// Organization.ts
export const BranchSchema = z.object({ id: z.string(), label: z.string(), isPrimary: z.boolean().optional() });
// add to OrganizationSchema:  branches: z.array(BranchSchema).optional()

// Profile (core) — add:
//   role?: string
//   accessList?: Array<{ organizationId: string; branchId?: string; accountId?: string; role: "orderer" | "approver" | "viewer" }>
```

`billingAccounts` already has `{id, number, name}`; the mockup's "customerNumber" = `number`,
"label" = `name`. No change needed there.

## Suggested phasing (by risk)

1. **Phase 1 — core schema (additive, optional fields).** Add `branches` to Organization, `role` +
   `accessList` to Profile. Bump core, update both consumers. Pure additive, back-compatible.
2. **Phase 2 — admin UI.** Rebuild `AdminUsersPage` modal to the mockup (access rows), wire a real
   save (currently the modal does not persist at all). Branch/account selects driven by the chosen org.
3. **Phase 3 — branches management.** A place to define a company's branches (today only billingAccounts
   are editable). Without this, the סניף select has no data.
4. **Phase 4 (future) — approvals.** Actual `approver`/`viewer` enforcement. Out of scope for the
   first delivery; roles are stored but only `orderer` is enforced (matches mockup default).

## Open questions for Philip

1. OK to add `branches` to `Organization` and `role` + `accessList` to `Profile` in core?
2. Should `accessList` **replace** `organizationIds[]` or live alongside it (with `organizationIds`
   derived from it)? Migration concern for existing clients.
3. Where do branches get created/edited — extend the existing org editor, or a new screen?
4. Is the approvals workflow (approver/viewer enforcement) in scope now or later?

## References
- Mockup: `OneDrive/מסמכים/Claude/Projects/בלסי סטור/admin.js` → `openCustomerModal`, `renderAccessRows`, `saveCustomer`
- Real screen: `apps/store/src/pages/admin/AdminUsersPage/index.tsx`
- Related: `docs/plans/b2b-checkout.md`, `docs/plans/b2b-order-fields.md`
