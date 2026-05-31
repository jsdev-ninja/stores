# Client — Complete J5 Payment (HYP)

## Feature

After the order is created (placed), the J5 flow sends the customer to HYP to
**pre-authorize** their card (J5 = auth/hold, **not** a capture/charge). On
success HYP redirects the browser back to the store. We are verifying **what,
if anything, records the J5 result back onto the order**.

> **Flow**: checkout → `createPayment` builds the HYP J5 form → browser POSTs to
> HYP (`submitHypForm`) → customer enters card on HYP → HYP runs J5 pre-auth
> (success `CCode=0`, code `700`, returns an auth code) → HYP redirects back to
> the store (success/error page). No webhook — result comes via the browser
> redirect.

## Test plan (user workflow)

1. From the order you created → on the HYP page, enter the (test/prod) card.
2. Complete the J5 authorization.
3. Observe the redirect back (success / pending / error page).

## Open question we're verifying (via logs)

- Does completing J5 **update the order** (`paymentStatus` → e.g. `pending_j5`)?
- Or is the J5 auth only **captured later** by an admin (`chargeOrder` → `action=soft` capture)?
- Which function handles the return: `getPaymentRedirect`, `createPayment`, a
  trigger, or nothing? (The clean `ledger.recordHypJ5Auth` exists but is UNWIRED,
  so the current path is legacy — logs will show the truth.)

## Expected (to confirm)

- Order doc updated with the J5 result (auth code / `paymentStatus`) — **TBD, verifying**.
- No second `order.placed` (placement already happened at creation).

## Events / subscribers

- `order.placed` already fired at creation — should **not** fire again here.
- If a paymentStatus→completed transition happens later (capture), `trackOrderPayment` runs (separate).

## Logs to check (jsdev-stores-prod, balasistore)

- `createPayment` (already ran at checkout).
- On return: `getPaymentRedirect` and/or any order update / `onOrderUpdate`.
- Any HYP verify/auth-code handling.
- Whether `paymentStatus` changes on the order.

## ⚠️ Production (balasistore)

- **Real card pre-authorization** on a live HYP terminal (J5 holds funds, does not
  capture — but it's a real auth on a real card). Use your prod test card.
