# Budget module — target model

> Design doc for the budget module's data model + responsibility. This is the
> **target** (agreed design); the current code differs (see "Current vs target").

## Responsibility

Budget owns **B2B accounts-receivable** — *how much each organization owes the store*.
It is its **own** module (NOT part of the ledger). It is a **reactive accounting
projection** built from two event streams:

```
ORDERS   → debt INCREASE  ┐
                           ├──→  BUDGET  (per-organization debt / AR)
LEDGER   → debt DECREASE  ┘      owns: balance snapshot + debt records
(transaction_posted = money in)
```

- **Ledger** = source of truth for **all money movement** (cash in/out). Independent; does not know budget exists.
- **Budget** = source of truth for **who owes what**. Subscribes to:
  1. **order events** → create a **debt** (org bought on credit)
  2. **`ledger.transaction_posted`** → apply a **payment** (reduce the debt)

Budget owns its data; the ledger is not its store.

## Data model (two collections)

Tenant-scoped under `{companyId}/{storeId}/…` (our convention — `companyId`/`storeId`
are the **tenant/store**, NOT the buyer). The **buyer** is `organizationId`.

> ⚠️ Terminology: the original suggestion's `companyId` ("client business") = our
> **`organizationId`**. Don't reuse `companyId` for the buyer — it's the tenant here.

### 1. `budgetRecords` — flat, append-only history (source of truth)
`{companyId}/{storeId}/budgetRecords/{recordId}`

```ts
interface BudgetRecord {
  recordId: string;
  organizationId: string;        // the B2B buyer org (filter by company)
  customerId: string;            // the employee/user who acted (filter by buyer)
  customerName: string;          // denormalized at write time (audit)
  billingAccountId: string | null; // sub-grouping within org (HQ/branch), if used

  type: "debt_increase" | "debt_reduction";
  amount: number;                // integer AGOROT, always positive
  currency: "ILS";
  relatedId: string;             // orderId (increase) or ledger transactionId (reduction)
  source: "order" | "ledger" | "manual";
  causedByEventId?: string;      // the event that caused this — trace + idempotency

  createdAt: number;             // epoch millis (Date.now())
  // date parts computed in Asia/Jerusalem (NOT raw UTC):
  year: number;                  // 2026
  month: number;                 // 1-12
  yearMonth: string;             // "2026-05" — exact-match filtering (UI dropdowns)

  companyId: string;             // tenant
  storeId: string;               // tenant
}
```
- **Append-only** — never updated. Immutable audit trail.
- Flat + denormalized → cheap equality queries (no nested subcollection, no range traps).

### 2. `organizationBudgets` — balance snapshot (derived projection)
`{companyId}/{storeId}/organizationBudgets/{organizationId}`

```ts
interface OrganizationBudget {
  organizationId: string;        // = doc id
  organizationName: string;
  totalCurrentDebt: number;      // integer agorot (current outstanding)
  totalDebits: number;
  totalCredits: number;
  currency: "ILS";
  updatedAt: number;             // epoch millis
  companyId: string;
  storeId: string;
}
```
- **Derived projection** of `budgetRecords` — a fast cached total, **rebuildable** by
  replaying the records. NEVER an independent source of truth.
- Read this for "how much does org X owe right now?" / order-time credit checks.

## Write flow (per event)

A Firestore transaction keeps the snapshot consistent with the appended record:
1. Read `organizationBudgets/{organizationId}`.
2. Apply delta (`+amount` for debt_increase, `−amount` for debt_reduction).
3. `set` the snapshot (new `totalCurrentDebt`, `updatedAt`).
4. `create` the `budgetRecords` entry (immutable).
- **Idempotency:** dedupe by `causedByEventId` (one `budgetIdempotency/{eventId}` marker per processed event) so an event never double-applies.

## Query patterns

- Org + month: `where(organizationId ==) + where(yearMonth ==) + orderBy(createdAt desc)`
- A specific buyer: `where(customerId ==) + orderBy(createdAt desc)`
- Whole store for a year (admin): `where(year ==) + orderBy(createdAt desc)`
- Current balance: single read of `organizationBudgets/{organizationId}`
(Each multi-field query needs a composite index — fine, created once.)

## Open decisions (settle before building)

1. **Which order event creates the debt?** `order.placed` vs delivery-note issued vs
   invoice issued. (Debt = the real obligation; orders can be cancelled pre-fulfillment.)
2. **Ledger → org mapping:** the ledger `transaction_posted` payload must carry
   `organizationId` (+ `reference.orderId`) so the budget subscriber knows whose debt to reduce.
3. **Reversals:** order cancelled/refunded → a `debt_reduction` (credit-back) record.
4. **Credit limit:** is enforcing an org spend limit budget's job, or out of scope?
5. **billingAccountId** dimension — keep (HQ/branch sub-grouping) or drop?

## Current vs target (gap)

Today the budget module does NOT match this yet:
- Storage is **nested**: `budgetAccounts/{org}` + `budgetAccounts/{org}/budgetTransactions/{id}`
  (subcollection) — harder to query across orgs/by date than the proposed flat `budgetRecords`.
- Debt currently accrues on **delivery-note created** (`handleOrderDocumentAttached →
  budgetWriter.onDeliveryNoteCreated`); payments/credits via `budgetApi`/`organizationActions`.
- It does **not** listen to `ledger.transaction_posted` (ledger is unwired).
- `budgetRollups` schema + read path exist but have **no writer** (unbuilt).
- Timestamps: verify all are millis (no Firestore Timestamp).

→ Migration to this target is a separate plan once the open decisions are settled.
