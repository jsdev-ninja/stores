# Plan — Invoices List page + Bulk Billing wizard

**Type:** Feature (two related features)
**Date:** 2026-06-17
**Project:** @jsdev-store (storebrix.com) — multi-tenant Firebase + Vite/React, EZcount-backed invoicing
**Status:** Phase 1 (Feature A — Invoices List) + Phase 2 (Feature B — Bulk billing wizard) BUILT.
- Phase 1: `getInvoices` backend + client wiring + page connected to real data (paid + open).
- Phase 2: `BulkBillingModal` (group unbilled DNs by company, per-company select + master checkbox, inline allocation-number entry for companies ≥ ₪5,000, sequential `createInvoice` per company with result reporting), launched from a banner on the Customer Invoices page. Owner decisions applied: no B2C group (no private customers); over-threshold companies are NOT skipped — an allocation number is collected inline.
- Still pending: allocation-editing on an already-issued invoice (§3.4, open question #1) and retiring/folding `AdminInvoicesPage` (open question #4). Both deferred.
**Demo reference:** `demo/balasi-store-site-2026-06-12/admin.js` (`renderInvoices` @7257, `invoiceStatusPill` @7229, `openBulkBillingWizard` @8743)

---

## 0. TL;DR

Two admin features modeled on the demo's Customer Invoices page, built almost entirely on plumbing that already exists in the real app:

- **Feature A — Invoices List (חשבוניות לקוחות):** a page listing ALL invoices (paid + open), distinct from the existing Customer Debts page (open only). Search, paid/open status filter, columns, view/edit-allocation/record-payment row actions, Excel(CSV) export.
- **Feature B — Bulk billing wizard (הפקת חשבוניות מרוכזות):** groups unbilled delivery notes by company and produces one consolidated tax invoice per company in a single action. Generalizes the existing single-company consolidated-invoice flow.

The single biggest reuse: **consolidated multi-DN invoices already work end-to-end** (`createInvoice` accepts comma-joined parent UUIDs; `AdminOrganizationsPage.handleCreateConsolidatedInvoice` already drives it for one company). Feature B is "loop that over many companies"; Feature A is "broaden one query + a richer table."

---

## 1. Scope & non-goals

### In scope

**Feature A — Invoices List**
- A page listing **all** invoices (paid AND open), at route `admin.invoices`.
- Search by invoice number OR company/customer name.
- Status filter: `all` / `שולם` (paid) / `פתוח` (open).
- Columns: invoice number, company, date, amount, paid, balance, status pill, actions.
- Row actions: **view** (open the EZcount PDF), **edit allocation number**, **record payment** (only when balance > 0).
- Excel export (client-side CSV blob, matching the app's existing export pattern).
- Status pill: paid / open only (NO overdue).

**Feature B — Bulk billing wizard**
- A banner ("יש תעודות משלוח שעדיין לא חויבו") shown when unbilled delivery notes exist.
- A wizard with collapsible per-company groups; each DN a checkbox row (number, date, item count, amount); master checkbox per company; select-all / clear-all; running total summary.
- "הפק חשבוניות" produces one consolidated invoice per company covering the selected DNs.

### Out of scope (explicit)
- **Partial payments** — deferred (tracked in todo.md). `recordInvoicePayment` is full-payment-only by design; the "paid" column is therefore binary (0 or full).
- **Due dates / overdue / aging** — no `dueDate` exists on the data model this iteration; the demo's overdue pill state and `net30/net45…` terms are dropped.
- **Supplier invoices** (`SupplierInvoice` entity) — unrelated; not touched.
- **A printable in-app invoice document** (demo's `viewInvoice` HTML). The real app already issues a real PDF via EZcount; "view" links to `pdf_link`. We do NOT rebuild the printable doc.
- **`@jsdev_ninja/core` schema changes** — none required (see §5).

---

## 2. What's reused vs new

> This is the most important section: it proves we are not rebuilding existing functionality.

| Capability | Status | Evidence / file |
|---|---|---|
| Consolidated multi-DN invoice (1 company) | **REUSE** | `createInvoice.ts` accepts `params.parent` = comma-joined `doc_uuid`s; `AdminOrganizationsPage.tsx:706 handleCreateConsolidatedInvoice()` already drives it via `invoiceDetails` modal |
| `createInvoice` backend (idempotent, batched, allocation gate, event) | **REUSE** | `functions/src/modules/documents/api/createInvoice.ts` — deterministic `transaction_id`, allocation gate @44, emits `documents.invoice_created` |
| EZcount invoice/receipt service | **REUSE** | `functions/src/services/ezCountService/index.ts` (DOC_TYPE.TAX_INVOICE / RECEIPT=400) |
| Record (full) payment + EZcount receipt | **REUSE** | `recordInvoicePayment.ts` + `RecordInvoicePaymentModal.tsx` — invoked verbatim by Feature A's row action |
| Open-invoices query (unpaid) | **EXTEND** | `getOpenInvoices.ts` returns unpaid only; Feature A needs all → add `getInvoices` (see §3.1) |
| Invoices-list page shell (KPI, table, filters) | **REUSE (pattern)** | `AdminBudgetPage.tsx` — `KpiCard`, `fmtDate`, `fmtMoney`, heroui `Table`, search + company `Select`. New page is a sibling. |
| Delivery-note helpers (number/date/total/itemCount/pdf) | **REUSE** | `AdminOrganizationsPage.tsx` `dnNumber/dnDate/dnItemCount/dnTotal/dnPdf`; "unbilled" = `!o.ezInvoice?.doc_number` (`dnInvoiceNumber`) |
| `getDeliveryNotes` (fetch DNs for a window) | **REUSE / EXTEND** | `appApi.admin.getDeliveryNotes({fromDate,toDate})` queries `ezDeliveryNote.success==true` — usable as the wizard's data source |
| Allocation input (≥₪5,000 ITA) | **REUSE (pattern), EXTEND (endpoint)** | `InvoiceDetailsModal` has `requireAllocation`; allocation is set ONLY at creation. **No edit-allocation endpoint exists** → small new endpoint for Feature A's "edit allocation" (see §3.4) |
| Excel export | **REUSE (pattern)** | `AdminOrdersPage.tsx:193 exportOrders()` — CSV blob + UTF-8 BOM, client-side. No xlsx dep; do NOT port demo's SheetJS. |
| Modal registry | **REUSE** | `widgets/Modals/index.tsx` `modals` map + `ModalType`; `modalApi.openModal(id, props)` |
| Routing / nav | **REUSE** | `navigation/index.tsx`, `AdminLayout.tsx`, `Sidebar.tsx` |
| Bulk-billing backend orchestration | **NEW (thin)** | one new service/endpoint OR frontend loop — see §3.2 (recommendation: frontend loop) |
| Status pill (paid/open) | **NEW (small)** | trivial component; demo's `invoiceStatusPill` minus overdue |
| Bulk-billing wizard UI | **NEW** | new modal — the only substantial net-new UI |

**Net-new code is small.** The bulk wizard UI and a status pill are the only genuinely new front-end pieces; everything else is reuse or a thin extension.

---

## 3. Backend plan (ordered, by file)

### 3.1 Invoices-list query — **recommend a NEW `getInvoices`, not a flag on `getOpenInvoices`**

`getOpenInvoices` has a tight, documented contract ("open = invoice exists AND unpaid") and is consumed by the Customer Debts page. Overloading it with an `includesPaid` flag muddies that contract and risks regressing the debts page. The two endpoints also differ in their natural row shape: the debts row has no `paid`/`balance`/`status` fields.

**Recommendation:** add `functions/src/modules/documents/api/getInvoices.ts`, mirroring `getOpenInvoices` structure but **without** the unpaid filter, and returning the richer `InvoiceRow` (adds `paid`, `balance`, `status`, `allocationNumber`).

- **Auth:** `admin` custom claim (same as `getOpenInvoices`).
- **Tenant:** `companyId` + `storeId` from `auth.token` — never from client input.
- **Query:** `where companyId == … AND storeId == … AND ezInvoice.success == true orderBy date desc`, optional `fromDate`/`toDate`. (Same Firestore shape as `getOpenInvoices`; no new index beyond what that endpoint already needs.)
- **Per row** (reuse `getOpenInvoices`'s name cascade + org batch-read verbatim):
  - `total` (shekels) from `ez.calculatedData.price_total` || `cart.cartTotal`.
  - `paid` = paid-in-full ? `total` : `0`. "Paid" determined by `o.invoicePaidAt` set OR `o.ezReceipt` present (matches the open/closed definition already in Order.ts). No partial payments, so `paid ∈ {0, total}`.
  - `balance` = `total - paid`.
  - `status` = `paid` if `balance <= 0`, else `open`. (Derived; not stored.)
  - `allocationNumber` from `o.invoice.allocationNumber` (optional).
  - `paidAt` from `o.invoicePaidAt` (optional, for display/sort).
- **Name rule:** keep `getOpenInvoices`'s hard rule — exclude rows with no resolvable name and WARN. (An invoice with no legal name should not be surfaced as a clean row; it's a data problem to fix, consistent with the debts page.) See §6 for the B2C visibility question.
- Register: re-export from the documents module `index.ts` and `functions/src/index.tsx`; wire `appApi.admin.getInvoices` (`appApi/index.ts`) + `httpsCallable(functions,"getInvoices")` (`src/lib/firebase/api.ts`); export `InvoiceRow` type next to `OpenInvoiceRow`.

> **Effort: M (backend).** Mostly copy-adapt of `getOpenInvoices` with a wider filter + 4 derived fields.

### 3.2 Bulk billing — **recommend FRONTEND-ORCHESTRATED (loop the existing `createInvoice` once per company)**, not a new endpoint

The existing single-company consolidated invoice already does exactly one company's work through `createInvoice` (idempotent, batched, allocation-gated, emits the event). Bulk billing is N independent companies. Two options:

- **A) New `bulkCreateInvoices` backend endpoint** — would give a single round-trip and let us wrap all companies in one logical operation. But: there is **no cross-company atomicity available anyway** (each company's invoice is a separate EZcount HTTP call + separate Firestore batch; EZcount calls cannot be rolled back), and `createInvoice` already runs up to 540s — N sequential EZcount calls in one callable risks timeout for large fan-outs. It also duplicates the allocation gate + event-emit + idempotency logic that `createInvoice` already owns.
- **B) Frontend loop over `createInvoice`** (one call per company) — **recommended.** Each company is already perfectly idempotent server-side (deterministic `transaction_id` from sorted orderIds → safe to retry a single company without duplicating). The wizard calls `createInvoice` per company, tracks per-company success/failure, and shows a result summary. No new backend surface, no timeout risk, reuses the allocation gate and event per company for free.

**Failure handling (best-effort with report — recommended over all-or-nothing):** because there is no true cross-company atomicity, all-or-nothing is an illusion (company 1's EZcount invoice already exists when company 3 fails). So: process companies sequentially, collect `{companyName, status: 'ok'|'error', invoiceNumber|error}` per company, and on completion show "הופקו X חשבוניות, נכשלו Y" with the failed companies listed and a retry affordance. Idempotency makes "retry the failed ones" safe. (See §6 for the allocation-gate interaction, which is the one case that legitimately blocks a company.)

> **Effort: S (backend) — none.** No new endpoint. All bulk logic is in the frontend wizard (§4.2).

### 3.3 `deliveryNote.status: "paid"` for consolidated invoices — **recommend a small fix**

Today `createInvoice` only sets `"deliveryNote.status": "paid"` when `orders.length === 1 && params.parent` (createInvoice.ts:141-148). For a consolidated (multi-order) invoice, the embedded `deliveryNote.status` on each order is **left unchanged** — so a multi-DN invoice does not mark its DNs as billed via that flag.

This matters for Feature B: after bulk billing, those DNs must not reappear as "unbilled." **However**, the canonical "unbilled" signal the UI actually uses is `!o.ezInvoice?.doc_number` / `!o.invoice` — and `createInvoice` already persists `o.invoice` on **every** order in the batch (createInvoice.ts:126-149). So consolidated DNs **do** drop out of the unbilled set correctly today, because `o.invoice` becomes set. The `deliveryNote.status` flag is a secondary/legacy signal.

**Recommendation:** make the flag consistent — set `"deliveryNote.status": "paid"` for **all** orders that carry an embedded `deliveryNote`, whenever `params.parent` is set (not just the single-order case). This is a 3-line change in the existing batch loop, removes a latent inconsistency, and makes the data self-describing. Low risk: it only adds a dotted-path field update to orders that already have a `deliveryNote` sub-object. (If we want to be maximally conservative we can ship Feature B without this and rely on `o.invoice`; but fixing it is cheap and correct.)

> **Effort: S (backend).** 3-line change + a note in `apps/docs`.

### 3.4 Edit allocation number — **recommend a small NEW endpoint**

Feature A's "edit allocation" row action has no existing backend. Allocation is currently only writable at invoice creation. Add `functions/src/modules/documents/api/setInvoiceAllocation.ts`:

- **Auth:** `admin` claim. **Tenant:** from `auth.token`.
- **Input:** `{ orderId: string, allocationNumber: string }` (validate `allocationNumber` is the ITA format — 9 digits, matching the modal's `placeholder="9 ספרות"`).
- **Effect:** dotted-path update `o.invoice.allocationNumber` + `o.invoice.allocationDate = Date.now()` on the order doc (scoped path via `getPath`). Reject if the order has no `invoice`.
- Register + wire (`appApi.admin.setInvoiceAllocation`, `httpsCallable`).

> **Effort: S (backend).** Single dotted-path write + validation.
>
> Alternative considered: reuse the EZcount allocation submission inside createInvoice — rejected, because here we are correcting/adding the ITA allocation number on an **already-issued** invoice, which is a metadata edit on our order doc, not a re-issue. (If the business needs the allocation number pushed back to EZcount/ITA, that is a separate concern — flag as open question in §6.)

### 3.5 Excel export — **client-side, NOT a server endpoint**

Volume is hundreds of invoices/year per store. The app already exports CSV client-side (`AdminOrdersPage.exportOrders`). **Recommendation:** reuse that exact pattern (CSV string → `Blob(["﻿" + csv], {type:"text/csv;charset=utf-8"})` → anchor download) in the Invoices List page. No backend, no new dependency. Do **not** add SheetJS (the demo loads it from CDN; we have no xlsx dep and don't need one). Header row + rows in Hebrew, columns matching the table.

> **Effort: S (frontend).** ~25 lines, copied from `exportOrders`.

---

## 4. Frontend plan (ordered, by file)

### 4.1 Invoices List page — **new file, do NOT repurpose `AdminInvoicesPage`** (initially)

`AdminInvoicesPage.tsx` today is misnamed: it is the "find orders that NEED an invoice → multi-select → create" tool (it drives `createInvoice` via the `invoiceDetails` modal). That is a genuinely useful, distinct workflow (it is also where the bulk-create entry point naturally lives). Renaming/gutting it risks breaking the create-invoice entry path and the nav.

**Recommendation:**
- Build the new list as a sibling page component, reusing `AdminBudgetPage` structure. Cleanest placement: a new exported component (e.g. `AdminInvoicesListPage`) in a new file, mounted at `admin.invoices`, and **move the current `AdminInvoicesPage` create-orders tool to a sub-action / its own modal entry** (it is already modal-driven; the page is mostly a results table for an org+date search). Concretely:
  - The new Invoices List becomes the `admin.invoices` route content.
  - The existing "create invoice from orders" capability is preserved as the **"+ צור חשבונית"** button on the new list (opens the existing `createInvoice` modal — same `modalApi.openModal("createInvoice", …)` call the old page used), so no capability is lost and the old page file can be retired.
- **Component structure** (mirror `AdminBudgetPage`):
  - `useState`: `rows: InvoiceRow[]`, `organizations`, `loading`, `search`, `statusFilter ('all'|'paid'|'open')`, `companyFilter`.
  - Load via `appApi.admin.getInvoices()` + `listOrganizations()`.
  - KPI strip (reuse `KpiCard`): e.g. total invoiced, total paid, total open balance, count.
  - Toolbar: search `Input` (reuse the icon+input block), status `Select` (all/paid/open), company `Select` — all client-side filtered in a `useMemo` (same as debts page).
  - Table (reuse the heroui `Table` styling block from `AdminBudgetPage`): columns = `מס׳ חשבונית` (+allocation badge), `חברה`, `תאריך`, `סכום`, `שולם`, `יתרה`, `סטטוס` (pill), actions.
  - Row actions (reuse helpers/modals):
    - **צפה** → anchor to `row.invoicePdfLink` (same as debts page).
    - **🛡 הקצאה / ערוך הקצאה** → small allocation modal (new, or reuse `confirmModal`-style) → `appApi.admin.setInvoiceAllocation`.
    - **תשלום** (only when `balance > 0`) → `modalApi.openModal("recordInvoicePayment", { row, onPaymentRecorded: reload })` — **verbatim reuse**.
  - **ייצוא** button → client-side CSV (reuse `exportOrders` pattern).
  - Status pill: new tiny component, `שולם` (success) / `פתוח` (warn). No overdue.
- **Reused helpers:** `fmtDate`, `fmtMoney`, `KpiCard` (consider hoisting these out of `AdminBudgetPage` into a shared admin util if duplication bothers us — optional, can stay duplicated short-term as the debts page already duplicates them from the DN page).

> **Effort: M (frontend).** Structure is a known sibling; new pieces are the status filter, paid/balance columns, allocation action, export.

### 4.2 Bulk billing wizard — **new modal** (not a page)

Modal fits the demo and the app's modal-registry pattern; it is launched from a banner + a button on the Invoices List.

- **Banner:** on the Invoices List page, after load, fetch unbilled DNs (reuse `appApi.admin.getDeliveryNotes({fromDate,toDate})` over a sensible window, then filter `!dnInvoiceNumber(o)` i.e. `!o.ezInvoice?.doc_number && !o.invoice`). If any exist, render a banner "יש תעודות משלוח שעדיין לא חויבו (N)" with a "הפק חשבוניות מרוכזות" button.
- **Register** a new modal `bulkBilling` in `widgets/Modals/index.tsx` (`modals` map + `ModalType`), e.g. props `{ onDone?: () => void }`. New component `widgets/Modals/BulkBillingModal.tsx`.
- **Wizard UI** (port the demo's structure to React + heroui):
  - On open, load unbilled DNs (same query+filter as banner), group by `organizationId` (fallback: DNs with no org go in a "ללא חברה / B2C" group — see §6 decision).
  - Per-company collapsible group (heroui `Disclosure`/`details`-equivalent or a simple controlled section): header = company name, DN count, group sum, master checkbox (checked/indeterminate logic — copy the demo's master/child sync). Body = one `Checkbox` row per DN: `dnNumber`, `fmtDate(dnDate)`, `${dnItemCount} פריטים`, `fmtMoney(dnTotal)`.
  - Global **סמן הכל / נקה הכל**; running summary "יופקו X חשבוניות עבור Y תעודות · סה\"כ ₪Z".
  - Selection state in component `useState` (a `Set<dnId>`), mirroring the demo's `window._bulkBilling.selected` but as React state.
- **Execute ("הפק חשבוניות"):** group selected DNs by company; for each company call `appApi.admin.createInvoice` (via `FirebaseApi.api.createInvoice`) with the **same params shape `InvoiceDetailsModal` builds** (item per DN = `תעודת משלוח {doc_number}` / `price: cartTotal` / `vat_type: NON`; `price_total` = sum; `parent` = comma-joined `ezDeliveryNote.doc_uuid`s). Sequentially, collecting per-company results.
  - **Allocation:** compute each company's `price_total`; if `>= 5000`, that company needs an allocation number. Bulk cannot silently invent one. **Decision (see §6):** companies over threshold are flagged in the wizard and **skipped from the one-click bulk run** with a clear message ("נדרש מספר הקצאה — הפק ידנית"), OR collect an allocation number inline per over-threshold company before running. Recommended for v1: **flag + skip + report**, so the happy path (sub-threshold consolidations) is one click, and over-threshold ones are routed to the existing single-company allocation flow.
  - **Progress/result feedback:** disable the button + show a spinner while looping; on completion show a result list (per company: ✓ invoice number / ✗ error / ⚠ skipped-needs-allocation) and a toast "הופקו N חשבוניות". Call `onDone` to refresh the list + banner.
- **Reuse:** the entire invoice-creation contract is reused from `InvoiceDetailsModal`/`createInvoice`; the wizard is orchestration + selection UI only.

> **Effort: L (frontend).** The genuinely new UI: grouping, master/child checkboxes, sequential execution with per-company result reporting.

### 4.3 Navigation / routing changes
- No new route strictly required if the Invoices List takes over `admin.invoices`. (`admin.invoices` already exists in `navigation/index.tsx`, `AdminLayout.tsx`, `Sidebar.tsx`.)
- Swap the element mounted at `admin.invoices` in `AdminLayout.tsx` to the new list component.
- Sidebar label `nav.invoices` ("חשבוניות") stays. Customer Debts (`admin.budget`, "חובות לקוחות") stays as its own sibling.
- Bulk wizard is modal-launched (no route).

> **Effort: S (frontend).**

---

## 5. Data model

- **No `@jsdev_ninja/core` schema changes required.** Everything needed already exists on `Order` (`Order.ts`): `invoice` (+`invoice.allocationNumber`/`allocationDate`), `ezInvoice`, `ezReceipt`, `invoicePaidAt`, `deliveryNote`, `organizationId`, `nameOnInvoice`. **No core version bump.**
- **"Paid" / status derivation (no partial payments):** an invoice is **paid** iff `o.invoicePaidAt` is set OR `o.ezReceipt` is present; otherwise **open**. `paid = isPaid ? total : 0`; `balance = total - paid`; `status = balance <= 0 ? 'paid' : 'open'`. All derived server-side in `getInvoices` and returned on `InvoiceRow`. (This is the exact inverse of the "open" rule already documented on `Order.invoicePaidAt`.)
- **New types (NOT in core — backend api + frontend, alongside `OpenInvoiceRow`):**
  ```ts
  // functions/src/modules/documents/api/getInvoices.ts  (mirror OpenInvoiceRow)
  export type InvoiceRow = {
    orderId: string;
    invoiceUuid: string;
    invoiceNumber: string;
    invoicePdfLink: string;
    issueDate: number;            // epoch millis
    total: number;                // shekels
    paid: number;                 // shekels — 0 or total (no partials)
    balance: number;              // shekels — total - paid
    status: "paid" | "open";      // derived
    displayName: string;          // REQUIRED (same name cascade as OpenInvoiceRow)
    organizationId?: string;      // for company-filter dropdown
    allocationNumber?: string;    // o.invoice.allocationNumber
    paidAt?: number;              // o.invoicePaidAt (epoch millis)
  };
  ```
  Mirror this type on the client next to `OpenInvoiceRow` (currently in `src/lib/firebase/api`), consumed by the new page + modals. Re-export so the `status` literal is a single source of truth (see §"fan-out" note below).

### Fan-out note (small but real)
`status: "paid" | "open"` is a discriminated value the producer (`getInvoices`) writes and consumers branch on. Consumers to keep in sync if a third state is ever added (e.g. when partial payments land → `"partial"`):
- `getInvoices.ts` (producer)
- the client `InvoiceRow` type copy
- the status `Select` filter options (Invoices List page)
- the status pill component (paid/open → would need partial)
Documented here so the future partial-payments work updates all four, not just the type.

---

## 6. Edge cases & decisions (each with a recommendation)

| # | Case | Recommendation |
|---|---|---|
| 1 | **Consolidated invoice where a company's DN total is 0 or negative** | Guard in the wizard: a company group whose selected-DN sum `<= 0` is disabled with a note ("סכום אפס — לא ניתן להפיק"). EZcount would otherwise reject or produce a junk invoice. Cheap pre-check before the loop. |
| 2 | **Bulk partial failure (company 3 of 5 errors)** | **Best-effort with report** (not all-or-nothing — there is no real cross-company atomicity; earlier companies' EZcount invoices already exist). Process sequentially, collect per-company `{ok/error}`, show a summary + retry. Idempotency (deterministic `transaction_id`) makes retrying failed companies safe. |
| 3 | **Allocation threshold (₪5,000) on a CONSOLIDATED invoice** | **OWNER DECISION (2026-06-26): do NOT skip over-threshold companies.** The wizard detects per-company `price_total >= 5000` and **collects an allocation number (מספר הקצאה) inline** for those companies before running; the number is passed to `createInvoice` (which already accepts `allocationNumber`) and appears on the issued invoice in the same place as the single-company flow (top-left allocation field). A company over threshold without a number entered is blocked from the run until one is provided. |
| 4 | **A DN already invoiced sneaks into the wizard (race)** | Two-layer defense: (a) the wizard's source filter excludes `o.invoice`/`o.ezInvoice` at load; (b) server-side, `createInvoice`'s deterministic `transaction_id` + EZcount idempotency means re-billing the same orders is a no-op rather than a duplicate. If a DN was billed between load and execute, the consolidated `transaction_id` simply differs and could double-invoice **only if** the orderId set differs — mitigate by re-checking `!o.invoice` immediately before building each company's payload and dropping freshly-billed DNs. |
| 5 | **Invoices with no company (B2C) in the list** | **OWNER DECISION (2026-06-26): there are no private (B2C) customers** — every customer is a company. The bulk wizard therefore groups strictly by company and does **not** render a "ללא חברה / B2C" group. Any org-less delivery note is an unexpected data state: surface it as a skipped/warning row rather than billing it. |
| 6 | **Invoice with no resolvable legal name** | Same hard rule as `getOpenInvoices`: exclude + WARN. These are data defects, not list rows. |

---

## 7. Phasing

**Recommended order: Feature A first, then Feature B.**

- **Phase 1 — Invoices List (Feature A).** Mostly reuse (`getInvoices` ≈ `getOpenInvoices` + 4 derived fields; page ≈ `AdminBudgetPage`; payment action verbatim; CSV export pattern). Delivers immediate value (admins can finally see all invoices, paid + open, with balances) and ships **independently**. The only genuinely new backend is `getInvoices` (M) and `setInvoiceAllocation` (S); new frontend is the page (M) + status pill (S) + export (S).
- **Phase 2 — Bulk billing wizard (Feature B).** Builds on Phase 1's page (banner + entry button live there) and reuses `createInvoice` per company. The new work is concentrated in one modal (grouping, master/child selection, sequential execution + reporting, allocation-skip logic). Can ship after Phase 1 is verified. The §3.3 `deliveryNote.status` consistency fix rides along here (S).

Both features are independently shippable; Phase 1 has zero dependency on Phase 2, and Phase 2 depends on Phase 1 only for the banner host (the wizard modal itself could even be launched from `AdminInvoicesPage`/`AdminOrganizationsPage` if we wanted to ship it first, but list-first is the lower-risk order).

---

## 8. Files touched (final list)

### [BACKEND]
| File | Change | Effort |
|---|---|---|
| `functions/src/modules/documents/api/getInvoices.ts` | **NEW** — all-invoices query, `InvoiceRow` (mirror `getOpenInvoices` + paid/balance/status/allocation derivation) | **M** |
| `functions/src/modules/documents/api/setInvoiceAllocation.ts` | **NEW** — admin callable to set/edit `o.invoice.allocationNumber`+`allocationDate` (9-digit validation, tenant-scoped, reject if no invoice) | **S** |
| `functions/src/modules/documents/api/createInvoice.ts` | **EDIT** — set `"deliveryNote.status":"paid"` for ALL orders with an embedded `deliveryNote` when `params.parent` set (not just single-order) | **S** |
| `functions/src/modules/documents/index.ts` | **EDIT** — re-export `getInvoices`, `setInvoiceAllocation`, and `InvoiceRow` | **S** |
| `functions/src/index.tsx` | **EDIT** — re-export the two new callables (else silent non-deploy) | **S** |

### [FRONTEND]
| File | Change | Effort |
|---|---|---|
| `apps/store/src/pages/admin/AdminInvoicesListPage/AdminInvoicesListPage.tsx` (or repurpose dir) | **NEW** — Invoices List page (sibling of `AdminBudgetPage`): KPI, search, status+company filters, table, row actions (view/edit-allocation/record-payment), CSV export, bulk-billing banner | **M** |
| `apps/store/src/widgets/Modals/BulkBillingModal.tsx` | **NEW** — bulk wizard (per-company groups, master/child checkboxes, select/clear all, summary, sequential `createInvoice` per company, result reporting, allocation-skip) | **L** |
| `apps/store/src/widgets/Modals/index.tsx` | **EDIT** — register `bulkBilling` in `modals` map (+`ModalType`) | **S** |
| `apps/store/src/pages/admin/AdminLayout/AdminLayout.tsx` | **EDIT** — mount the new list component at `<Route name="admin.invoices">`; preserve the old create-orders tool as the list's "+ צור חשבונית" entry (existing `createInvoice` modal) | **S** |
| `apps/store/src/appApi/index.ts` | **EDIT** — add `admin.getInvoices`, `admin.setInvoiceAllocation` thin wrappers | **S** |
| `apps/store/src/lib/firebase/api.ts` | **EDIT** — `httpsCallable(functions,"getInvoices")`, `httpsCallable(functions,"setInvoiceAllocation")`; export client `InvoiceRow` type | **S** |
| `apps/store/src/pages/admin/AdminInvoicesPage/AdminInvoicesPage.tsx` | **EDIT/RETIRE** — retire as the `admin.invoices` page once its create-orders entry is folded into the new list (verify nothing else imports it first) | **S** |
| (optional) shared admin util for `KpiCard`/`fmtMoney`/`fmtDate` | **NEW (optional)** — hoist to avoid a third duplication; can defer | **S** |
| Hebrew i18n strings (if any new `nav.*`/labels) | **EDIT** — most labels are inline Hebrew verbatim per convention; add keys only if following existing `t()` usage | **S** |

### [SHARED]
- **None.** No `@jsdev_ninja/core` changes, no version bump.

### [DOCS]
| File | Change |
|---|---|
| `apps/docs` (documents/invoices flow page) | **EDIT** — document `getInvoices`, the paid/open derivation, bulk-billing orchestration + allocation-skip behavior, and the `deliveryNote.status` consistency fix |

---

## Open questions for the owner / developer
1. **Edit-allocation scope:** is setting `allocationNumber` on our order doc enough, or must the number also be pushed to EZcount/ITA for an already-issued invoice? (Affects whether §3.4 is a metadata write or an EZcount re-submission.)
2. **B2C in bulk:** should org-less (B2C) DNs appear in the bulk wizard at all, or only B2B/organization DNs? (Decision #5 defaults them to a separate, unchecked group.)
3. **Allocation in bulk (v1 vs v1.1):** is "flag + skip over-threshold companies, route to manual" acceptable for v1, or do we need inline allocation-number entry per over-threshold company on day one? (Decision #3.)
4. **Retire vs keep `AdminInvoicesPage`:** confirm the old create-orders tool can be folded into the new list's "+ צור חשבונית" button (vs keeping it as a separate page).
