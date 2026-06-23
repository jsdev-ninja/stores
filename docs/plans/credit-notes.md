# Plan: credit / return documents (תעודת זיכוי) for customers

**Status:** Spec — not started. **Needs Philip's approval** (core schema + backend + money-touching). Requested by David (owner) on 2026-06-21.

**Why:** the owner wants to issue a credit / return document to a customer — e.g. when a customer returns goods, or to correct an over-charge. The system can currently issue delivery notes, invoices and receipts, but **cannot issue a credit note**. The AR architecture already anticipates this: refunds are "handled as new credit notes (see Deferred)" — this plan fills that gap.

---

## 1. Owner decisions (locked 2026-06-21)

David answered the scoping questions:

1. **Entry points — BOTH.** A credit note can be started **(a) from an existing order** (return some/all of its items) **and (b) as a manual credit** entered directly on the customer ledger (כרטסת), not tied to an order.
2. **Money effect — ledger offset only.** A credit note **reduces the customer's open debt (AR)**. It does **NOT** trigger an automatic cash refund to a card/account. (If real money was already paid and must be returned, that stays a separate manual action — out of v1 scope.)
3. **Partial credits — YES.** Must support crediting only some line items / a partial amount, not just the full order.

---

## 2. Where this fits the existing model

From `apps/docs` → *Money & documents*, the system keeps three things apart:

| Concept | Tracks | Lives in |
| --- | --- | --- |
| **Cash** | real money in/out | `ledger` module (append-only) |
| **Debt (AR)** | what each org owes now | `documents` module |
| **Documents** | legal paper trail | `documents` module + EZcount |

A credit note touches **two** of the three (per decision §1.2):

- **Document:** issue an EZcount **credit invoice** (`DOC_TYPE.CREDIT_INVOICE = 330`, "חשבונית זיכוי") — or a return note (`RETURN = 210`) — chained as a child of the original invoice via `parent`.
- **AR:** post an entry that **reduces** the org's open balance (a settlement/adjustment), mirroring how a delivery note accrues debt.
- **Cash:** **no** transaction in v1 (decision §1.2 — ledger cash log untouched).

This is the inverse of the existing delivery-note → invoice flow, so it reuses the same plumbing.

## 3. What already exists (half the groundwork)

| Piece | Status | Location |
| --- | --- | --- |
| EZcount credit doc-type `330` / return `210` | **defined, unused** | `functions/src/services/ezCountService/index.ts` |
| `createInvoice` / `createReceipt` (model to copy) | done | `functions/src/modules/documents/api/`, `ezCountService` |
| AR store with `accrual / settlement / adjustment` kinds | done | `functions/src/modules/documents/internal/organizationBalanceStore.ts` |
| Ledger transaction type `credit_note` (debit family) | **defined** in docs/types | `ledger` module |
| Ledger row label "זיכוי" + manual-entry modal | **UI present, backend stubbed** | `apps/store/.../AdminBudgetPage/AdminBudgetPage.tsx` (calls `addBudgetManualTransaction`, which always errors) |

So the EZcount enum, the AR entry kinds, and even a ledger row label + a manual-entry modal already exist — they were just never wired to a real backend.

## 4. What's missing (the build)

### Core (`@jsdev_ninja/core`) — **schema change → Philip only**
1. `CreditNote` / `EzCreditNote` entity schema (mirror `Invoice.ts` / `EzInvoiceSchema`), with: number, date, amount (agorot), parent invoice link, original `orderId`, credited line items, optional free-text reason, optional `allocationNumber` if ITA requires one for credit docs.
2. Add `creditNote` / `ezCreditNote` fields to the `Order` schema (denormalized mirror, like `invoice`/`ezInvoice`).
3. **Version bump** of `@jsdev_ninja/core` + update the dependency in `apps/store` and `functions` (per CLAUDE.md rule).

### Backend (`functions`)
4. `ezCountService.createCreditInvoice(...)` — new method using `DOC_TYPE.CREDIT_INVOICE` (330), `parent` = original invoice `doc_uuid`, deterministic `transaction_id` (e.g. `credit:{sha256(orderId|lineKey)}`).
5. `documents/api/createCreditNote.ts` — callable (admin-only; tenant from token, never client input). Validates the credit amount ≤ remaining creditable amount of the source order/invoice; posts the EZcount credit doc; writes `order.creditNote`; posts an **AR entry reducing the balance** (idempotent, deterministic dedup key e.g. `credit_{creditNoteId}`); emits `documents.credit_note_created`.
6. A **manual** path for the order-less case (decision §1.1b): either extend `createCreditNote` to accept a manual amount + target billing account (no `orderId`), or repoint the stubbed `addBudgetManualTransaction` to post a real AR adjustment of kind `credit_note`. **Decide one** (see §6).
7. Event `documents.credit_note_created` + Zod payload in `documents/events.ts`.

### Frontend (`apps/store` admin)
8. **From order:** a "הפק תעודת זיכוי" button on the admin order page → modal to pick which line items / quantities / amount to credit (partial supported) + reason → calls `createCreditNote`.
9. **Manual on ledger:** wire the existing כרטסת manual "זיכוי" modal to the real backend (currently dead).
10. **Display:** credit notes appear as a "זיכוי" row in the ledger (already labelled), reducing the running balance; expose the credit-note PDF link (like the invoice PDF).

## 5. Idempotency & money rules (must hold)
- Money stored as **integer agorot**; convert to shekels only at the EZcount boundary.
- AR credit entry keyed deterministically (`credit_{creditNoteId}`) → re-delivery / double-click no-ops, never double-credits.
- A credit can never exceed the source order/invoice's net (guard against over-crediting; track already-credited amount per source).
- Tenant scoping: companyId/storeId from the auth token, AR path via `FirebaseAPI.firestore.getPath`.

## 6. Open decisions for Philip (answer before building)
1. **EZcount doc type:** credit invoice `330` (חשבונית זיכוי) vs return note `210` (תעודת החזרה) — which is the correct Israeli document for this use case? (Likely 330; confirm with the accountant.)
2. **AR entry kind:** reuse `settlement` (it just "reduces balance") or add a distinct `credit_note` AR kind for cleaner reporting/audit? Docs already list a `credit_note` ledger type.
3. **Manual order-less credit (§4.6):** extend `createCreditNote` with an order-less branch, or revive `addBudgetManualTransaction` (currently stubbed) and route it through the documents module? One owner of "manual AR adjustment", not two.
4. **Allocation number (חשבונית ישראל):** do credit docs need an allocation number above a threshold, like invoices (≥ ₪5,000)? Mirror the `createInvoice` gate if so.
5. **Cash refund (explicitly deferred per owner decision §1.2):** confirm v1 ships ledger-offset only, with no card/account refund. A future phase can add the cash leg (`ledger` transaction, `direction: "out"`).

## 7. Difficulty
**MEDIUM–LARGE.** New core entity + version bump (consumers updated), one new EZcount method, one callable with an AR write, two UI entry points, partial-amount math + over-credit guard. Lower risk than it sounds because it mirrors the existing invoice/DN flow and reuses the AR ledger — but it **touches core schema and customer money**, so it is **developer-only** and must not be merged without Philip.

## Key files
- Core: `packages/core/lib/entities/{Invoice,DeliveryNote,Order,OrganizationBalance}.ts`
- EZcount: `functions/src/services/ezCountService/index.ts` (`DOC_TYPE`, `createInvoice`, `createReceipt`)
- Backend: `functions/src/modules/documents/api/{createInvoice,recordInvoicePayment}.ts`, `functions/src/modules/documents/internal/organizationBalanceStore.ts`, `functions/src/modules/documents/events.ts`
- Stub to resolve: `functions/src/modules/budget/api/budgetApi.ts` (`addBudgetManualTransaction`)
- Frontend: `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx`, admin order page, `apps/store/src/widgets/Modals/` (model on `CreateInvoiceModal.tsx`)
- Architecture: `apps/docs/docs/architecture/money-and-documents.md`, `apps/docs/docs/modules/documents.md`
