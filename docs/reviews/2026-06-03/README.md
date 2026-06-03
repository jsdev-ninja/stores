# Code Review — June 2026

Comprehensive review of the @jsdev-store codebase after the major migrations:

- HeroUI v2 → v3 + React 19
- Event-driven budget system
- Ledger module for transactional payment tracking
- Organization CRUD + multi-org client assignment
- Catalog vs Store navigation refactor
- Inventory management refactor (NumberField → Input)
- ezCount + HYP payment integration changes

## Scope

5 review passes were performed in parallel, covering:

1. **Critical security** — auth gating, secret exposure, IDOR, webhook verification
2. **Money correctness** — agorot integrity, idempotency, event-driven race conditions
3. **Backend structure** — compliance with `CLAUDE.md` module rules
4. **Frontend quality** — React anti-patterns, admin pages, accessibility
5. **HeroUI v3 + React 19 migration** — deprecated APIs, migration artifacts

## Reports in this folder

| File | What's in it |
|---|---|
| **[`SECURITY.md`](SECURITY.md)** | **🔒 MASTER SECURITY INDEX** — 22 security findings from across all reports, grouped by attack vector, with phased remediation plan |
| [`01-critical-security.md`](01-critical-security.md) | 🔴 Detailed write-ups of the dedicated security audit (SEC-01 to SEC-14) |
| [`02-money-correctness.md`](02-money-correctness.md) | 🔴 Money loss / corruption (chargeOrder success-on-failure, debt-tracking races, org-name clobber) |
| [`03-backend-structure.md`](03-backend-structure.md) | 🟠 CLAUDE.md violations (cross-module imports, `emit*.ts` wrappers, root collections, console.log usage) |
| [`04-frontend-quality.md`](04-frontend-quality.md) | 🟠 React bugs, stale closures, dead buttons, UX traps |
| [`05-heroui-react19-migration.md`](05-heroui-react19-migration.md) | 🟡 Migration artifacts (NumberField → Input regressions, Badge misuse, double-dispatch typo) |
| [`06-dead-code.md`](06-dead-code.md) | 🧹 Dead files (~4,150 LOC), unused deps, root clutter (~33 MB), tracked build artifacts, leaked npm token in `_secrets` |

**Start here if you only have time for one document:** [`SECURITY.md`](SECURITY.md) — it consolidates every security-relevant finding (auth gaps, credential leaks, IDOR, infrastructure gaps) with a 7-phase remediation plan you can work through top to bottom.

## Summary by severity

| Severity | Count | Examples |
|---|---|---|
| 🔴 Critical | 14 | Leaked Mixpanel API token, leaked npm token in `_secrets`, unauth `createCompanyClient`, HYP credentials in logs, charge-success-on-failure, no firestore.rules |
| 🟠 High | 28 | Missing admin gates, IDOR on org actions, NumberField decimal-entry broken, stub wired to destructive button, legacy Orders pages (~1,400 LOC dead), dead platform scaffolding (~700 LOC) |
| 🟡 Medium | 45 | Hand-built Firestore paths, `console.log` instead of `logger`, missing READMEs, fragile `useEffect` deps, ~17 unused npm deps, dead modals/widgets, completed plans not archived |
| ⚪ Low | 30 | Translation key `as any` casts, stale commented v2 props, redundant `forwardRef`, `thme.css` typo, empty `xxxModule` placeholders, build artifacts committed |

## Dead code at a glance

- **~4,150 LOC** removable across ~60 files (frontend + backend + shared core)
- **~33 MB** of root-folder clutter to remove
- **~17 unused npm packages** across 3 workspaces
- **4 deployed Cloud Functions** with no callers (controlled decommission)
- **1 hidden bug**: `getCartCost` silently ignores its `discounts` parameter (store-level discounts not applied)

## ✅ What's clean

Worth noting — the migration is in good shape in many places:

- TypeScript `tsc --noEmit` **passes with 0 errors**
- No `@nextui-org/*` imports remain (migration boundary is clean)
- No `useRef()` without an initial arg (React 19 requirement met)
- No `defaultProps` / `propTypes` / `findDOMNode` / string refs / legacy context
- No raw `// @ts-ignore` / `// @ts-nocheck`
- HYP callbacks correctly VERIFY signatures before any write
- `paymentLinks` are single-use with transactional consume
- The `ledger/` module is well-structured (proper `.create()` + `ALREADY_EXISTS` idempotency, secrets-aware design) — use it as a reference for fixing other modules
- The `catalog/` module is fully CLAUDE.md compliant — use it as a structural reference

## 🎯 Recommended action order

### Phase 1 — Stop the bleeding (today)

1. **Rotate the Mixpanel API token** (`functions/src/modules/analytics/api/mixpanelData.ts:16`) and remove from source
2. **Rotate npm publish token + delete `_secrets`** file at repo root
3. **Remove `JSON.stringify(storePrivateData)`** log lines (`payments/api/createPaymentRedirect.ts:70`, `appApi/index.ts:140`)
4. **Sanitize HYP `params` + ezCount `params`** before any log call
5. **Add auth gates** to: `createCompanyClient`, `createPayment`, `createPaymentRedirect`, `createInvoice`, `createDeliveryNote`, `uiLogs`
6. **Pull deployed `firestore.rules` into the repo** (`firebase firestore:rules:get`) and commit
7. **Delete `EZcount.NodeJs.example/`** (contains leaked demo API key)

### Phase 2 — Money correctness (this week)

8. Fix `chargeOrder` return value — currently returns `success: true` on HYP failure
9. Fix `organizationName` clobber on every B2B payment
10. Fix `recordHypJ5Auth` trusting client-supplied `payer.organizationId`
11. Fix place/cancel race retry behavior in `reduceDebtOnOrderReversed`
12. Add admin gate to `chargeOrder`
13. Fix `getCartCost` silently ignoring `discounts` parameter (hidden bug, see [DC-02](06-dead-code.md#dc-02))

### Phase 3 — Admin UX (this week)

14. Fix `rowNumber` operator precedence bug in inventory
15. Replace NumberField regressions (decimal entry broken in 4+ places)
16. Wire up or hide `removeProfile()` button
17. Fix "Mark as Paid" silent no-op on invalid input

### Phase 4 — Backend hygiene (next sprint)

18. Replace cross-module `internal/`/`services/` imports with public surface
19. Delete `emit*.ts` wrappers + emit-only services
20. Move root-collection data to tenant-scoped paths
21. Sweep `console.log` → `logger`
22. Split bundled api/subscribers files
23. Add missing `README.md` files to 11 modules

### Phase 5 — Dead code cleanup (next sprint, in 7 rounds — see [`06-dead-code.md`](06-dead-code.md))

24. Round 1: Security + clutter (rotate secrets, delete migration leftovers, archive plans, untrack build artifacts) — ~33 MB
25. Round 2: Frontend dead files (~2,750 LOC) — legacy Orders pages, HomePage components, unused widgets/modals/components
26. Round 3: Backend dead files (~1,400 LOC) — `integration/webhooks/`, `platform/audit/`, `platform/db/`, dead catalog admin chain
27. Round 4: Decommission deployed-but-unused functions (`markOrderPaid`, `migrateProfilesToMultiOrg`, `appInit`, `getMixpanelData`)
28. Round 5: Shared core cleanup — Chatbot entity, Discount/utils, Vite scaffolding
29. Round 6: Dep cleanup — remove ~17 unused npm packages
30. Round 7: Fix `getCartCost` discounts parameter

## How to use these reports

Each report has findings tagged with severity emojis and file:line references. Findings are intended to be turned into individual GitHub issues / Linear tickets. Suggested fixes are included inline.

When tackling a finding:
1. Read the linked file and verify the issue still exists (codebase may have moved)
2. Create a branch named for the fix
3. Apply the suggested fix or your own — the suggestion is a starting point, not a mandate
4. Add a regression test if practical
5. Update the report file with a ✅ next to the finding once landed
