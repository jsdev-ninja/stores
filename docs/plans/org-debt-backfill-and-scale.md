# Organization "חוב פתוח" — Historical Backfill + Scale Hardening

**Owner:** plan author = Claude (working with David, app owner)
**For review by:** Philip (developer) — contains backend + data-migration work, owner cannot ship alone
**Project:** @jsdev-store (storebrix.com)
**Status:** Draft for review — implementation NOT started
**Related:** `docs/plans/ar-organization-balance.md` (the org-level AR system this builds on), `docs/plans/customer-debts-page-payments.md`

---

## 0. TL;DR

The new **"חוב פתוח"** (open debt) column on the admin Organizations page is now wired to the real org-level AR balance and is live:

- `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` — column reads `getOrganizationBalance().rollup.owed` per org, via a bounded worker pool (6 concurrent, progressive fill). Shipped: PR #116 (wire) + #117 (pool).

**But every company shows ₪0.00.** This is **not a frontend bug** — the AR entry ledger is genuinely empty for historical data. This doc proposes two pieces of work, both needing Philip:

1. **AR historical backfill (primary)** — a one-time, idempotent, per-tenant job that posts the AR entries that the forward-going subscribers never created for pre-existing delivery notes and payments. This is what makes real debt numbers appear.
2. **Scale hardening (secondary)** — server-side pagination + a single batch-balance endpoint + a load test, so the page stays fast with hundreds/thousands of companies.

Part 1 is the urgent one (David is asking "why is it 0?"). Part 2 is the answer to "make sure it holds up with many companies / heavy load".

---

## 1. Root cause of "₪0.00 everywhere"

The org AR balance is an **append-only entry ledger** with an O(1) rollup cache:

- Entry ledger: `{companyId}/{storeId}/organizationBalance` (one immutable doc per accrual/settlement).
- Rollup cache: `{companyId}/{storeId}/organizationBalanceRollup/{organizationId}` — `owed`, `totalAccrued`, `totalSettled`, `credit`.

Entries are **only** written by two forward-going subscribers:

| Subscriber | Trigger | Service | Entry id (idempotency) |
| --- | --- | --- | --- |
| `documents/subscribers/accrueOnDeliveryNoteCreated.ts` | `documents.delivery_note_created` | `accrueDebt` → `+` accrual | `dn_{deliveryNoteId}` |
| `documents/subscribers/settleOnTransactionPosted.ts` | `ledger.transaction_posted` | `settleDebt` → `-` settlement | `settle_{transactionId}` |

`documents/services/reconcileOrganizationBalance.ts` rebuilds the **rollup from the entry ledger** — it does **NOT** create entries from source documents. Its own comment: *"The entry ledger is the SOURCE OF TRUTH. The rollup is a CACHE."*

**Therefore:** delivery notes and payments that happened **before these subscribers went live** were never accrued/settled. The entry ledger has (almost) no historical rows → `owed = 0` for every org. The column is faithfully reporting an empty ledger.

Reconcile **cannot** fix this — it only re-aggregates existing entries (zero in → zero out). We must **create** the missing entries from the source documents.

---

## 2. Part 1 — Historical AR backfill (primary)

### 2.1 Goal

Post the AR entries the subscribers would have posted, for all pre-existing delivery notes (accruals) and payments (settlements), per tenant — **reusing the existing `accrueDebt` / `settleDebt` services unchanged**, so historical and forward-going entries are identical in shape and idempotency.

### 2.2 Why this is safe to run (and re-run)

Both services are **idempotent via deterministic doc ids + `.create()`** (`writeArEntry` treats `ALREADY_EXISTS` as a no-op):

- Accrual id = `dn_{deliveryNoteId}` — same id the live subscriber uses.
- Settlement id = `settle_{transactionId}` — same id the live subscriber uses.

So the backfill:
- **Cannot double-count** — re-running, or running while the live subscribers also fire, collapses to the same entries.
- **Self-heals into the live system** — once an org's history is backfilled, new deliveries/payments continue appending with no gap and no double-accrual.

### 2.3 Proposed implementation

A new **admin-gated, tenant-scoped callable** in the `documents` module, mirroring `reconcileOrganizationBalanceCallable` almost exactly:

- New file: `functions/src/modules/documents/api/backfillOrganizationBalance.ts`
- New service: `functions/src/modules/documents/services/backfillOrganizationBalance.ts`
- Export from `functions/src/modules/documents/index.ts`, wire in `functions/src/index.tsx`.
- Input: `{ apply?: boolean }` (default **false = dry run** — recommend defaulting to dry run here, unlike reconcile, because this WRITES new entries).
- Auth: `admin` claim; `companyId`/`storeId` from the token only (never client input).

**Service algorithm (per tenant):**

1. **Accruals.** Read the same historical set the delivery-notes page reads — orders in `{companyId}/{storeId}/orders` that have a delivery note. For each order with `order.organizationId` present (B2B) and a positive `order.cart.cartTotal`:
   - `deliveryNoteId = order.deliveryNote?.id ?? order.deliveryNote?.number` — **skip if absent** (same rule as the live subscriber; no `orderId` fallback, to preserve idempotency).
   - `amount = Math.round(order.cart.cartTotal * 100)` — **shekels → agorot**, identical to `accrueOnDeliveryNoteCreated.ts` (see money-units caveat §2.5).
   - Call `accrueDebt({ organizationId, amount, deliveryNoteId, deliveryNoteNumber, orderId, billingAccountId, companyId, storeId })`.
2. **Settlements.** Read historical ledger transactions for the tenant. For each tx where `type ∈ {hyp_capture, hyp_direct, manual}`, `direction === "in"`, `reference.type ∈ {order, invoice}`, and `payer.organizationId` present:
   - Call `settleDebt({ organizationId, amount: tx.amount, transactionId: tx.id, billingAccountId, companyId, storeId })`.
   - These guards are copied verbatim from `settleOnTransactionPosted.ts` so backfilled settlements match live ones exactly (notably: `hyp_j5_auth` holds are **excluded** — only `hyp_capture` settles).
3. **Reconcile.** Call `reconcileOrganizationBalance({ companyId, storeId, apply: true })` at the end (belt-and-suspenders; accrue/settle already update rollups incrementally).
4. **Report.** Return counts: orders scanned, accruals posted vs. skipped (already existed / no id / B2C / non-positive total), transactions scanned, settlements posted vs. skipped, and the resulting `owed` per org. On a dry run, write nothing and report what WOULD be posted.

**No schema change, no `@jsdev_ninja/core` bump** — pure reuse of existing services + a new thin callable. (It does require a `firebase deploy --only functions` and is a data-writing migration → Philip's call.)

### 2.4 How to run it

Per tenant, from an admin context (same token model as reconcile): call once with `apply:false` (review the report), then `apply:true`. For balasistore it's a single tenant. The live subscribers keep AR correct from here on.

### 2.5 Decisions / open questions for Philip

- **Q1 — money-units basis (CRITICAL).** The live accrual uses `order.cart.cartTotal` treated as **shekels** (`*100`). Confirm this holds for *legacy* orders too. If some legacy orders store `cartTotal` already in agorot, or store the fulfilled total elsewhere, the backfill amount must branch on legacy vs. new (the codebase already notes "we have legacy data in ILS, every time need to understand what's legacy"). **A wrong basis here writes wrong debt — this is the biggest risk.**
- **Q2 — where do historical PAYMENTS live? (CRITICAL).** Settlement backfill reads the `transactions` ledger. If historical payments were recorded **outside** the ledger (e.g. only on the order/invoice doc, or never digitized), the backfill will accrue debt but not settle it → **overstated debt**. Philip must confirm the payment source-of-truth for legacy data, and whether we also need to derive settlements from `order.paymentStatus === "completed"` / `o.invoice.status === "paid"` for orders with no ledger transaction.
- **Q3 — date window.** All-time, or from a cutoff date (e.g. only the current open period)? Older fully-settled history may not be worth importing if payments aren't digitized (see Q2).
- **Q4 — refunds / credit notes.** Confirm refunds (`direction:"out"`) correctly stay out of AR (they do in the live subscriber) and that credit notes are represented as expected.
- **Q5 — dry-run default + per-tenant rollout.** Recommend `apply` defaults to `false` and we eyeball the report for balasistore before applying. Agree?

---

## 3. Part 2 — Scale hardening for many companies / heavy load

David's ask: the page must stay fast with very many companies and under load. Today's bottlenecks on `AdminOrganizationsPage`:

### 3.1 Server-side pagination of the org list

- `appApi.admin.listOrganizations` (`apps/store/src/appApi/index.ts`) loads **all** orgs in one `listV2` with no paging, and the table renders every row.
- Proposal: page the query (e.g. 50/page, cursor-based) + paginate/virtualize the table. Frontend + a query-shape change.

### 3.2 Single batch-balance endpoint (replaces N per-org calls)

- Today the column calls `getOrganizationBalance` **once per org**. The bounded pool (PR #117) makes this safe to dozens/low-hundreds, but it's still N round-trips.
- Proposal: new admin callable `getOrganizationBalancesBatch` (documents module) that returns all (or one page of) rollups in a **single query** over `{companyId}/{storeId}/organizationBalanceRollup`. The rollups already live in one tenant collection, so this is one `.get()` (or a cursor page) instead of N calls.
- Frontend then fetches balances for the **current page** in one request. Backend change → Philip.

### 3.3 Load test

- Before promising "holds up under heavy load," run a real load test (concurrent admin reads + order/payment write throughput driving the subscribers) and capture Firestore read/write costs and function cold-start behavior. Developer task.

### 3.4 Ordering

Part 1 (backfill) first — it's what makes the feature *correct*. Part 2 can follow; §3.2 (batch endpoint) pairs naturally with §3.1 (paging) in one change.

---

## 4. Files touched (summary)

### Part 1 — backfill (Phase: Philip)
| File | Change |
| --- | --- |
| `functions/src/modules/documents/services/backfillOrganizationBalance.ts` | **NEW** — scans orders + transactions, calls `accrueDebt`/`settleDebt`, then reconcile |
| `functions/src/modules/documents/api/backfillOrganizationBalance.ts` | **NEW** — admin callable, `{apply?}`, dry-run default |
| `functions/src/modules/documents/index.ts` | Export the callable |
| `functions/src/index.tsx` | Wire the callable |

No `packages/core` change. Reuses `accrueDebt`, `settleDebt`, `reconcileOrganizationBalance` unchanged.

### Part 2 — scale (Phase: Philip)
| File | Change |
| --- | --- |
| `functions/src/modules/documents/api/getOrganizationBalancesBatch.ts` | **NEW** — one query over the rollup collection (optionally paged) |
| `apps/store/src/appApi/index.ts` | Page `listOrganizations`; add `getOrganizationBalancesBatch` wrapper |
| `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` | Paginate/virtualize table; fetch balances per page via the batch endpoint |

---

## 5. Security invariants (unchanged from the AR system)

1. Both new callables require the `admin` custom claim.
2. `companyId` / `storeId` come from the **auth token only** — never client input.
3. All Firestore paths via `FirebaseAPI.firestore.getPath({ companyId, storeId, … })`.
4. Money is integer agorot end-to-end; the only shekel→agorot conversion is at the legacy `cart.cartTotal` boundary (§2.5 Q1).
5. Amounts/ids read from stored docs, not from any client-supplied value.
6. Backfill is idempotent (`dn_{id}` / `settle_{txId}`) and safe to re-run alongside the live subscribers.
