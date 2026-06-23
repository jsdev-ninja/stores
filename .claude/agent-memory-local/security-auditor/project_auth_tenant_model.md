---
name: project_auth_tenant_model
description: How admin/tenant authz works for client-side Firestore writes in @jsdev-store store app — custom claims, the isValidAdmin gate, and why it is NOT the real boundary
metadata:
  type: project
---

The store app (`apps/store`) authorizes admin actions client-side via custom claims, NOT callables, for most order/product writes.

- `user.admin` (and tenant context) comes from the Firebase **custom claim**: `Auth.getClaims()` → `auth.currentUser.getIdTokenResult().claims`, merged onto the user object at login (`apps/store/src/lib/firebase/auth.ts` ~L20, L45-51).
- The canonical client gate is `isValidAdmin = !!companyId && !!storeId && !!user?.uid && !!user.admin` (`apps/store/src/appApi/index.ts` ~L78). `companyId`/`storeId` are closure vars derived from the active `store` (Redux state), ultimately the claim/tenant — NOT from any per-call argument.
- Admin order mutations (`cancelOrder`, `approveOrder`, `orderPaid`, `endOrder`, `updateOrder`, etc.) build their Firestore path with `FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "orders" })` using ONLY those closure vars, then pass `order.id` as the doc id. So a caller-supplied `order` object can change WHICH order id in the admin's OWN tenant is targeted, but CANNOT redirect the write to another tenant's path (`order.companyId`/`order.storeId` never reach `getPath`). `getPath` is a pure string join: `${companyId}/${storeId}/${collectionName}/${id}`.

**Why this matters / the real boundary:** `isValidAdmin` is plain client JS — trivially bypassable in a tampered bundle/console. The ONLY real server-side authz for these direct writes is the deployed Firestore ruleset, which is NOT in the repo (see [[project_firestore_rules_deploy]]). When auditing any client-side admin write, the live question is "do the deployed rules enforce admin-claim + tenant-match on this collection?" — the client gate is UX only.

**IDOR gotcha to watch:** guards like `if (!isValidAdmin) return;` short-circuit on falsy tenant context but do NOT re-derive tenant from the argument — good (prevents cross-tenant). But within-tenant, any value the admin can name (order id, client id) is reachable; that's expected for an admin and bounded by the rules' tenant scope. See AR model [[project_ar_organization_balance]] for the callable-based (token-scoped) alternative used by the documents module.

**How to apply:** For a NEW client-side admin write, the security delta is whether it (a) introduces a new collection with no deployed rule, or (b) lets attacker-controlled fields flow into `getPath`. If it only reuses an existing guarded method on an existing collection, it adds no new attack surface beyond the pre-existing rules-posture gap.
