# 🏗️ Backend Module Structure Findings

Compliance audit against the **"Backend module structure"** section in [`CLAUDE.md`](../../../CLAUDE.md). The rules exist to keep entry points thin, module boundaries enforced, and Firestore paths consistent across tenants.

Of 14 modules audited:
- ✅ Fully compliant: `catalog`, `ledger` (mostly)
- ⚠️ Partial: `budget`, `orders`
- ❌ Heavily non-compliant: `payments`, `documents`, `customers`, `auth`, `suppliers`, `notifications`, `chatbot`, `application`, `analytics`, `cart`

---

## SBE-01 🟠 Cross-module reach into `internal/` — explicit boundary violation

**File:** [`functions/src/modules/budget/subscribers/reduceDebtOnTransactionPosted.ts:7`](../../../functions/src/modules/budget/subscribers/reduceDebtOnTransactionPosted.ts)

```ts
import { getTransactionById } from "../../ledger/internal/transactionsStore";
```

CLAUDE.md: *"`internal/` is module-private. Never import it from another module. Cross-module use goes through the target module's `index.ts` (or its public `events.ts`)."*

**Fix**

Export `getTransactionById` from `ledger/index.ts`:

```ts
// ledger/index.ts
export { getTransactionById } from "./internal/transactionsStore";
```

Then import as:

```ts
import { getTransactionById } from "../../ledger";
```

---

## SBE-02 🟠 Cross-module reach into `services/`

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:6`](../../../functions/src/modules/payments/api/chargeOrder.ts)

```ts
import { postTransaction } from "../../ledger/services/postTransaction";
```

`services/` is module-private. Public surface is `ledger/index.ts`.

**Fix**

```ts
// ledger/index.ts
export { postTransaction } from "./services/postTransaction";

// payments/api/chargeOrder.ts
import { postTransaction } from "../../ledger";
```

---

## SBE-03 🟠 `emit*.ts` wrapper files — explicitly forbidden

CLAUDE.md: *"No `emit*.ts` wrapper files anywhere. Always inline `emitEvent` at the call site."*

**Files:**
- [`functions/src/modules/payments/internal/emitPaymentReceived.ts`](../../../functions/src/modules/payments/internal/emitPaymentReceived.ts)
- [`functions/src/modules/documents/internal/emitDeliveryNoteCreated.ts`](../../../functions/src/modules/documents/internal/emitDeliveryNoteCreated.ts)

Both are just `async function emit*() { await emitEvent(...) }`.

**Fix**

1. Find all call sites of `emitPaymentReceived` / `emitDeliveryNoteCreated`
2. Inline the `emitEvent(...)` call at each one
3. Delete the wrapper files

---

## SBE-04 🟠 Emit-only "service" files in `orders/` — same rule

CLAUDE.md: *"A 'service' that is only an `emitEvent` wrapper does NOT qualify."*

**Files:**
- [`functions/src/modules/orders/services/cancelOrder.ts`](../../../functions/src/modules/orders/services/cancelOrder.ts) — body is `logger.info(...); await emitEvent(...)`
- [`functions/src/modules/orders/services/refundOrder.ts`](../../../functions/src/modules/orders/services/refundOrder.ts) — same pattern

The orders README itself says: *"wrapping a single emit in a 'service' is the anti-pattern we explicitly exclude"* — but these files violate that exact rule.

**Fix**

Inline `emitEvent` in `onOrderUpdate.ts` for the `cancelled` and `refunded` branches; delete these "service" files.

---

## SBE-05 🟠 Root collections used for tenant data

CLAUDE.md: *"All tenant-scoped data lives under `{companyId}/{storeId}/{collectionName}` — never use a root collection."*

Documented exceptions: `STORES/{storeId}`, `STORES/{storeId}/private`.

**Violations:**

| Collection | File | Fix |
|---|---|---|
| `paymentRedirects` | [`payments/api/createPaymentRedirect.ts:118`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts), [`getPaymentRedirect.ts:17`](../../../functions/src/modules/payments/api/getPaymentRedirect.ts) | Move under `{companyId}/{storeId}/paymentRedirects/`. For lookup-by-token without tenant context, use `db.collectionGroup("paymentRedirects").where("token","==",token).limit(1)` |
| `landingLeads` | [`notifications/triggers/landingLead.tsx:10`](../../../functions/src/modules/notifications/triggers/landingLead.tsx) | Move trigger path to `{companyId}/{storeId}/landingLeads/{id}` |
| `profile` (singular) | [`customers/api/createCompany.ts:28`](../../../functions/src/modules/customers/api/createCompany.ts) | Move to tenant-scoped + fix plural/singular inconsistency |
| `profiles` (plural) | [`customers/internal/profileService.ts:6`](../../../functions/src/modules/customers/internal/profileService.ts) | Same |
| `companies`, `stores` | [`application/api/init.ts:12, 26`](../../../functions/src/modules/application/api/init.ts) | This may be intentional architecture (origin → tenant resolver). Either document explicitly as an exception in CLAUDE.md, or migrate to `collectionGroup` queries |
| `organizations` | [`api/organizationActionsApi.ts`](../../../functions/src/api/organizationActionsApi.ts) | Move under tenant; see [SEC-11](01-critical-security.md#sec-11) |

**Note:** The plural/singular bug — `createCompany.ts` writes `profile/{uid}` while `profileService.ts` reads `profiles/{uid}` — is a separate consistency bug regardless of the path fix.

---

## SBE-06 🟠 Hand-built Firestore paths instead of `FirebaseAPI.firestore.getPath`

CLAUDE.md: *"Build with `FirebaseAPI.firestore.getPath({ collectionName, companyId, storeId })` — never hand-build a path."*

**Violations:**

| File | Line | What |
|---|---|---|
| `budget/internal/paths.ts` | 85, 99, 103, 112 | `budgetTransactionsCollectionPath`, `budgetRollupsCollectionPath`, `budgetRollupPath`, `budgetIdempotencyPath` — all hand-built template strings |
| `budget/services/applyBudgetEvent.ts` | 58-60 | `db.collection(\`${companyId}/${storeId}/budgetRecords\`)` — should use the imported `budgetRecordsCollectionPath` |
| `notifications/subscribers/orderPlacedAdminEmail.tsx` | 21 | `db.doc(\`${ctx.companyId}/${ctx.storeId}/orders/${event.payload.orderId}\`)` |
| `customers/api/migrateProfiles.ts` | 21 | `db.collection(\`${companyId}/${storeId}/profiles\`)` |

**Fix**

Add missing collections to `storeCollections` in `packages/core/lib/firebase-api/index.ts` (`budgetIdempotency`, `budgetRollups`, `budgetTransactions`, `budgetRecords`, `profiles`), then route all reads/writes through `FirebaseAPI.firestore.getPath({ collectionName, companyId, storeId, id? })`.

---

## SBE-07 🟠 Multiple Cloud Functions / triggers / subscribers in one file

CLAUDE.md: *"`api/` — one file per Cloud Function endpoint. `triggers/` — one trigger per file. `subscribers/` — one subscription per file."*

**Violations:**

| File | Contains | Split into |
|---|---|---|
| [`budget/api/budgetApi.ts`](../../../functions/src/modules/budget/api/budgetApi.ts) | 5 callables: `getBudgetAccount`, `listBudgetAccounts`, `getBudgetTransactions`, `markOrderPaid`, `addBudgetManualTransaction` | 5 files, each named after the callable |
| [`budget/subscribers/reduceDebtOnOrderReversed.ts`](../../../functions/src/modules/budget/subscribers/reduceDebtOnOrderReversed.ts) | 2 subscribers: `reduceDebtOnOrderCancelled`, `reduceDebtOnOrderRefunded` | 2 files; shared `handleOrderReversed` goes to `internal/` or a shared service |
| [`catalog/triggers/product.ts`](../../../functions/src/modules/catalog/triggers/product.ts) | 3 triggers: `onProductCreate`, `onProductDelete`, `onProductUpdate` | 3 files, one per trigger |

---

## SBE-08 🟡 Generic/layered filenames

CLAUDE.md: *"No generic/layered file names like `lifecycle.ts`, `writer.ts`, `service.ts`, `repository.ts`. Name files by what they DO (the operation), not the layer they live in."*

**Violations:**

| File | Rename to |
|---|---|
| `budget/api/budgetApi.ts` | (split — see SBE-07) |
| `chatbot/api/chatbotApi.ts` | `sendChatMessage.ts` (or whatever operation it performs) |
| `application/api/init.ts` | `appInit.ts` (function name = file name = export name) |
| `analytics/api/mixpanelData.ts` | `getMixpanelData.ts` (also wrong folder — see SBE-09) |
| `customers/internal/profileService.ts` | Either `profilesStore.ts` (if data access) or move the operation to `services/deleteProfile.ts` |
| `auth/triggers/user.ts` | `onUserDelete.ts` |
| `suppliers/triggers/supplierInvoice.ts` | `onSupplierInvoiceCreate.ts` |
| `notifications/triggers/contactFormSubmission.tsx` | `onContactFormSubmit.tsx` |
| `notifications/triggers/landingLead.tsx` | `onLandingLeadCreated.tsx` |

---

## SBE-09 🟡 Wrong folder — `pubsub.schedule` should be in `triggers/`

**File:** [`functions/src/modules/analytics/api/mixpanelData.ts`](../../../functions/src/modules/analytics/api/mixpanelData.ts)

The function is `functions.pubsub.schedule("every 1 hours").onRun(...)`. CLAUDE.md: *"triggers/ — Firestore doc triggers, scheduled jobs, pub/sub"*. The schedule is a trigger, not an api endpoint.

**Fix**

Move to `analytics/triggers/pollMixpanelSchedule.ts`.

---

## SBE-10 🟡 Subscriber export names reversed from filenames

CLAUDE.md: *"subscribers/ — one subscription per file, filename = `{verb}On{EventName}`."*

The exported constant should match.

**Violations:**

| File | Export name | Should be |
|---|---|---|
| [`orders/subscribers/markOrderPaidOnTransactionPosted.ts:43`](../../../functions/src/modules/orders/subscribers/markOrderPaidOnTransactionPosted.ts) | `onTransactionPostedMarkOrderPaid` | `markOrderPaidOnTransactionPosted` |
| [`cart/subscribers/closeCartOnOrderPlaced.ts:6`](../../../functions/src/modules/cart/subscribers/closeCartOnOrderPlaced.ts) | `onOrderPlacedCloseCart` | `closeCartOnOrderPlaced` |

Also update the corresponding `index.ts` imports.

---

## SBE-11 🟡 Thick API entry points — business logic in `api/` files

CLAUDE.md: *"Triggers / api / subscribers are THIN — parse input, call a service, return. No business logic in entry points."*

**Violations (~100-230 lines of inline business logic in each):**

| File | Logic to extract |
|---|---|
| [`payments/api/createPayment.ts`](../../../functions/src/modules/payments/api/createPayment.ts) | Item building, VAT math → `services/buildHypItems.ts`, `services/createPayment.ts` |
| [`payments/api/createPaymentRedirect.ts`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts) | `fitAmountToItemsSum` (duplicated 4×), HYP form generation → `services/createPaymentRedirect.ts` |
| [`payments/api/chargeOrder.ts`](../../../functions/src/modules/payments/api/chargeOrder.ts) | Amount math, ledger write orchestration → `services/chargeOrder.ts` |
| [`ledger/api/captureHypJ5.ts`](../../../functions/src/modules/ledger/api/captureHypJ5.ts) | Capture-check logic, HYP call orchestration → `services/captureHypJ5.ts` |
| [`ledger/api/createHypCheckoutPayment.ts`](../../../functions/src/modules/ledger/api/createHypCheckoutPayment.ts) | heshDesc builder, VAT math → `services/createCheckoutPaymentLink.ts` |
| [`ledger/api/recordHypDirectPayment.ts`](../../../functions/src/modules/ledger/api/recordHypDirectPayment.ts) | Signature verify, link lookup, payer resolution → `services/recordHypDirectPaymentResult.ts` |
| [`ledger/api/recordHypJ5Auth.ts`](../../../functions/src/modules/ledger/api/recordHypJ5Auth.ts) | VERIFY, masof check, amount conversion → `services/recordHypJ5AuthResult.ts` |
| [`documents/api/createInvoice.ts`](../../../functions/src/modules/documents/api/createInvoice.ts) | ezCount call orchestration → `services/createInvoice.ts` |
| [`suppliers/triggers/supplierInvoice.ts`](../../../functions/src/modules/suppliers/triggers/supplierInvoice.ts) | Product batch update logic → `services/applySupplierInvoiceProductUpdates.ts` |
| [`notifications/triggers/contactFormSubmission.tsx`](../../../functions/src/modules/notifications/triggers/contactFormSubmission.tsx) | React Email rendering + email send → `services/notifyContactFormSubmitted.ts` |
| [`notifications/triggers/landingLead.tsx`](../../../functions/src/modules/notifications/triggers/landingLead.tsx) | Same pattern → `services/notifyLandingLeadCreated.ts` |

The `fitAmountToItemsSum` helper is duplicated across 4 files — extract to a single `services/buildHypItems.ts` shared between modules (or live in `ledger/` since it's HYP-specific).

---

## SBE-12 🟡 `console.log` instead of `firebase-functions/v2` logger

CLAUDE.md: *"Use `firebase-functions/v2` `logger` with structured fields. No `console.log`."*

**Files (25+ occurrences):**

- `appApi/index.ts:247`
- `modules/customers/api/createCompany.ts:8-9`
- `modules/payments/api/createPaymentRedirect.ts:37-38, 43, 70, 108, 133, 137`
- `modules/payments/api/getPaymentRedirect.ts:41`
- `modules/auth/triggers/user.ts:5, 8, 10`
- `modules/suppliers/triggers/supplierInvoice.ts:25`
- `modules/application/api/init.ts:6, 18, 32`
- `modules/documents/api/createInvoice.ts:127`
- `modules/analytics/api/mixpanelData.ts:25, 70, 76`
- `services/ezCountService/index.ts:253, 257`

**Fix**

```ts
import { logger } from "firebase-functions/v2";
// before
console.log("create invoice res", JSON.stringify(res));
// after
logger.info("createInvoice: ezcount response received", { orderId, status: res.data?.status });
```

Pay attention to:
- Several `JSON.stringify(data)` dumps include PII / credentials → drop the dump, log only the structured fields you need
- See [SEC-05](01-critical-security.md#sec-05) and [SEC-06](01-critical-security.md#sec-06) for the security-critical instances

---

## SBE-13 ⚪ Empty `internal/` directory in `orders/`

**Path:** [`functions/src/modules/orders/internal/`](../../../functions/src/modules/orders/internal/)

The README mentions `internal/placedTargets.ts` was removed. The empty directory remains.

**Fix**

```bash
rmdir functions/src/modules/orders/internal
```

---

## SBE-14 ⚪ Missing `README.md` in 11 of 14 modules

CLAUDE.md says each module should have a `README.md`. Only `catalog/`, `ledger/`, and `orders/` have one.

**Missing in:**
- `budget/`
- `payments/`
- `documents/`
- `customers/`
- `auth/`
- `suppliers/`
- `notifications/`
- `chatbot/`
- `application/`
- `analytics/`
- `cart/`

**Fix — README template**

```md
# {moduleName}

## Purpose
One sentence on what this module owns.

## Owned Firestore paths
- `{companyId}/{storeId}/{collectionName}`
- ...

## Public surface (`index.ts`)
- Cloud Functions: ...
- Events emitted: ...
- Subscribers: ...
- Triggers: ...

## Conventions
Anything module-specific (e.g. "all writes go through `postTransaction`").

## Cross-module dependencies
- Consumes events from: ...
- Calls public surface of: ...
```

Use `ledger/README.md` and `orders/README.md` as reference.

---

## SBE-15 ⚪ Missing `services/` folder despite logic in api/triggers

The following modules have business logic in their entry points but no `services/` folder:
- `payments/`
- `documents/`
- `customers/`
- `suppliers/`
- `notifications/`
- `chatbot/`
- `application/`
- `analytics/`

Adding `services/` is the precondition for fixing [SBE-11](#sbe-11).

---

## Quick-reference: cross-cutting violation map

| Concern | Modules affected |
|---|---|
| `emit*.ts` wrappers | payments, documents |
| Emit-only "services" | orders |
| Cross-module `internal/` reach | budget → ledger |
| Cross-module `services/` reach | payments → ledger |
| Multiple functions per file | budget/api, budget/subscribers, catalog/triggers |
| Generic / noun-named files | auth, suppliers, notifications, catalog, budget, chatbot, application, analytics, customers |
| `console.log` instead of `logger` | auth, customers, payments, documents, suppliers, application, analytics, ezCountService |
| Secrets logged | payments/createPaymentRedirect, hypPaymentService, ezCountService, appApi |
| Hand-built or root-collection Firestore paths | budget, payments, customers, application, notifications |
| Subscriber export names reversed | orders, cart |
| Missing README.md | 11 modules |
