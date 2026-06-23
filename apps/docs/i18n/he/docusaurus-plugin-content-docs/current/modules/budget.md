---
sidebar_position: 3
title: Budget
---

# Budget Module

`functions/src/modules/budget`

**Cash revenue reporting only.** As of the `ar-organization-balance` refactor,
this module is responsible for one thing: projecting **revenue rollups** from
real money movement. All accounts-receivable / debt logic has **moved out** to
the [Documents module](./documents.md) (`organizationBalance`).

:::caution What changed
This module used to own B2B debt (`organizationBudgets`, `orgBalances`,
`budgetRecords`). That is **gone** — debt now lives in `documents`
(`organizationBalance`). The legacy collections are **inert** (no longer
written) but not deleted, and the debt subscribers were removed:
`increaseDebtOnOrderPlaced`, `reduceDebtOnOrderReversed`,
`reduceDebtOnTransactionPosted`, plus `applyBudgetEvent` and `budgetStore`.

The admin read callables (`getBudgetAccount`, `listBudgetAccounts`, …) are
**stubbed and return empty** — kept only so deployed function names stay stable
until the admin UI is repointed to the documents AR endpoints
(`getOrganizationBalance`). See the documents
[migration status](./documents.md).
:::

:::info Money & time conventions
Amounts are integer **agorot**; revenue counts only `direction: "in"`
transactions. `yearMonth` keys use **Asia/Jerusalem**. Timestamps are epoch
**millis**.
:::

## Collection

| Collection        | Path                                                   | Purpose |
| ----------------- | ------------------------------------------------------ | ------- |
| `revenueRollups`  | `{companyId}/{storeId}/revenueRollups/{yearMonth}`     | Per-month cash totals. A projection — rebuildable by reconcile. |

`yearMonth` doc id is e.g. `2026-06`. Fields: `totalIn`, `totalOut`, `net`,
`byMethod` (per payment type, e.g. `hyp_capture`, `manual`), `byOrg` (per
`organizationId`; `"b2c"` bucket for orderless / non-org cash), `currency`,
`updatedAt`, `companyId`, `storeId`.

## Flow

```
ledger.postTransaction → emit ledger.transaction_posted
    → updateProjectionsOnTransactionPosted (subscriber)
        → applyLedgerProjection (service)  → revenueRollups/{yearMonth}
```

- Reacts to `ledger.transaction_posted`. Only `direction: "in"` (received) and
  `direction: "out"` (refund) cash transactions affect revenue.
- Idempotent via `projectionIdempotency/{eventId}` markers.
- **Does not touch AR / org debt** — that is the documents module's job.

## Reconcile

`reconcileProjections` recomputes `revenueRollups` from the ledger
`transactions` collection (cash only) and self-heals drift. Exposed as:

| Endpoint                          | Type        | Auth        | Purpose |
| --------------------------------- | ----------- | ----------- | ------- |
| `reconcileBudgetProjections`      | `onCall`    | admin claim | Manual revenue reconcile (dry-run / apply). |
| `reconcileProjectionsSchedule`    | scheduled   | system      | Nightly revenue reconcile. |
| `updateProjectionsOnTransactionPosted` | subscriber | internal | Revenue rollup on each posted transaction. |
| `getBudgetAccount` / `listBudgetAccounts` / … | `onCall` | admin claim | **Stubbed** — return empty pending the AR UI repoint. |
