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

- `createCompany.ts:28` writes to collection `"profile"` (singular). Everywhere else is `"profiles"`. Unify to `"profiles"`. Check for existing docs under `profile/` before renaming.
- `organizations/{orgId}/actions` is top-level (no company/store prefix). Should be `{companyId}/{storeId}/organizations/{orgId}/actions` so rules can enforce store isolation. Currently any store could read another store's org actions if it guessed the orgId.

EVENT BUS FOLLOWUPS

- Event Bus: add dead-letter pattern with max-attempt tracking. Current `retry: true` retries for 7 days on permanent errors.
- Event Bus: establish central event-type registry (const or zod union) before second emitter lands — prevents `order.placed` vs `orderPlaced` drift.
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

cart page  
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
