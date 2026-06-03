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
| [`01-critical-security.md`](01-critical-security.md) | 🔴 Exploitable security holes (unauthenticated endpoints, leaked credentials, no `firestore.rules` in repo) |
| [`02-money-correctness.md`](02-money-correctness.md) | 🔴 Money loss / corruption (chargeOrder success-on-failure, debt-tracking races, org-name clobber) |
| [`03-backend-structure.md`](03-backend-structure.md) | 🟠 CLAUDE.md violations (cross-module imports, `emit*.ts` wrappers, root collections, console.log usage) |
| [`04-frontend-quality.md`](04-frontend-quality.md) | 🟠 React bugs, stale closures, dead buttons, UX traps |
| [`05-heroui-react19-migration.md`](05-heroui-react19-migration.md) | 🟡 Migration artifacts (NumberField → Input regressions, Badge misuse, double-dispatch typo) |

## Summary by severity

| Severity | Count | Examples |
|---|---|---|
| 🔴 Critical | 13 | Leaked Mixpanel API token, unauth `createCompanyClient`, HYP credentials in logs, charge-success-on-failure, no firestore.rules |
| 🟠 High | 22 | Missing admin gates, IDOR on org actions, NumberField decimal-entry broken, stub wired to destructive button |
| 🟡 Medium | 35 | Hand-built Firestore paths, `console.log` instead of `logger`, missing READMEs, fragile `useEffect` deps |
| ⚪ Low | 25 | Translation key `as any` casts, stale commented v2 props, redundant `forwardRef`, `thme.css` typo |

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
2. **Remove `JSON.stringify(storePrivateData)`** log lines (`payments/api/createPaymentRedirect.ts:70`, `appApi/index.ts:140`)
3. **Sanitize HYP `params` + ezCount `params`** before any log call
4. **Add auth gates** to: `createCompanyClient`, `createPayment`, `createPaymentRedirect`, `createInvoice`, `createDeliveryNote`, `uiLogs`
5. **Pull deployed `firestore.rules` into the repo** (`firebase firestore:rules:get`) and commit

### Phase 2 — Money correctness (this week)

6. Fix `chargeOrder` return value — currently returns `success: true` on HYP failure
7. Fix `organizationName` clobber on every B2B payment
8. Fix `recordHypJ5Auth` trusting client-supplied `payer.organizationId`
9. Fix place/cancel race retry behavior in `reduceDebtOnOrderReversed`
10. Add admin gate to `chargeOrder`

### Phase 3 — Admin UX (this week)

11. Fix `rowNumber` operator precedence bug in inventory
12. Replace NumberField regressions (decimal entry broken in 4+ places)
13. Wire up or hide `removeProfile()` button
14. Fix "Mark as Paid" silent no-op on invalid input

### Phase 4 — Backend hygiene (next sprint)

15. Replace cross-module `internal/`/`services/` imports with public surface
16. Delete `emit*.ts` wrappers + emit-only services
17. Move root-collection data to tenant-scoped paths
18. Sweep `console.log` → `logger`
19. Split bundled api/subscribers files
20. Add missing `README.md` files to 11 modules

## How to use these reports

Each report has findings tagged with severity emojis and file:line references. Findings are intended to be turned into individual GitHub issues / Linear tickets. Suggested fixes are included inline.

When tackling a finding:
1. Read the linked file and verify the issue still exists (codebase may have moved)
2. Create a branch named for the fix
3. Apply the suggested fix or your own — the suggestion is a starting point, not a mandate
4. Add a regression test if practical
5. Update the report file with a ✅ next to the finding once landed
