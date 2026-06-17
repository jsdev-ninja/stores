HYP
ItQnx

masof 0010302921
password hyp1234

Fake Card - 5326107300020772
CVV 033
date - 05/31

itayna@hyp.co.il תמיכה
support@hyp.co.il

\*6488

<!-- AUTH FEATURE -->

signup form - company name base on store config
allow anonymous users buy - base on store config

<!-- AUTH FEATURE END -->

TODO

BUGS (from structure audit)

- **Manual delivery-note date is silently ignored for `external` orders.** Admin opens the manual "create delivery note" modal, picks a date (e.g. June 3), clicks create — but the date is discarded and the note keeps the auto-creation date (e.g. June 4). Root cause: for `external` (cash) orders the `onOrderUpdate` trigger → `completeOrder` (`functions/src/modules/orders/services/completeOrder.ts:29`) auto-creates the delivery note on order completion by calling `appApi.documents.createDeliveryNote(order)` with **no `options.date`**, so `appApi/index.ts:119` falls to `new Date()` (= execution time, June 4). That write sets `order.deliveryNote`/`order.ezDeliveryNote`. When the admin later submits the manual modal with `options.date`, the guard at `functions/src/appApi/index.ts:110-117` sees the note already exists and **early-returns `{success:true}` without applying the new date** — so the UI shows success but nothing changes. Auto-creation always wins because it runs first. Confirmed prod (`balasistore_company/balasistore_store`) order `Q8KlTc1ZEnbiBxkKq8ZY`: auto-created EzCount doc 70088 at 2026-06-04 11:05 UTC (`new Date()`), stored `deliveryNote.date`=1780571135002 (June 4 11:05 w/ time component) + `ezDeliveryNote.calculatedData.date`="2026-06-04"; admin's manual call at 19:19 sent `options.date`=1780444800000 (June 3) and logged "createDeliveryNote skipped - already exists". NOT a failed-creation-marked-exists bug — the code only sets `deliveryNote` inside the EzCount-success branch (`appApi/index.ts:170,246`); failures (e.g. EzCount `errNum 1.3` free-doc-limit on tester_store) return `{success:false}` and leave the order unmarked. Fix decision needed: (a) suppress auto-create for `external` and require manual w/ admin date, OR (b) let manual override re-issue with the new date (note: EzCount doc already filed → would create a 2nd document), OR (c) at minimum make the modal surface "delivery note already exists (dated X)" instead of silently returning success. Secondary: even the auto path stamps `new Date()` (full timestamp incl. time) rather than a clean business-date midnight. Also note the `formatDateDDMMYYYY(date.toLocaleDateString())` round-trip at `appApi/index.ts:155,176` is locale/TZ-fragile — correct under the function's UTC env + en-US locale, but would shift a day under any negative-offset TZ.
- **Paid direct-link orders stuck `pending_j5`.** `apps/store/src/appApi/index.ts` ~L1628 `onOrderPaid()` (called by `OrderSuccessPage.tsx` after the HYP redirect) ignores `payment.CCode` and hard-codes `paymentStatus: store.paymentType === "external" ? "external" : "pending_j5"` + `status: "pending"` on EVERY return — even a successful direct charge (`CCode=0`). Nothing else flips a direct-link order to paid (only the J5 capture path `chargeOrder` → `hyp_capture` → `markOrderPaidOnTransactionPosted` sets `completed`). So genuinely-paid orders show pending and never generate a delivery note/invoice. Fix: branch on link type (direct vs J5, via `createPaymentRedirect` `isJ5` / `SpType` / store config) + `CCode` (success→ direct=`completed`, j5=`pending_j5`; failure→`failed`). Better: move server-side and verify the HYP `Sign` (currently a client write trusting unsigned URL params). Note `payment.Amount` is a shekel string written to `actual/originalAmount` (convention is integer agorot — reconcile at boundary; balasistore legacy is ILS). Confirmed prod (jsdev-stores-prod) on `balasistore_company/balasistore_store`: orders `hbYRg7vlLsn3ySQcbYXI` (1,334.48₪) and `RgyCzLGlIVmZYglhWlfW` (3,364.08₪), both paid 2026-05-20 CCode 0, still `pending_j5`. Also scan for other orders with a `payments/{orderId}` doc (CCode 0) whose order is still `pending_j5` and backfill.
- **🔴 CRITICAL — J5 admin re-charge DOUBLE-CHARGES the card.** `chargeOrder` → `hypPaymentService.chargeJ5Transaction` is NOT a one-time J5 capture: it does `getToken` → `action=soft` with `Token=True` (a **re-chargeable token charge**), so calling it twice charges the card twice. There is **no guard** against charging an order that is already paid/captured. Confirmed prod (`balasistore_company/balasistore_store`) order `XFhPL8sdzIHmPExbQrYJ`: charged at 16:13 (HYP `Id 439663003`, `CCode 0`, 36.82₪) AND again at 16:40 (HYP `Id 439673450`, `CCode 0`, 36.82₪) → **customer debited 2×36.82 = 73.64₪**, two EZcount invoices (`SendHesh=True`). Fix: `chargeOrder` must refuse if the order is already `completed`/has a successful capture (check `paymentStatus`/existing `hyp_capture` BEFORE calling HYP), and be idempotent against the real charge — not just against a duplicate ledger row.
- **🔴 CRITICAL — `onOrderPaid` REVERTS a completed/paid order back to `pending_j5`.** `apps/store/src/appApi/index.ts` ~L1628 `onOrderPaid()` (run by `OrderSuccessPage.tsx` on every load) does an UNCONDITIONAL client write of `{ status:"pending", paymentStatus: store.paymentType==="external"?"external":"pending_j5", originalAmount, actualAmount }` — no check of the order's current state, no idempotency, no `updatedAt`. So re-opening / re-rendering / back-button to the `/orderSuccess?...` URL (it still holds the HYP params) re-fires it and **clobbers an already-`completed` order back to `pending/pending_j5`**. Confirmed prod order `XFhPL8sdzIHmPExbQrYJ`: completed at 16:13, reverted at 16:29:07 (audit diff `paymentStatus completed→pending_j5`, `status completed→pending`, `updatedAt` unchanged = stale write). This revert is what made the order look unpaid and enabled the double-charge above. Minimum fix: `onOrderPaid` must no-op if the order is already `completed`/paid; real fix: server-side `onRequest` confirmation (see `docs/plans/money-core.md` Track 2). Related to the "paid direct-link orders stuck `pending_j5`" entry above (same function).
- **🟠 Ledger dedup keyed on the AUTH id MASKS a real second charge + leaves status inconsistent.** `chargeOrder` posts `hyp_capture` with `hypTransactionId = payments/{orderId}.payment.Id` = the **auth** id (stable across re-charges), so a genuine second HYP charge dedups to the same `hyp_{authId}` → second `postTransaction` hits `ALREADY_EXISTS` and **no-ops**. Effects on `XFhPL8sdzIHmPExbQrYJ`: (a) the real 2nd charge `439673450` is **NOT in the ledger** (books show 36.82, card paid 73.64); (b) because the write no-op'd it **didn't emit `transaction_posted`** → `markOrderPaidOnTransactionPosted` never ran → `paymentStatus` stuck at `pending_j5` while `status=completed`. Dedup should be keyed on the actual HYP charge `Id` (or the capture should be a true single-capture), and the "already captured" case should be detected before charging, not silently swallowed.
- **Remediation owed for `XFhPL8sdzIHmPExbQrYJ`:** refund/cancel the duplicate HYP charge `439673450` (36.82₪; same-day → `CancelTrans` before settlement avoids the fee), then correct the order to `status: completed` / `paymentStatus: completed` (`lastPaymentTransactionId: hyp_439660424`). Money: 1 real sale 36.82, 1 erroneous duplicate 36.82 to reverse.
- `createCompany.ts:28` writes to collection `"profile"` (singular). Everywhere else is `"profiles"`. Unify to `"profiles"`. Check for existing docs under `profile/` before renaming.
- `organizations/{orgId}/actions` is top-level (no company/store prefix). Should be `{companyId}/{storeId}/organizations/{orgId}/actions` so rules can enforce store isolation. Currently any store could read another store's org actions if it guessed the orgId.
- **🟡 `postManualTransaction` lacks tenant-ownership check for `reference.type === "order"`.** The `"invoice"` branch was secured during the customer-debts/recordInvoicePayment work (`functions/src/modules/ledger/api/postManualTransaction.ts` — `verifyInvoiceBelongsToTenant`), but the older `"order"` branch still trusts the client-supplied `reference.id` without verifying the referenced order belongs to the caller's `companyId`/`storeId`. Theoretical IDOR — an admin who knows another store's order id could post a manual transaction against it. Low practical risk (requires guessing or harvesting an order id from another tenant + admin claim) but real. Fix: add `verifyOrderBelongsToTenant(orderId, companyId, storeId)` mirroring the invoice check, before posting. Deferred from the customer-debts iteration to keep scope tight.

## Refactor: drop `status: "draft"` from new orders

**Goal:** checkout should create orders with `status: "pending"` instead of `"draft"`. The `paymentStatus` field already carries the "paid / not paid" signal — `status` should be the fulfillment lifecycle, not the payment state. Today the two are entangled (a `draft` order = "not paid yet"), which is what we're untangling.

**Why deferred:** can't be done as a 1-line change. Multiple downstream consumers gate behavior on `status === "draft"` and will misbehave if checkout creates `pending` while the rest still expects `draft`. Confirmed during research session.

**Required changes (don't ship piecemeal):**

1. `apps/store/src/pages/store/CheckoutPage/CheckoutPage.tsx:193` — change `status: "draft"` → `status: "pending"`
2. `apps/store/src/widgets/Modals/OrderDetailsModal.tsx:217` — **Approve** button currently shows for any `status === "pending"`. After the change, unpaid orders are also pending, so add `paymentStatus === "completed"` (or whatever the paid state is) to the gate, otherwise admins can approve unpaid orders → delivery note → accrued AR for goods the customer never paid for.
3. `apps/store/src/widgets/Modals/OrderDetailsModal.tsx:232` — **Create payment link** button currently gates on `status === "draft"`. Switch to `paymentStatus === "pending"` so the link can still be sent to a customer who placed an order but didn't finish paying.
4. `apps/store/src/widgets/Modals/OrderDetailsModal.tsx:194-198` — **Edit** button check `status === "pending" || status === "draft"` simplifies to `status === "pending"` (still covers both cases since drafts won't exist for new orders).
5. `functions/src/modules/orders/subscribers/markOrderPaidOnTransactionPosted.ts:167` — `promoteDraft` branch becomes dead for new orders but **keep it** to migrate historical draft orders that come in via payment. Add a comment that it's a legacy-data migration path.
6. `apps/store/src/pages/admin/Orders/AdminOrdersPage.tsx:63,67` + `apps/store/src/pages/admin/AdminHomePage/index.tsx:29` — `ACTIVE_STATUSES` includes `"draft"`. Keep it to surface historical drafts; once they're all migrated, remove `"draft"` and clean up the schema enum too.
7. `apps/store/src/domains/Order/index.ts:26` — filter `status == "draft" && paymentStatus === "pending"` — re-think; probably becomes `paymentStatus === "pending"` alone.

**Historical `draft` orders in production:**
- Do NOT backfill — leave them as `draft`. The promote-on-payment logic in step 5 handles them naturally if they ever get paid. The Edit / Create-payment-link buttons still work because their guards include `draft`.
- Eventually (months later, after the population is small) consider a one-shot backfill + drop `"draft"` from the `OrderSchema` enum.

**Scope NOT touched:**
- `cart.status` — has its own `"active" | "draft" | "completed"` enum, different concept (a cart in the middle of editing vs a placed order)
- `SupplierInvoice.status` — `"draft" | "completed"` is the supplier-invoice WIP/finalized state, unrelated to orders
- Schema enum on `OrderSchema.status` — keep `"draft"` in the union for historical reads

## Auth & tenant docs — open questions to confirm

The `apps/docs/docs/architecture/auth.md` page was written based on code reading; the following claims need owner confirmation before the doc can be marked authoritative:

1. **Customer tenant resolution.** Doc claims that for customer-facing callables (e.g. `recordHypDirectPayment`), the backend derives `companyId`/`storeId` from the entity (e.g. the order doc) rather than from `request.data` or token claims (customers have none). Confirm this is the canonical pattern; flag any customer-facing endpoints that still accept `companyId`/`storeId` in the payload.
2. **Anonymous → email signup.** Doc claims `linkWithCredential` preserves the `uid` and therefore the cart. Confirm whether the `tenantId` binding is also preserved automatically, or whether re-binding is needed after linking. Any known edge cases.
3. **One-store-per-admin.** Doc claims admins are scoped to exactly one `(companyId, storeId)` because custom claims hold a single tuple, and cross-store access requires a second user under that store's Firebase tenant. Confirm this is intentional, not a TODO.
4. **Roles beyond `admin: true`.** Doc lists only the binary admin flag. Confirm there are no other roles in use (manager, viewer, owner, support) today, and whether any are planned.
5. **"VERIFY-gated" as a third auth category.** Doc classifies `recordHypJ5Auth`/`recordHypDirectPayment` as a category distinct from admin-only and customer-owned-entity, because the integrity check is the HYP VERIFY round-trip, not a token claim or strict entity ownership. Confirm the framing is right, or whether they should be folded into "customer-owned-entity with an extra integrity check."
6. **Admin `TProfile` document.** Doc is silent on whether admin users get a `TProfile` doc at `{companyId}/{storeId}/profiles/{uid}` like customers do, or whether admins exist only as Firebase Auth accounts within the store's tenant. Confirm and add to the doc.

Update `apps/docs/docs/architecture/auth.md` once answers are in.

EVENT BUS FOLLOWUPS

- Event Bus: add dead-letter pattern with max-attempt tracking. Current `retry: true` retries for 7 days on permanent errors.
- Event Bus: establish central event-type registry (const or zod union) before second emitter lands — prevents `order.placed` vs `orderPlaced` drift.
- Once order email + cart-close move to subscribers (Phase 3+), change `onOrderCreated` and `onOrderUpdate` to rethrow on emit failure so Firebase retries. Currently swallowed to avoid double-email / double-cart-close.

FUTURE (OUT OF SCOPE, GOOD IDEAS)

- **Hook registry** (`integration/hooks`) — synchronous extension points, handlers registered at named hook points like `order.before_create`, `order.after_create`, `order.calculate_shipping`. Unlike events (async), hooks run inline in the caller's flow. Useful when 2+ places want to inject behavior at the same moment, or for per-tenant customization (post-sandbox). Skip until there's a concrete "I need N handlers at this point" need — otherwise premature abstraction. Requires: in-memory `registerHook`/`runHook` + cold-start bootstrap that re-registers first-party hooks on every Cloud Function instance.
- Platform: add `SchemaValidationError` class used by `emit` and `audit.record` in place of raw `ZodError`. Thrown when envelope/payload fails zod validation. Non-retryable signal.
- Platform: max 3 retries for subscribers across the board. Implementation: `subscribe.ts` wraps every handler in a try/catch that (a) skips retry entirely when caught error is `SchemaValidationError`, (b) bumps a per-(subscriber, event) attempt counter at `{companyId}/{storeId}/_subscriber_attempts/{subscriberName}__{eventId}`, (c) stops retrying once attempts > 3. Handlers never see this — platform logic only.

FIRESTORE RULES REWRITE (dedicated project, do separately from refactor)

- Current `firestore.rules` starts with `match /{document=**} { allow read, write: if true; }` — effectively wide open. All isolation today is via Cloud Functions only (admin SDK bypasses rules).
- Fix in its own dedicated phase after event bus lands. Per-collection rules scoped by `{companyId}/{storeId}`, `request.auth.token.companyId`/`storeId`, plus admin/superAdmin custom claims.
- When event bus ships: add deny rule for `{companyId}/{storeId}/events/{id}` so clients can't read events (backend admin SDK still writes unaffected).
- Audit every collection that today relies on the `if true` catchall — each needs a specific rule.

0. HYP: send `EZ.customer_crn` when order total > 5,000 ILS (required by Israeli law per HYP docs). Pull from `order.client.companyNumber` or equivalent.
1. add active discounts to order object
2. add super admin for every store
3. client handle order that created and not paid !!
4. checkout loading state
5. checkout save user address if not exits
6. fix laoding state appAPi
7. save charges by admin (after j5)
8. admin manage clients page
9. fetch orders per client id
10.   handle admin charge in DB
11.   track any entity update with diff before and after
12.   fix email
13.   fix sync data between order and payments (user can edit data on payment)
14.   clean products when remove category
15.   store backend validation for cart cost and order
16. client history

<!-- payment types -->
1. j5
2. external
<!-- payment types end -->

<!-- by brand by category -->

<!-- minimum order price -->

<!-- select delivery date (max 2 weeks) select hours -->

<!-- company discount (exclude products) -->
<!-- new product field can be discound -->

ORDER FLOW

1. user create order status draft ,paymentStatus pending (cart completed)
2. user pay j5 transaction, order status pending, paymentStatus pending_j5
3. admin charge payment, order status completed, paymentStatus completed

HANDLE DOUBLE ORDER PAYMENT!!!

Order created -> pending

Order Paid -> send email to store owner

every store choose his benefits/services

features

1. products

-  product listing and filter
-  product details

2. cart

-  view cart
-  update cart
-  multiple cart

3. checkout

4. user account

-  login logout register
-  manage profile

5. orders

-  create order
-  track order
-  manage order

1. sort orders by date created

cart page:
  - [ ] Fix pricing logic bug in `CartItem.tsx` (ensure total price calculates using final discounted/VAT price instead of raw `product.price * amount`).
  - [ ] Format and declutter prices: show total price prominently, and only display unit price breakdown as subtext (e.g. `(₪13.50 ליחידה)`) when quantity > 1.
  - [ ] Add direct "Remove" button (trash can icon using `Trash2` from `lucide-react`) next to the price in `CartItem.tsx` for quick removal.
  - [ ] Implement a premium empty state: when the cart has 0 items, hide the order summary card and show a beautifully styled empty state (shopping bag icon, Hebrew message, and a "Back to Shop" button).
  - [ ] Improve layout and visual styling: use elevated cards (`rounded-xl`, soft borders, hover shadow) and optimize for clean RTL representation on both mobile and desktop.
checkout page
catalog page

1. handle product update/delete by admin when product already in cart
2. allow edit order items by admin and client
3. make sure products in cart and order price are final.
4. handle function deploy from ci cd, fix deploy fail.

entities

company ->
shop ->
category ->
product ->
cart ->
order ->
payment ->
user -> shop admin | shop member | client

product brand

ADMIN ACTIONS

product - create edit delete
category - create edit delete
order - decline accept complete

USER ACTIONS

-  add item to cart
-  remove item from cart
-  clear cart
-  order
-  create order from cart history
-  register, login, logout, reset password, forgot password

EMAILS

1. order create - send email to admin and client
2. order stutus changed - send email to client and admin

client create order
client pay order
store accept order
store deliver order

todo:

-  react lazy loading pages
-  on user delete -> remove cart

remove category - find all children and clean all products
move category - find all children and update all products

discount ->

discount type - per product | per category | per store | special
isActive
minOrder
expirationDate
