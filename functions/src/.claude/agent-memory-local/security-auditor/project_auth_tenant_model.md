---
name: project-auth-tenant-model
description: How @jsdev-store does Firebase Auth tenant isolation and custom claims — the secure callable pattern and the common gap to check
metadata:
  type: project
---

@jsdev-store uses **Firebase Auth multi-tenancy** (`auth.tenantManager().authForTenant(tenantId)`). Tenant scope (`companyId`/`storeId`) lives in **custom claims**, set ONLY for admin users in `packages/scripts/src/index.ts` via `setCustomUserClaims({ admin: true, tenantId, storeId, companyId })`.

**Customers self-register** (`apps/store/src/lib/firebase/auth.ts`: `createUserWithEmailAndPassword`, `signInAnonymously`) and get **NO custom claims** — their token has `storeId === undefined`, `admin === undefined`.

**Why:** This means any callable that guards tenant access with `if (context.auth.token.storeId && context.auth.token.storeId !== input.storeId)` SHORT-CIRCUITS TO FALSE for customers (and anonymous users) — the check never runs, so a customer can pass an arbitrary tenant in the request body. This is a cross-tenant IDOR.

**How to apply:** The canonical SECURE pattern in this repo is `functions/src/modules/budget/api/budgetApi.ts`: (1) `if (!auth?.token.admin) return Unauthorized`, then (2) derive `companyId`/`storeId` FROM the token, never from client input. When auditing any callable, flag as CRITICAL/HIGH if it: trusts client-supplied `companyId`/`storeId`, omits the `auth.token.admin` check, or uses the truthiness-short-circuit guard. See also [[project-no-firestore-rules]].
