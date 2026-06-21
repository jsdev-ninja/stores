# T10b — Decision needed before build (for Philip)

**Status:** Blocked on developer sign-off. Requested by David (owner). Flagged per CLAUDE.md
(core-schema change → not owner-shippable).

## What David wants
After T10a (#90, merged), checkout already defaults the billing account to the org's **main**
account and lets the customer change it per order. T10b is the next step David asked for:
let a customer set, **once**, which billing account is *always* their default for future orders.

## Why it's blocked
Remembering a per-customer preference means **persisting a new field** in `@jsdev_ninja/core`
→ version bump + redeploy of `apps/store` and `functions`. This is a core-schema change, so it
needs your sign-off and one design decision below before any code is written.

## The one decision: where does the preference live?

Relevant current schema:
- `Profile` (`packages/core/lib/entities/Profile.ts`) — a user carries
  `organizationIds: string[]` (a user can belong to **more than one** org).
- `Organization` (`packages/core/lib/entities/Organization.ts`) — owns
  `billingAccounts: TBillingAccount[]` (`{ id, number, name }`). Accounts are **per-org**.
- There is **no** explicit org-membership entity today — membership is just the
  `organizationIds[]` array on the profile.

### Option A — `Profile.preferredBillingAccountId?: string` (single field)
- Simplest. One optional field on the profile.
- ⚠️ **Breaks for multi-org users:** billing accounts belong to a specific org, so a single
  account id is ambiguous when a user belongs to >1 org (which account, in which org?).
- OK only if we accept "one preferred account per user, last-write-wins" and ignore multi-org.

### Option B — `Profile.preferredBillingAccountByOrg?: Record<orgId, accountId>` (map)  ⭐ recommended
- A map keyed by org id → preferred account id. Correct for multi-org users.
- Still lives entirely on `Profile`, so **no new entity** — smallest correct change.
- Validation/cleanup: an account can be deleted from the org; the preference must fall back to
  "main" gracefully if the stored account id no longer exists.

### Option C — store it on an org-membership link
- Cleanest conceptually, but there is **no membership entity** today (just `organizationIds[]`).
- Would require introducing a membership record → much larger change. Not recommended for now.

## Recommendation
**Option B.** Smallest change that is correct for multi-org users, no new entity, fully
backwards-compatible (optional field; legacy profiles validate unchanged).

## Open sub-questions for you
1. Option A, B, or C?
2. Who can set the default — the **customer** (in their account/profile screen) or **admin only**
   (in the org/customer screen)? David hasn't specified the surface.
3. On placement, precedence: **per-order choice > stored preference > org "main"** — agreed?

## Once you decide
Reply with the option + answers and I can scope the small PRs:
1 core PR (add the optional field + bump version + update both consumers), then 1 store PR
(read preference as the checkout default + a UI to set it).
