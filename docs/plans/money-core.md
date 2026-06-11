# Money — spec + plans (the one doc)

Status: DRAFT for review (Philip). No code yet.
Everything money-related lives here, in two tracks:
- **Track 1 — money-core extraction** (sections A–C): spec, deferred decisions, refactor plan.
  *Phase 0 done + gate-approved; holding before Phase 1.*
- **Track 2 — payment-confirmation cutover & backfill** (section D): fix the `pending_j5`
  bug by moving the storefront onto the server-side ledger flow, then backfill stuck paid
  orders. *Drafted, not started.*

Order of execution is flexible: Track 2 fixes a live prod bug and can go first; once both
land, the storefront paid path is `payments-hyp → money.post()` — consistent either way.

---

# A. The spec — what "stable money" means

**Goal:** a money module that does NOT change when product/app features change, and
always works no matter what. Features come and go around it; the core stays frozen.

**What the core is:** it records money movements as immutable facts and derives balances
from them. It must NOT know what a product, cart, order, delivery note, promotion,
invoice, or HYP is.

## The contract — 3 operations, frozen

Accepts primitive money facts only (numbers + ids), never a cart/order/product object.

**3 write/derive ops (frozen) + reads.**

| Op | Kind | Input | Output |
|---|---|---|---|
| `post(tx)` | write | `amount` (agorot int), `currency`, `accountId/orgId`, `kind` (credit\|debit), `direction`, opaque `reference {type,id}`, `idempotencyKey` | recorded transaction |
| `balance(accountId)` | derive | account id | derived number |
| `reverse(txId, reason)` | write | a transaction id | a reversing transaction |
| `getTransactionById(id)` (+ scoped reads) | read | transaction id | the stored transaction |

The three write/derive ops are the frozen invariant-bearing contract. **Reads** (e.g.
`getTransactionById`) are also public — a ledger that can't be read is useless — and are not
"a 4th invariant," just access.

`reference` is an **opaque pointer** — stored, **never read by the core.** Reads hand the raw
transaction (incl. `reference`) to features; features are *allowed* to dereference it. This is
how a feature reads the ledger without touching the raw collection — see Check 2 / D5.

## The 6 rules ("always works no matter what")

1. **Append-only / immutable.** Never edit or delete; corrections = reversing entries.
2. **Idempotent by deterministic key.** `.create()` on a deterministic id → `ALREADY_EXISTS`
   no-op. Retries / double webhooks can't double-post. *(already implemented)*
3. **Integer agorot + explicit currency.** No floats, no implicit currency. *(project rule)*
4. **No outward dependencies.** Core imports NOTHING from other modules.
   *(`postTransaction.ts` already imports zero volatile code — verified)*
5. **Emits facts, never orchestrates.** Posting emits exactly one `transaction_posted` and
   stops. It does NOT flip orders / send email / update budgets — those modules react.
6. **Total & validating.** Rejects bad money (negative, wrong currency, closed period).

## The one law
**Dependencies point INTO money, never OUT.** Features call `post()`. Money never calls a
feature, never imports another module.

## Layering (target)
```
   billing / AR        payments-hyp (vendor)        orders, budget
   (feature)           (vendor adapter)             (features)
        │ post()             │ post()                   ▲ react to
        ▼                    ▼                          │ transaction_posted
   ┌───────────────────────────────────────────────────┴──┐
   │   MONEY CORE (frozen): post · balance · reverse        │
   │   immutable · idempotent · agorot · zero deps          │
   └───────────────────────────────────────────────────────┘
```
Swap HYP→Stripe = new adapter, core untouched. Add/remove fulfillment-billing = add/remove
a listener that calls `post()`, core untouched.

## Current code sorted by the law (refactor = separation, not rebuild)

| File(s) in `modules/ledger/` today | What it is | Target |
|---|---|---|
| `services/postTransaction.ts`, `internal/transactionsStore.ts`, `internal/paths.ts`, `events.ts`, `types.ts` | **money core** (clean) | stays → `modules/money/` (frozen) |
| `api/recordHypDirectPayment`, `api/recordHypJ5Auth`, `api/captureHypJ5`, `api/createHypDirectPaymentLink`, `api/createHypCheckoutPayment`, `api/getPaymentLink`, `services/createPaymentLink`, `services/verifyHypSignature` | **HYP vendor adapter** (volatile) | → `modules/payments-hyp/`, calls `money.post()` |
| `services/detectDuplicateCharges`, `services/validateAndConsumeLink` | payment-domain guards (see D6) | default → `payments-hyp/` |
| `subscribers/postDebitOnDeliveryNoteCreated` | fulfillment feature (knows "delivery note") | → `modules/billing/`, listens + calls `money.post()` |
| `orders/subscribers/markOrderPaidOnTransactionPosted`, `budget/subscribers/updateProjectionsOnTransactionPosted` | features that already correctly REACT | stay where they are |

---

# B. Deferred decisions (D1–D6)

Recorded now so the frozen API doesn't foreclose the right answer. None block the
refactor. **D2, D4, D6 are worth applying during the carve;** the rest come later.

> **PREREQUISITE (surfaced by Phase 0):** D1 and D4 both presume an **`account` entity with a
> `currency` field** — and the audit found **neither exists**. Today `Transaction` hardcodes
> `currency: z.literal("ILS")`, there is no account, and balances are derived per-org via the
> budget `orgBalances` projection. So **D1 and D4 are not "later" — they are blocked on a
> data-model design** (introduce an account entity, OR keep `org+type` as the key and hang
> currency off that, AND decide how `orgBalances` projects per-currency). That design is a
> **prerequisite track**, not a function to write. Anyone picking up "add `balance()`" needs to
> know it's a schema project first.

- **D1 — `balance()` shard-ready.** *(Blocked on the account/currency design above.)* Hot
  accounts (main A/R, "HYP cash") use N sharded running-balance docs (`FieldValue.increment`
  to a random shard inside the post tx); cold accounts may sum entries. A single counter breaks
  at >1 posting/sec/account. `balance()` returns a *derived* number; callers never assume a
  single field.
- **D2 — closed-period check INSIDE the post transaction.** Read `closedPeriods/{yyyymm}`
  via `tx.get()` in the same `runTransaction`, keyed on `effectiveAt`. Outside = race
  (period closes between check and commit). *Apply during the carve.*
- **D3 — `reverse()` posts to today's open period.** `effectiveAt = now`, carries
  `reversalOf`, swaps debit/credit. Never backdates into a (possibly closed) period.
- **D4 — one currency per account; FX explicit.** *(Blocked on the account/currency design
  above.)* Currency is fixed per account; `post()` rejects `currency` ≠ account currency;
  cross-currency = explicit two-account transfer, never one implicit conversion. Defines "wrong
  currency" in rule 6.
  **₱ / 2nd-currency reality check:** this is NOT "relax `z.literal("ILS")` → enum." Per Phase 0
  it is (a) relax the literal **and** (b) introduce the account-or-org-currency entity **and**
  (c) decide how `orgBalances` projects per-currency — i.e. it touches the **frozen `Transaction`
  schema** this whole refactor exists to keep stable. If Philippines exposure is genuinely on the
  roadmap, that sequence deserves its own one-line plan **now** — better to know the schema change
  is coming than to freeze around `ILS` and reopen it in six months.
- **D5 — reconciliation is a named future track (a feature, not the core).** A job in
  `payments-hyp/` (or `reconciliation/`) dereferences the opaque `reference` to match
  ledger ↔ vendor settlement ↔ source doc, flags drift ("captured, no `transaction_posted`";
  amount mismatch ≥ 1 agora), writes to its own collection — never back into `transactions`.
  Sequenced with the payment-confirmation cutover.
- **D6 — move the two guard services to the adapter.** "Duplicate charge" and "payment link"
  are payment-domain concepts, not money invariants. Core dedup = the deterministic
  idempotency key only. Default `detectDuplicateCharges` + `validateAndConsumeLink` →
  `payments-hyp/`; keep in core ONLY if Phase-0 audit proves zero HYP/charge/link semantics.

---

# C. The refactor plan

**Pure refactor: no behavior, path, event, or function-name change.** Only file/module
boundaries move.

## Guardrails (hold throughout)
- `transactions` collection path + `transaction_posted` payload unchanged (assert in a test).
- Deployed Cloud Function names unchanged (rename = delete+create deploy → avoid).
- Subscriber `name` strings unchanged (the `name` is part of the `evt_{name}_{eventId}`
  dedup key — renaming re-fires events).
- **Transaction document shape unchanged** — the stored `Transaction` schema is identical
  across the move (a test asserts the persisted doc shape, next to the path assertion). This
  is the data-shape guarantee behind rule 1; a silent refactor mistake could break it without
  failing a path test.
- Moves first, behavior later. One module per PR. Tests green every phase.

## Phase 0 — Map & freeze the contract (read-only)
1. Enumerate every importer of `modules/ledger` (other modules + `functions/src/index.tsx`).
2. List `ledger/index.ts`'s public surface; tag each export CORE / HYP / BILLING.
3. Audit `detectDuplicateCharges` + `validateAndConsumeLink` against **D6** (HYP/charge/link
   wording → move; pure deterministic key → may stay).
4. **Currency audit (D4):** confirm whether the current `Transaction` type / `transactionsStore`
   schema carries currency **per-account**, or whether currency is implicit/global today. If
   implicit → record it as a **schema gap for the D1/D4 track** (so it surfaces now, not when
   `balance()` is built). Read-only — no schema change in this refactor.
5. Note where **D2** (closed-period read lives inside the post transaction) must shape the core
   when the guard is later added.
6. Output: one-page "core surface" list.
**Gate:** Philip approves the core surface.

### Phase 0 — findings (read-only, complete)

**Importers of `ledger` (the surface the carve must preserve):**
| Importer | Imports | → after carve |
|---|---|---|
| `functions/src/index.tsx` | the 8 callables/subscribers (below) | re-point to `money` / `payments-hyp` / `billing` |
| `budget/subscribers/reduceDebtOnTransactionPosted` | `ledger/events`, **`ledger/internal/transactionsStore.getTransactionById`** | `money` events + `money.getTransactionById` |
| `budget/subscribers/updateProjectionsOnTransactionPosted` | `ledger/events`, **`getTransactionById` (internal)** | same |
| `orders/subscribers/markOrderPaidOnTransactionPosted` | `ledger/events` | `money` events |
| `payments/api/chargeOrder` | `ledger/services/postTransaction` | `money.post()` |

**Public-surface tags (`ledger/index.ts`):**
- **CORE → `money/`:** `TransactionSchema`, `TransactionTypeSchema`, `TransactionKindSchema`,
  `Transaction*` types; `LedgerEventTypes` + `TransactionPostedPayload`; `postTransaction` (→ `post`);
  `postManualTransaction` (generic manual journal = just `post()`); **`getTransactionById`** (read).
- **HYP → `payments-hyp/`:** `captureHypJ5`, `createHypDirectPaymentLink`, `createHypCheckoutPayment`,
  `recordHypJ5Auth`, `recordHypDirectPayment`, `getPaymentLink`; `PaymentLinkSchema`/`PaymentLink`,
  `DuplicateChargeAlertSchema`/`DuplicateChargeAlert`; services `createPaymentLink`,
  `verifyHypSignature`; internal `paymentLinksStore`.
- **BILLING → `billing/`:** `postDebitOnDeliveryNoteCreated`.

**D6 audit — both guards MOVE (Phase 2 = 10 files):**
- `detectDuplicateCharges.ts` → HYP ("after a `hyp_*` 'in' transaction", `queryHypInTransactionsByOrder`,
  logs `duplicate_charge_detected`). **Move to `payments-hyp/`.**
- `validateAndConsumeLink.ts` → payment-link domain (`consumePaymentLink`, single-use link).
  **Move to `payments-hyp/`.**

**D4 audit — currency is NOT per-account; there is no account entity:**
- `Transaction` hardcodes `currency: z.literal("ILS")` and is keyed by `payer.organizationId` +
  type/kind/direction. There is **no `account` concept**; balances are derived per-org via the
  budget `orgBalances` projection.
- **Schema gap (D1/D4 track):** D4's "one currency per account" and D1's "per-account sharded
  balance" both presume an account entity with a `currency` field that doesn't exist yet. Adding a
  2nd currency (the possible ₱ exposure) = relax `z.literal("ILS")` → enum **and** introduce an
  account (or org+type) carrying currency. **Surfaced now; no change in this refactor.**

**Two decisions for the gate:**
1. **Promote `getTransactionById` to `money`'s public surface.** Two budget subscribers already
   reach into `ledger/internal/transactionsStore` — an existing privacy-boundary breach. The carve
   should expose it as a `money` read export, and those imports route through `money/index.ts`.
2. **Route all deep imports through `money/index.ts`.** Today `orders`/`budget`/`payments` import
   `ledger/events`, `ledger/services/postTransaction`, `ledger/internal/*` directly (not via
   `index.ts`). Phase 1 repoints them to the public `money` surface (`money.post()`, `money` events,
   `money.getTransactionById`).

## Phase 1 — Carve `modules/money/`
- Move core files: `postTransaction.ts`, `transactionsStore.ts`, `paths.ts`, `events.ts`,
  `types.ts`. (`@jsdev_ninja/core` `Transaction` stays where it is.)
- Guard services per D6 decision from Phase 0.
- Keep all function/subscriber names identical; only update import paths.
- `money/index.ts` exports ONLY the Phase-0 core surface.
- **PR scope note:** Phase 1 is two mechanical things in one — the file move **and** repointing
  the existing deep imports (`budget/` two subscribers, `payments/chargeOrder`) from
  `ledger/internal|services|events` to the public `money` surface. Expect the diff to touch
  `budget/`/`payments/` import lines, not just `money/` paths. All-in-one is defensible (tests
  prove behavior unchanged). If the PR feels too wide, the clean split is: **move-only first**
  (old paths kept working via a re-export shim) → **repoint as a 2nd PR**.
**Verify:** typecheck + ledger tests green; path + event unchanged.

## Phase 2 — Extract `modules/payments-hyp/` (vendor adapter)
- Move the HYP files (8, **plus the 2 guards if Phase 0 routed them here** per D6 → 10).
  They import `money` and call `money.post()` (never write `transactions` directly).
- **Low-risk:** these files already call `postTransaction` today — Phase 2 changes only the
  import path, not the call graph. No call sites are rewired.
- Deployed function names unchanged → `apps/store` callers untouched; only
  `functions/src/index.tsx` import paths change.
**Verify:** typecheck + HYP tests green; deployed function set identical in name/signature.

## Phase 3 — Extract `modules/billing/` (feature reaction)
- Move `postDebitOnDeliveryNoteCreated`; imports `money` + the `documents` public event;
  calls `money.post()`. **Keep the subscriber name** so the dedup key is stable.
**Verify:** typecheck; still triggers on `deliveryNoteCreated`; name unchanged.

## Phase 4 — Lock it in
- Guardrail in `CLAUDE.md` / `modules/money/README.md`: "`money/` imports nothing from other
  modules; features depend on money, never the reverse; nobody writes `transactions` directly;
  corrections are reversing entries."
- **Reads stay narrow.** The `money` read surface is `getTransactionById` (by-id, returns one
  immutable fact) — **not** a general query API. No `queryTransactionsByOrg(...)` / filtered /
  business-shaped reads inside `money/`; the moment those appear you've rebuilt the budget
  projection inside the core and "money doesn't know what an org is" blurs. Business-shaped
  queries live in the budget/reporting projections, which read via the export.
- **Two CI checks** — one for each half of the law (`money` doesn't import features; features
  don't bypass `post()`):

  **Check 1 — `money/` imports nothing from other modules** (catches money → feature):
  - grep form: fail if any file under `functions/src/modules/money/` has an import matching
    `from ["'](\.\./|src/modules/|@/modules/)(?!.*\bmoney\b)` except `@jsdev_ninja/core`.
  - dependency-cruiser form:
    ```
    { name: "money-core-is-isolated", severity: "error",
      from: { path: "^functions/src/modules/money/" },
      to:   { path: "^functions/src/modules/(?!money/)",
              pathNot: "@jsdev_ninja/core" } }
    ```

  **Check 2 — nobody outside `money/` writes the `transactions` collection** (catches features
  bypassing `post()` — the invariant the structure-only check misses):
  - grep form (CI step): fail if any file **outside** `modules/money/` references the
    transactions collection path —
    `grep -rEn 'collectionName:\s*"transactions"|/transactions/' functions/src/modules --include=*.ts | grep -v '/modules/money/' | grep -v '\.test\.'`
    → non-empty = fail. (Tune the pattern to however `transactionsStore`/`paths.ts` names it.)
  - This is the rule that keeps "all movement goes through `money.post()`" true after everyone
    has moved on; the import check alone does not enforce it.
  - **Intentionally strict — flags any *reference* to the collection (read or write) outside
    `money/`.** Grep can't tell read from write, so legitimate read-only consumers must read via
    a `money` export, never the raw path. **This is already satisfied:** `money.getTransactionById`
    (+ scoped reads) is the public read path, so D5 reconciliation and any report read through it
    and never trip Check 2. If a raw read is ever genuinely needed, add an explicit allowlist
    entry with a comment.
  - The **grep form is the gate of record.** The dependency-cruiser `pathNot: "@jsdev_ninja/core"`
    on the `to` clause is likely redundant-but-harmless (the package resolves to `node_modules`,
    not `^functions/src/modules/`, so it never matches the `to` pattern) — verify against the
    real cruiser config when wiring; trust the grep.
**Gate:** Philip approves.

## Out of scope (separate tracks)
- **Account/currency schema design** — prerequisite for D1/D4. Phase 0 found no account entity
  and `currency` hardcoded `z.literal("ILS")`. A data-model project, not a function. Not started.
- **₱ / second-currency flag (the freeze's known exception).** Second-currency support is the ONE
  change that reopens the frozen `Transaction` schema (literal→enum **+** account-or-org-currency
  entity **+** per-currency `orgBalances` projection). If it moves from "possible" to "roadmap," it
  gets its own plan **before** any further money-core freezing. Flag planted now; do not scope
  until PH is actually real — nobody should freeze around `ILS` believing it's permanent.
- `balance()` / `reverse()` first-class ops (D1, D3) — later track.
- Reconciliation feature (D5) — sequenced with Track 2 (section D).
- Legacy-budget retirement (`organizationBudgets`/`budgetRecords`).
- Payment-confirmation cutover — **Track 2, section D below** (same doc).

## Risks
| Risk | Mitigation |
|---|---|
| Renaming a Cloud Function = silent delete+create | keep all `onCall`/subscriber names identical |
| Subscriber rename changes dedup key → re-fire | keep `name` strings unchanged |
| Hidden import cycle ("core" file imports a feature) | Phase-0 per-file import audit before moving |
| `transactions` path drift | path value unchanged; assert in a test |
| Transaction doc-shape drift (corrupts rule 1) | test asserts persisted `Transaction` schema unchanged across the move |
| Reviewer assumes Phase 2 rewires call sites | HYP files already call `postTransaction`; Phase 2 changes imports only, not the call graph |
| Feature bypasses `post()` and writes `transactions` directly | Phase-4 CI Check 2 fails any `transactions` write outside `modules/money/` |
| Big-bang PR | one module per PR, tests green each |

## Definition of done (Track 1)
`modules/money/` imports nothing from `modules/*`, owns `transactions` + `transaction_posted`;
all HYP code in `payments-hyp/` calling `money.post()`; delivery-note billing in `billing/`;
CI blocks money→feature imports **and** any `transactions` write outside `money/`;
zero behavior/path/event/function-name/doc-shape changes; tests green.

---

# D. Track 2 — Payment-confirmation cutover & backfill

Status: DRAFT, not started. Fixes a live prod bug.

## TL;DR

Paid orders are stuck at `status: pending` / `paymentStatus: pending_j5` because the
**storefront checkout still runs the legacy client-side payment path**, while the
**correct server-side, signature-verified, ledger-integrated path already exists and is
deployed but is never called**. The fix is primarily a **migration/cutover**, plus a
one-time **backfill** of already-paid orders. Very little net-new code.

Live evidence (prod `jsdev-stores-prod`, `balasistore_company/balasistore_store`):
`hbYRg7vlLsn3ySQcbYXI` (1,334.48 ₪) and `RgyCzLGlIVmZYglhWlfW` (3,364.08 ₪) — both
paid 2026-05-20 (HYP `CCode=0`, `errMsg=תקין`), still `pending_j5`. Also recorded in
`TODO.md` → BUGS.

## Problems

**P1 — Order status written client-side from unsigned HYP params (security + correctness).**
`OrderSuccessPage.tsx` reads `window.location.href` query params (HYP redirect) and calls
client-side `appApi.onOrderPaid(payment)` (`apps/store/src/appApi/index.ts:~1628`), which
writes the order doc directly. The HYP `Sign` is never verified — order/payment state is set
from spoofable URL params (OWASP A01/A08).

**P2 — Direct-link payment success never transitions the order to paid (THE bug).**
`onOrderPaid` hard-codes `paymentStatus: store.paymentType === "external" ? "external" :
"pending_j5"` and `status: "pending"` on **every** return — even a successful direct charge
(`CCode=0`). Nothing else flips a direct-link order to `completed` (only the J5 capture path
does). No guarded `authorized → paid` transition; the success result is ignored.

**P3 — Dual-write with no atomicity and no compensation.** `onOrderPaid` does two sequential
client writes (order doc, then `payments/{orderId}` doc). A crash between them — or an
order-write failure after money was taken — leaves money captured with no consistent order
state, and no compensation path.

**P4 — Two competing sources of truth for money.** Legacy direct payments live in
`{c}/{s}/payments/{orderId}`; the new flow records money in the ledger
`{c}/{s}/transactions`. Today they diverge — the ledger has nothing for these orders.

**P5 — Already-paid-but-pending orders need remediation (data).** At least the two orders
above; likely more. These customers **were charged**; the orders never reflected it.

Out of scope here (tracked in `TODO.md`): Firestore security-rules rewrite (the `if true`
catchall); `emit()` call-site outbox audit.

## Target flow (reuse what exists — do NOT build new)

**Direct charge:** `createHypDirectPaymentLink` (server: single-use link + HYP URL) →
customer pays on HYP → redirect → **`recordHypDirectPayment`** (server: VERIFY `Sign`,
cross-check `Masof`, post `hyp_direct` idempotent on `hyp_{Id}`, consume link) →
**`markOrderPaidOnTransactionPosted`** maps `hyp_direct → completed`.

**J5 (auth + capture):** J5 link → **`recordHypJ5Auth`** (`hyp_j5_auth` → `pending_j5`) →
admin approve → **`captureHypJ5`** (`hyp_capture` → `completed`).

All deployed under `functions/src/modules/ledger/api/` (→ `payments-hyp/` after Track 1) and
exported in `functions/src/index.tsx`. The storefront simply isn't calling them.

## Phases

**T2-Phase 0 — Discovery / confirm (no code).** Map every client call site of the legacy
path: `OrderSuccessPage`, `PayRedirectPage` (`usePayRedirectPage.ts`), `AdminOrderPageNew.tsx`
(`createPaymentRedirect`), `appApi.onOrderPaid`, `api.ts` `createPayment` /
`createPaymentRedirect` / `getPaymentRedirect`. Confirm the **direct-vs-J5 discriminator**
(store config? link-record field? `SpType`?). Decide rollout unit (per-store flag; test store
first, then balasistore).

**T2-Phase 1 — Wire storefront to the server flow (behind a per-store flag).** Replace
`createPayment` link creation with `createHypDirectPaymentLink` (direct) / the J5 link
creator. On redirect, call `recordHypDirectPayment` (or `recordHypJ5Auth`) with the HYP
params **and the link token**. Delete the client-side order/`payments` writes from
`onOrderPaid` — the order transition comes only from `markOrderPaidOnTransactionPosted`.

**T2-Phase 2 — Parity + cutover.** Test-store checkout end-to-end (success, failure,
refresh/double-submit, expired link). Verify: ledger txn written once (idempotent
`hyp_{Id}`), order → `completed`, no client status write. Then flip balasistore.

**T2-Phase 3 — Backfill stuck orders (data remediation — separate explicit approval).**
These were already charged; **no new charge** — only record the existing money fact: for each
affected order, post a `hyp_direct` transaction from its existing `payments/{orderId}` doc
via `postTransaction` (dedup `hyp_{payment.Id}`) → `markOrderPaidOnTransactionPosted →
completed`. Scope: scan balasistore for orders with `payments/{orderId}.payment.CCode==0` but
order still `pending_j5`. Dry-run list → approve → run. Idempotent, safe to re-run.

**T2-Phase 4 — Deprecate legacy path.** Remove/disable `onOrderPaid`, legacy
`createPayment`, and the `payments` status path once all stores are cut over. Keep
`payments` docs read-only for history; the ledger is the single source of truth.

## Risks & decisions needed

1. **Discriminator (direct vs J5)** must be unambiguous before T2-Phase 1 — store config,
   link-record field, or HYP `SpType`. Decide in T2-Phase 0.
2. **Backfill = recording money facts, not charging.** Confirm recording an already-captured
   HYP payment into the ledger is acceptable, and that completing these orders won't
   auto-trigger an unwanted side effect (e.g. a second delivery note / invoice). **Verify the
   order→completed subscribers before running.**
3. **No double-charge/double-record:** rely on `hyp_{Id}` dedup; never post without it.
4. **Deploy gate:** functions + store deploys need explicit approval (no auto-deploy).
5. **Other stores:** confirm pecanis (`external`) and tester (`j5`) unaffected before
   touching shared code paths.

## Sequencing & pipeline
T2-Phase 0 → review gate → Phases 1–2 on a **test store** → review gate → balasistore
cutover → review gate → Phase 3 backfill (separate explicit approval) → Phase 4 cleanup.
Per repo rules (bug + refactor): coder → code-reviewer → security-auditor → ship.
