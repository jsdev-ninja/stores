# Plan: Accounts-Receivable as `organizationBalance` (owned by the `documents` module)

**Status:** DRAFT for review (Philip). No code yet. This plan REVERSES `budget-redesign.md` §9.1.
**Type:** Refactor + data-model change (architectural).
**Date:** 2026-06-14
**Author:** software-architect

---

## 1. Problem statement + the §9.1 reversal

`budget-redesign.md` §9.1 resolved B2B debt as a **unified ledger**: a single `transactions`
collection holds both real cash (`hyp_*`, `manual`) and accounts-receivable accruals
(`delivery_note`, `invoice`, `credit_note`, `adjustment`) distinguished by
`kind: credit|debit` and `direction: "none"` for accruals.

`money-core.md` later argued the opposite philosophy and is the one we now adopt: **the money
core must not know what a delivery note, invoice, order, or product is.** A document-based
"transaction" is not a transfer of money — it is a billing record. Mixing the two means:

- The money ledger's invariants ("append-only facts of real money movement") are diluted by
  rows where `direction: "none"` and no money ever moved.
- Revenue/cash reporting (`revenueRollups`) and accounts-receivable (`orgBalances`) are
  computed from the same collection, forcing every reader and every reconcile pass to
  re-derive "is this row cash or debt?" from `kind`/`direction`.
- The `documents` module — which actually owns the concept of "a delivery note creates debt"
  — has to fire an event into the `ledger` module so the ledger can write a debt row back into
  its own money collection. The dependency points the wrong way.

**THE DECISION (firm, reverses §9.1):**

1. **The money ledger (`transactions`) becomes pure cash only.** It records `manual`,
   `hyp_direct`, `hyp_j5_auth`, `hyp_capture` with `direction: in|out`. The concepts
   `delivery_note`, `invoice`, `credit_note`, `adjustment`, `kind: debit`, and
   `direction: "none"` are **removed** from the ledger module.
2. **A new tenant-scoped append-only ledger `organizationBalance`** holds accounts-receivable.
   It is **owned and maintained by the `documents` module** (`functions/src/modules/documents/`),
   because AR is driven by delivery notes and invoices.
3. **Debt accrues on delivery-note creation** (documents emits the event; documents itself
   subscribes and writes the AR entry — no round-trip through the ledger).
4. **Debt is reduced by real money in.** The `documents` module SUBSCRIBES to the money
   ledger's public `ledger.transaction_posted` event (org-scoped, `direction: "in"`) and
   writes a settling AR entry. This is the one allowed cross-module dependency:
   `documents → ledger` (feature depends on money; money never depends on documents).
5. **`revenueRollups` STAYS in the budget module** — it is real-money cash reporting derived
   from `transactions` (in/out), not debt. Only the AR/debt half moves out.

Dependency direction after this change (matches `money-core.md`'s "one law"):

```
   documents (AR feature)            budget (revenue reporting)
        │ subscribes to                    │ subscribes to
        ▼ ledger.transaction_posted        ▼ ledger.transaction_posted
   ┌──────────────────────────────────────────────────────────┐
   │  ledger / money core: pure cash facts (in/out), zero deps  │
   └──────────────────────────────────────────────────────────┘
```

---

## 2. Data model: `organizationBalance`

### 2.1 Decision — append-only ENTRY LEDGER + per-org ROLLUP doc

We keep **both**:

- **`organizationBalance` (entry ledger)** — one immutable doc per AR event (accrual or
  settlement). This is the source of truth, easily queryable by date range and by org, and
  rebuildable.
- **`organizationBalanceRollup` (per-org balance doc)** — one doc per organization holding
  the derived `owed`/`totalDebits`/`totalCredits` for O(1) reads.

**Justification for keeping the rollup doc:** the admin AR list ("show every org and how much
each owes") must not fan out to "sum the whole entry ledger per org" on every page load — that
is O(entries) per org and grows unbounded. The rollup gives O(orgs) reads. The rollup is a
**cache**: it is always reconstructable from the entry ledger by the nightly reconcile job, so
a missed/duplicated event self-heals. The entry ledger remains authoritative; the rollup never
is. This mirrors the existing `orgBalances` (rollup) + `transactions` (entries) relationship,
just relocated and made debt-only.

### 2.2 Firestore paths (tenant-scoped)

| Collection                          | Path                                                          | Doc id |
| ----------------------------------- | ------------------------------------------------------------ | ------ |
| `organizationBalance` (entries)     | `{companyId}/{storeId}/organizationBalance/{entryId}`        | deterministic dedup id (see §6) |
| `organizationBalanceRollup` (rollup)| `{companyId}/{storeId}/organizationBalanceRollup/{organizationId}` | organizationId |

Both built via `FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName, id })`.
**Both collection names must be registered in `packages/core` `storeCollections`** (see §5).

### 2.3 Entry schema (`OrganizationBalanceEntry`)

| Field           | Type                                  | Notes |
| --------------- | ------------------------------------- | ----- |
| `id`            | `string`                              | = deterministic doc id (dedup key) |
| `organizationId`| `string`                              | the org whose AR this affects |
| `sign`          | `"+" \| "-"`                          | `+` increases owed (accrual), `-` decreases (settlement) |
| `kind`          | `"accrual" \| "settlement" \| "adjustment"` | semantic source. accrual = DN; settlement = money-in; adjustment = manual |
| `amount`        | `number` (int agorot, positive)       | always positive; `sign` carries direction |
| `currency`      | `"ILS"`                               | literal |
| `source`        | `"delivery_note" \| "ledger_payment" \| "manual" \| "order_reversal"` | what produced this entry |
| `document`      | `{ type: "delivery_note" \| "invoice"; id: string; number?: string } \| undefined` | present for accruals |
| `reference`     | `{ type: "order" \| "transaction" \| "manual"; id: string } \| undefined` | order id (accrual), ledger txId (settlement) |
| `dedupKey`      | `string`                              | deterministic; doc id derived from it |
| `causedByEventId`| `string \| undefined`                | event id when source is event-driven |
| `billingAccountId`| `string \| null`                    | optional sub-grouping |
| `createdAt`     | `number` (epoch millis)               | used for date-range queries |
| `companyId`     | `string`                              | tenant |
| `storeId`       | `string`                              | tenant |

### 2.4 Rollup schema (`OrganizationBalanceRollup`)

| Field           | Type                    | Notes |
| --------------- | ----------------------- | ----- |
| `organizationId`| `string`                | = doc id |
| `owed`          | `number` (int agorot)   | `Σ(+) − Σ(−)`, clamped ≥ 0 |
| `totalAccrued`  | `number` (int agorot)   | lifetime `Σ(+)` |
| `totalSettled`  | `number` (int agorot)   | lifetime `Σ(−)` |
| `currency`      | `"ILS"`                 | literal |
| `updatedAt`     | `number` (epoch millis) | |
| `companyId`     | `string`                | tenant |
| `storeId`       | `string`                | tenant |

### 2.5 Query patterns + indexes

- **Per-org statement, date range:** `where organizationId == X and createdAt >= from and createdAt <= to order by createdAt`.
  → Composite index: `organizationBalance (organizationId ASC, createdAt ASC)`.
- **Whole-store, date range (all orgs):** `where createdAt >= from and createdAt <= to order by createdAt`.
  → Single-field index on `createdAt` (auto).
- **One org current balance:** direct read of `organizationBalanceRollup/{organizationId}` (O(1)).
- **All orgs current balances (admin AR list):** `collection(organizationBalanceRollup).get()` (O(orgs)).
- **By document:** `where document.id == X` (optional; single-field auto-index on `document.id`).

Firestore composite index `(organizationId, createdAt)` must be added to `firestore.indexes.json`.

---

## 3. Event flow diagrams

### 3.1 Delivery-note accrual (debt UP)

```
admin creates delivery note
  → appApi.documents.createDeliveryNote() writes order.deliveryNote, uploads PDF
  → emits documents.delivery_note_created  (existing event, payload unchanged)
       │
       ▼  documents/subscribers/accrueOnDeliveryNoteCreated   (NEW — replaces ledger subscriber)
  guard: skip if no organizationId (B2C → no AR)
  read server order doc → amount = round(order.cart.cartTotal * 100)  (shekels → agorot)
  write OrganizationBalanceEntry { sign:"+", kind:"accrual", source:"delivery_note",
       document:{type:"delivery_note", id, number}, reference:{type:"order", id},
       dedupKey: dn_{deliveryNoteId} }     via .create()  (ALREADY_EXISTS = no-op)
  update organizationBalanceRollup/{orgId}: owed += amount, totalAccrued += amount
```

### 3.2 Payment settlement (debt DOWN)

```
customer pays (HYP) / admin records manual money-in
  → ledger.postTransaction writes transactions/{txId} (cash, direction:"in")
  → emits ledger.transaction_posted  (money core, unchanged)
       │
       ▼  documents/subscribers/settleOnTransactionPosted   (NEW — moved from budget)
  re-read stored tx (payload is only a routing hint — security)
  guard: direction == "in" AND reference.type == "order" AND payer.organizationId present
  write OrganizationBalanceEntry { sign:"-", kind:"settlement", source:"ledger_payment",
       reference:{type:"transaction", id:txId}, dedupKey: evt_settleOnTransactionPosted_{eventId} }
  update organizationBalanceRollup/{orgId}: owed = max(0, owed − amount), totalSettled += amount
```

### 3.3 Invoice — NO balance effect (recommended option (a))

```
admin creates invoice from a delivery note
  → documents/api/createInvoice writes order.invoice, emits documents.invoice_created
       │
       ▼  (NO AR subscriber)
  Invoice is a billing milestone only. The delivery note ALREADY accrued the debt (§3.1).
  Accruing again on invoice would DOUBLE-COUNT. Rule: invoice does not touch organizationBalance.
```

**Rule stated precisely:** *Debt is accrued exactly once, at delivery-note creation. An invoice
issued from that delivery note is a billing/tax document only and has zero effect on
`organizationBalance`.* (This matches the prior model, which accrued at the delivery note.)
The `documents.invoice_created` event keeps firing for tax/reporting consumers, but no AR
subscriber listens to it. *If* a store ever issues invoices WITHOUT a prior delivery note,
that is an open question (§11, Q3) — out of scope here.

### 3.4 Cancel / refund

- **Order cancelled / refunded before payment:** today `budget/reduceDebtOnOrderReversed`
  reverses the original `debt_increase`. In the new model, accrual happens at the **delivery
  note**, not at order placement. A delivery note is rarely issued for an order that is then
  cancelled; if it is, the correction is a manual AR adjustment entry (`sign:"-"`,
  `kind:"adjustment"`, `source:"order_reversal"`, dedup `order_reversal_{orderId}`).
- **Refund (money out):** a `transactions` row with `direction:"out"` is emitted. The
  settlement subscriber only acts on `direction:"in"`, so a refund does NOT auto-increase AR.
  If a refund should re-open debt, that is posted as an explicit adjustment entry. **Decision:
  Phase 1 does NOT auto-adjust AR on refund** (mirrors the current `orgBalances` behavior where
  credit/out leaves AR untouched). Tracked as Q4.

---

## 4. File-by-file change list

### 4.1 `documents` module — ADD

| File | What |
| ---- | ---- |
| `documents/internal/paths.ts` (NEW) | `organizationBalanceEntryPath`, `organizationBalanceCollectionPath`, `organizationBalanceRollupPath`. Built via `FirebaseAPI.firestore.getPath`. |
| `documents/internal/docIds.ts` (NEW) | deterministic id builders: `dn_{deliveryNoteId}`, `evt_settleOnTransactionPosted_{eventId}`, `order_reversal_{orderId}`, `manual_{...}`. |
| `documents/internal/organizationBalanceStore.ts` (NEW) | the ONLY writer of entries + rollup. `.create()` entry + transactional rollup update; ALREADY_EXISTS = no-op. Module-private. |
| `documents/services/accrueDebt.ts` (NEW) | verb-named service: write an accrual entry + bump rollup. Entry-point-agnostic. |
| `documents/services/settleDebt.ts` (NEW) | verb-named service: write a settlement entry + reduce rollup (clamp ≥ 0). |
| `documents/services/reconcileOrganizationBalance.ts` (NEW) | rebuild rollups from entry ledger per tenant (backfill/parity/self-heal). Mirrors `budget/reconcileProjections` but scans `organizationBalance`, NOT `transactions`. |
| `documents/subscribers/accrueOnDeliveryNoteCreated.ts` (NEW) | thin: subscribe `documents.delivery_note_created` → `accrueDebt(...)`. **Replaces** the ledger subscriber. |
| `documents/subscribers/settleOnTransactionPosted.ts` (NEW) | thin: subscribe `ledger.transaction_posted` → `settleDebt(...)`. **Moved from** budget's `reduceDebtOnTransactionPosted`. Re-reads stored tx; payload is a routing hint only. |
| `documents/api/reconcileOrganizationBalance.ts` (NEW) | admin callable for parity/backfill dry-run + apply. |
| `documents/triggers/reconcileOrganizationBalanceSchedule.ts` (NEW) | nightly self-heal schedule. |
| `documents/api/getOrganizationBalance.ts` (NEW, optional Phase-1) | admin callable: read rollup + entries (date-range) for one org → admin UI. (Or defer to UI step.) |
| `documents/types.ts` | only if any field is backend-only. Entry+rollup schemas go to **core** (admin UI reads them) — see §5. |
| `documents/events.ts` | unchanged (DN/invoice events already here). |
| `documents/index.ts` | export the new callables/subscribers/schedule for wiring. |
| `documents/README.md` | update: documents now owns `organizationBalance` + `organizationBalanceRollup`; document the two collections, the accrual/settlement rules, the invoice-no-op rule, idempotency keys. |

### 4.2 `documents` module — REMOVE the emit wrappers (CLAUDE.md compliance)

CLAUDE.md forbids `emit*.ts` wrapper files (inline `emitEvent` at the call site). The current
`documents/internal/emitDeliveryNoteCreated.ts` and `emitInvoiceCreated.ts` violate this.
**Inline both** into their call sites: `appApi/index.ts` (delivery-note emit, line ~249) and
`documents/api/createInvoice.ts` (invoice emit, line ~155). Delete the two wrapper files.
*(This is adjacent cleanup unblocked by touching the module; can be a separate small task if
Philip prefers to keep the diff focused.)*

### 4.3 `ledger` module — REMOVE debt concepts (make it pure cash)

| File | Change |
| ---- | ------ |
| `ledger/types.ts` | `TransactionTypeSchema`: drop `delivery_note`, `invoice`, `credit_note`, `adjustment` → keep `manual`, `hyp_direct`, `hyp_j5_auth`, `hyp_capture`. **Remove `TransactionKindSchema` + `kind` field.** `direction`: drop `"none"` → `z.enum(["in","out"])`. Remove the `document` field. (`payer.organizationId` STAYS — cash payments are still org-scoped so settlement can route.) |
| `ledger/events.ts` | `TransactionPostedPayload`: remove `kind`, remove `"none"` from `direction`, narrow `type` enum to the 4 cash types. Keep `payer`. |
| `ledger/services/postTransaction.ts` | remove `kind` handling (the `?? "credit"` default, the `kind` in `TransactionData` omit list + event payload). |
| `ledger/subscribers/postDebitOnDeliveryNoteCreated.ts` | **DELETE** — accrual now lives in `documents/subscribers/accrueOnDeliveryNoteCreated.ts`. |
| `ledger/index.ts` | remove `TransactionKindSchema`/`TransactionKind` exports; remove `postDebitOnDeliveryNoteCreated` export. |
| `ledger/README.md` + `apps/docs/.../ledger.md` | state ledger is pure cash; AR lives in documents. |

### 4.4 `budget` module — split: KEEP revenue, REMOVE AR/debt

| File | Fate | Reason |
| ---- | ---- | ------ |
| `budget/types.ts` `RevenueRollupSchema`/`TRevenueRollup` | **KEEP** | revenue = cash reporting |
| `budget/types.ts` `OrgBalanceSchema`/`TOrgBalance` | **REMOVE** | AR moved to documents (`OrganizationBalanceRollup`) |
| `budget/types.ts` `BudgetRollupSchema`, `BudgetIdempotencyMarkerSchema` | KEEP marker (used by revenue projection) | rollup schema: keep if used by revenue; else remove |
| `budget/services/applyLedgerProjection.ts` | **EDIT** → revenue-only | strip the `orgBalances`/AR branch (the `isDebit`/`owed` block); keep the `revenueRollups` branch. Rename to `applyRevenueProjection.ts` (verb stays). Narrow input enum to cash types, drop `kind`. |
| `budget/services/reconcileProjections.ts` | **EDIT** → revenue-only | strip the org-aggregation + `orgBalances` write; keep the month/revenue aggregation. Still scans `transactions` (cash). |
| `budget/subscribers/updateProjectionsOnTransactionPosted.ts` | **EDIT** → revenue-only | drop `kind`, call the revenue-only projection. |
| `budget/subscribers/reduceDebtOnTransactionPosted.ts` | **DELETE** (logic moves to `documents/subscribers/settleOnTransactionPosted.ts`) | AR settlement now owned by documents |
| `budget/subscribers/increaseDebtOnOrderPlaced.ts` | **DELETE** | legacy debt-at-placement model; reversed design accrues at DN. Writes legacy `budgetRecords`/`organizationBudgets`. |
| `budget/subscribers/reduceDebtOnOrderReversed.ts` | **DELETE** | legacy reversal of debt-at-placement; replaced by manual AR adjustment (§3.4) |
| `budget/services/applyBudgetEvent.ts` | **DELETE** | only writer of legacy `budgetRecords`/`organizationBudgets`; nothing left calls it after the three subscribers above are gone |
| `budget/internal/budgetStore.ts` | **DELETE** | legacy store (organizationBudgets/budgetRecords) |
| `budget/internal/paths.ts` | **EDIT** | remove legacy + `orgBalances` path helpers; keep `revenueRollup*` + the revenue idempotency marker path |
| `budget/api/budgetApi.ts` | **EDIT** | `getBudgetAccount`/`listBudgetAccounts`/`getBudgetTransactions`/`addBudgetManualTransaction` read/write the legacy model → **disable or repoint**. Keep the deployed function NAMES (avoid delete+create deploy). Either: (a) keep them as thin error-returning stubs (like `markOrderPaid` already is) until the admin UI is repointed, then delete; or (b) repoint reads to documents AR. **Recommend (a) for Phase 1**, repoint in the admin-UI step. |
| `budget/index.ts` | **EDIT** | drop the deleted subscriber/service exports; keep revenue projection + revenue reconcile exports |

### 4.5 `functions/src/index.tsx` — rewire

- Remove exports of `increaseDebtOnOrderPlaced`, `reduceDebtOnOrderCancelled`,
  `reduceDebtOnOrderRefunded`, `reduceDebtOnTransactionPosted` (deleted).
- `postDebitOnDeliveryNoteCreated` no longer comes from `export * from "./modules/ledger"`.
- Add exports from `documents`: `accrueOnDeliveryNoteCreated`, `settleOnTransactionPosted`,
  `reconcileOrganizationBalance` (callable), `reconcileOrganizationBalanceSchedule`,
  `getOrganizationBalance` (if built in Phase 1).
- Keep `updateProjectionsOnTransactionPosted` (revenue), `reconcileBudgetProjections`,
  `reconcileProjectionsSchedule` from budget (now revenue-only).
- Keep `markOrderPaid` / `getBudgetAccount` / `listBudgetAccounts` / `getBudgetTransactions`
  exports as long as the disabled-stub strategy is used (deployed-name stability).

> **Deployment-name caution (from `money-core.md` guardrails):** renaming or removing a
> deployed Cloud Function = delete+create on deploy. Deleting the four budget subscribers
> is acceptable (they are event subscribers, and the events they consumed are no longer
> produced/needed), but the **callables** (`getBudgetAccount`, etc.) should be stubbed, not
> deleted, until the admin UI is repointed. **Deleting functions needs explicit deploy-time
> sign-off** (CLAUDE.md destructive-ops gate).

### 4.6 `packages/core` — ADD collections + entity schemas (version bump)

See §5.

### 4.7 Admin UI — LATER, clearly separated step

`apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx` +
`apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx` call
`FirebaseApi.api.{listBudgetAccounts,getBudgetAccount,getBudgetTransactions}`
(`apps/store/src/lib/firebase/api.ts:360–373`). In a later step:
- Add `getOrganizationBalance` to `api.ts`.
- Repoint the pages to read the documents AR rollup (per-org `owed`) and the entry ledger
  (date-filterable statements per org).
- Then retire the disabled budget callables.
**This is not in the backend Phase-1 scope** — list it but do not block on it.

---

## 5. `packages/core` changes + version bump

1. `packages/core/lib/firebase-api/index.ts` `storeCollections`: add
   `organizationBalance: "organizationBalance"` and
   `organizationBalanceRollup: "organizationBalanceRollup"`. (Required because
   `getPath`'s `collectionName` is typed against this map.)
2. NEW `packages/core/lib/entities/OrganizationBalance.ts`: export
   `OrganizationBalanceEntrySchema` + `OrganizationBalanceRollupSchema` (§2.3/§2.4) and their
   `T*` types. **Rationale for core (not `documents/types.ts`):** the admin UI reads AR for
   statements, so these are client-used domain entities — per CLAUDE.md's "Where schemas go"
   table, that means core.
3. Register the new entities in `packages/core/lib/entities/index.ts`.
4. **Bump core version** `0.15.3 → 0.16.0` (additive collections + new entity; minor).
   Per CLAUDE.md hard rule: update the dependency to the **exact new version** in BOTH
   consumers — `apps/store/package.json` and `functions/package.json` — in the same change.
   On merge to `main`, CI publishes the new core version; the backend installs from the
   registry, so the version reference must match.

**Sequencing constraint:** core must build and publish (or be linked) BEFORE the documents
backend that imports the new schemas/collection names can typecheck. Core is task #1.

---

## 6. Idempotency design

All writers use a **deterministic doc id derived from a dedup key + `.create()`**; on
gRPC `ALREADY_EXISTS` (code `6` / `"already-exists"`) treat as an idempotent no-op (return
existing). The entry write and the rollup update happen in ONE Firestore `runTransaction` so
they cannot diverge (the entry's `.create()` inside the transaction is the idempotency guard;
if it throws ALREADY_EXISTS the rollup is not double-applied).

| Source | Dedup key | Doc id |
| ------ | --------- | ------ |
| delivery-note accrual | `dn_{deliveryNoteId}` | `dn_{deliveryNoteId}` |
| payment settlement (event) | `evt_settleOnTransactionPosted_{eventId}` | same |
| order reversal adjustment | `order_reversal_{orderId}` | same (cancel + refund both resolve to one) |
| manual adjustment | `manual_{timestamp}_{actor}` | same |

These match the project idempotency rules in CLAUDE.md (subscriber `evt_{subscriber}_{eventId}`,
external/document sources keyed deterministically).

---

## 7. Reconciliation / self-heal

- `documents/services/reconcileOrganizationBalance.ts` scans the **`organizationBalance` entry
  ledger** for a tenant, aggregates per org (`Σ(+) − Σ(−)`, clamp ≥ 0), and rewrites each
  `organizationBalanceRollup/{orgId}`. Supports `apply: false` (dry-run parity report with
  drift vs current rollup) and `apply: true` (overwrite).
- A nightly schedule (`reconcileOrganizationBalanceSchedule.ts`) runs it per active tenant —
  mirrors the existing `budget/triggers/reconcileProjectionsSchedule.ts` pattern.
- The entry ledger is authoritative; the rollup is a cache. A missed/duplicated settlement or
  accrual event self-corrects on the next reconcile. This is the stability guarantee, carried
  over from `budget-redesign.md` but now scoped to AR-from-AR-entries (never from
  `transactions`).
- **Budget keeps its own revenue reconcile** (`reconcileProjections.ts`, revenue-only, scans
  `transactions` cash rows). Two independent reconcile passes: AR (documents) and revenue
  (budget).

---

## 8. Money + time + tenant conventions

- **Money:** integer agorot. `order.cart.cartTotal` is in **shekels** today → convert at the
  subscriber boundary with `Math.round(cartTotalShekels * 100)` (carried over verbatim from
  the existing `postDebitOnDeliveryNoteCreated`). Settlement amount comes from the stored
  `transactions` doc (already agorot).
- **Timestamps:** epoch millis (`Date.now()`), never Firestore `Timestamp`.
- **Tenant isolation:** every entry + rollup carries `companyId`/`storeId`; all paths via
  `FirebaseAPI.firestore.getPath`. Reconcile and queries are always tenant-scoped.

---

## 9. Data migration / backfill (dev/test stores only; prod needs sign-off)

Existing data to deal with:

1. **`delivery_note` debit rows already in `transactions`.** After the schema narrows, these
   rows become invalid against the new `TransactionSchema` (they have `kind:"debit"`,
   `direction:"none"`, `type:"delivery_note"`). Options:
   - **(a) Leave them inert (recommended).** The new ledger readers only act on
     `direction:"in"|"out"`; the new schema is enforced on WRITE, and existing reads use
     `as Transaction` casts, so old debit rows simply stop being interpreted. They become
     legacy data. No deletion. Smallest blast radius (matches CLAUDE.md "stale data over
     deletion").
   - (b) Hard-delete them. **Not recommended** — irreversible, needs its own destructive-ops
     approval, and provides no benefit over (a).
   - Either way, run the new `reconcileOrganizationBalance` (apply) to BUILD the
     `organizationBalance` entries + rollups. **Backfill source decision (Q1):** rebuild AR
     from the existing `transactions` debit rows (one-time migration script reads them and
     writes `organizationBalance` accrual entries with `dn_{...}` ids), OR re-derive from
     orders that have a `deliveryNote`. Recommend the former: it preserves the exact accrued
     amounts already computed.
2. **`orgBalances` (budget projection).** Becomes orphaned (no writer). Leave inert; the admin
   UI will read documents AR instead. Optionally delete in a later cleanup (separate approval).
3. **Legacy `organizationBudgets` / `budgetRecords`.** Already legacy; leave inert. The
   callables that read them are stubbed (§4.4). Cleanup later.

**Process:** on a **test store** (`dev:test` / `dev:test2`) only — never balasistore/pecanis:
run reconcile dry-run → review drift → apply → verify rollups. **Prod migration is a separate,
explicitly-approved step** (CLAUDE.md: no migration without developer approval; destructive ops
gated).

---

## 10. Sequenced implementation checklist (coder order)

Core builds before consumers (CLAUDE.md hard rule).

1. **[core]** Add the two `storeCollections` entries + `OrganizationBalance.ts` entity schemas;
   register in `entities/index.ts`; bump `0.15.3 → 0.16.0`; update `apps/store` +
   `functions` deps to the exact version. Verify all packages build. *(blocks everything)*
2. **[documents]** Add `internal/paths.ts`, `internal/docIds.ts`,
   `internal/organizationBalanceStore.ts`, `services/accrueDebt.ts`,
   `services/settleDebt.ts`. *(depends on #1)*
3. **[documents]** Add `subscribers/accrueOnDeliveryNoteCreated.ts` (port logic from the ledger
   subscriber being deleted) + `subscribers/settleOnTransactionPosted.ts` (port from budget's
   `reduceDebtOnTransactionPosted`). *(depends on #2)*
4. **[documents]** Add `reconcileOrganizationBalance` service + callable + schedule;
   `getOrganizationBalance` callable (optional). Update `documents/index.ts` + README. *(depends on #2)*
5. **[ledger]** Narrow `types.ts` + `events.ts` + `postTransaction.ts` to pure cash; delete
   `postDebitOnDeliveryNoteCreated.ts`; update `index.ts` + README. *(can run parallel to #2–4
   once the consumers in #6/#7 are coordinated; but its event-payload narrowing is a fan-out —
   see §Fan-out. Land #6/#7 in lockstep.)*
6. **[budget]** Strip AR from `applyLedgerProjection`/`reconcileProjections`/
   `updateProjectionsOnTransactionPosted` (revenue-only); delete the three legacy subscribers +
   `applyBudgetEvent` + `budgetStore`; trim `paths.ts`; stub the budget callables; update
   `index.ts`. *(coordinate with #5: both consume the narrowed `TransactionPostedPayload`)*
7. **[wiring]** Update `functions/src/index.tsx` exports (add documents fns, remove deleted
   budget subscribers). Add the Firestore composite index. *(depends on #3–6)*
8. **[migration]** On a test store: backfill `organizationBalance` via reconcile; verify
   parity. *(depends on #7; prod is a separate approved step)*
9. **[admin UI — LATER]** Repoint `AdminBudgetPage` + `AdminOrganizationDetailPage` +
   `api.ts` to documents AR; then delete the stubbed budget callables. *(separate task)*
10. **[docs]** Update `apps/docs/.../documents.md` (now owns AR), `apps/docs/.../ledger.md`
    (pure cash), mark `budget-redesign.md` §9.1 **REVERSED**, reconcile note in `money-core.md`.

---

## 11. Open questions / risks

- **Q1 (backfill source):** Rebuild AR entries from existing `transactions` debit rows, or
  re-derive from orders with a `deliveryNote`? Recommend the former (preserves computed
  amounts). Needs Philip's call before the migration step.
- **Q2 (legacy cleanup):** Delete inert `orgBalances`/`organizationBudgets`/`budgetRecords`
  collections later, or leave forever? Recommend leave inert now; revisit. Any deletion = its
  own destructive-ops approval.
- **Q3 (invoice without a delivery note):** Does any store issue an invoice with no prior DN?
  If yes, the "accrue once at DN" rule misses that debt. Out of scope; confirm current flows
  always DN-first.
- **Q4 (refund → AR):** Should a refund (`direction:"out"`) re-open AR? Phase 1 says no
  (matches current `orgBalances`). Confirm.
- **Risk (HIGH — fan-out):** Narrowing `TransactionPostedPayload` (removing `kind`, removing
  `direction:"none"`, narrowing `type`) is a discriminated-union fan-out. Every consumer of
  the event must be updated in lockstep: `documents/settleOnTransactionPosted` (new),
  `budget/updateProjectionsOnTransactionPosted`, `orders/markOrderPaidOnTransactionPosted`.
  Miss one and it breaks at runtime, not compile time (payloads are cast). Land #5/#6/#7 together.
- **Risk (MEDIUM — deploy):** Deleting Cloud Functions (budget subscribers) is delete-on-deploy.
  Subscribers are safe (events no longer produced); callables are stubbed, not deleted. Needs
  the deploy-time gate.
- **Risk (MEDIUM — double-accrual):** If both the old ledger debit path and the new documents
  accrual run simultaneously during rollout, debt doubles. Cutover must delete the ledger
  subscriber in the SAME release that adds the documents accrual subscriber (no overlap window).
- **Risk (LOW — order.cart.cartTotal units):** still shekels; conversion preserved at the
  boundary. When orders eventually store agorot upstream, drop the `*100` (same TODO as today).
