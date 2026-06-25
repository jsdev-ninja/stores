---
name: project-superadmin-security-model
description: How the super-admin (god-mode cross-tenant) module enforces auth and where its one real exposure is
metadata:
  type: project
---

`functions/src/modules/superAdmin/` is a god-mode, cross-tenant module: every callable takes explicit `companyId`+`storeId` and can read/write any tenant.

Safety model (verified sound at the function layer):
- `internal/verifySuperAdmin.ts` checks `auth.token.superAdmin === true` exclusively (no fallback to `admin`/store membership). It is the FIRST statement in all 13 deployed callables (reads + writes), before any input parse. This is the entire basis of AC-7 — a non-superAdmin token reads/writes nothing through these endpoints.
- All tenant access goes through `internal/paths.ts` (`FirebaseAPI.firestore.getPath`). Only root accesses are `saListStores` (STORES) and `SUPER_ADMIN_AUDIT` — both intended.
- Curated writes (E2 visibility, E3 stock) write a single named field via `merge:true`; there is no "write arbitrary object" endpoint. E1 (order status) is correctly deferred (see [[project-onorderupdate-side-effects]]).
- Audit append is best-effort after the field write, deterministic id + `.create()` for idempotency.

The ONE real exposure: the audit log lives in root `SUPER_ADMIN_AUDIT`, and the design assumes Firestore rules deny all client access to it. They do not — see [[project-no-rules-file-in-repo]]. Under the open prod rules the audit log (actorEmail PII + what-changed-where) is world-read/write and tamperable, and the branch ships no rules to fix it. That gap is the gating item, not the function code.
