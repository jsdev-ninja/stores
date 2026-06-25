---
sidebar_position: 3
title: Admin-created order delivered but never charged
---

# Admin-created order delivered but never charged

| | |
|---|---|
| **Store** | Balasi (balasistore) |
| **Example** | `QGKtBhmSMxjvm5kwjrjs` — Volumez — ₪3,150.88 |
| **Status** | ⚠️ Open — order delivered, **no payment ever taken** (decision needed) |

## In one line

An admin created an order through the **"create order" modal** and it was marked
**delivered**, but the **payment step was never started** — no payment link, no
charge, nothing. The money was never collected.

## What we found (every source checked)

For `QGKtBhmSMxjvm5kwjrjs`:

| Source | Result |
|---|---|
| Order | `createdBy: admin`, status `delivered` / payment `pending`, **no `paymentType`**, no amounts |
| Payment link / redirect | **never created** (`paymentRedirects` / `paymentLinks` = 0) |
| Gateway transactions | **none** (checked the full HYP export) |
| Payment doc / ledger / receipt | **none** |
| Logs | the creation day (May 6) is purged; later logs show no link generation for it |

So nothing was ever charged — and a payment was **never even initiated**.

## Root cause

The order was created via the **admin create-order modal**
(`apps/store/src/widgets/Modals/useAdminCreateOrderModal.ts`), which builds the order
**without a `paymentType`** (and without amounts), and **does not start any payment
flow**. Compare the other creation paths, which both set `paymentType`:

| Creation path | sets `paymentType`? |
|---|---|
| Customer checkout (`CheckoutPage`) | ✅ `external` or `j5` |
| Admin create-order **page** (`AdminCreateOrderPage`) | ✅ from profile/store |
| Admin create-order **modal** (`useAdminCreateOrderModal`) | ❌ **omitted** |

So an order created via the modal lands outside the payment flow. Unless someone
**separately** generates a payment link or charges the card, it ships unpaid — which
is exactly what happened here. The missing `paymentType` is the *fingerprint* of this
path, not the cause of a lost payment.

## How to tell this apart from "paid but stuck"

- **Paid but stuck:** there IS a successful gateway charge + receipt; only the order
  *status* failed to sync. → mark paid.
- **This issue (QGKt):** there is **no charge anywhere**. → genuinely unpaid; the order
  must actually be charged (or confirmed paid off-system, e.g. cash / bank transfer).

## Resolution / open

- `QGKtBhmSMxjvm5kwjrjs` is still **delivered + unpaid** — pending a decision (charge it,
  or confirm it was settled off-system).
- **Fix to consider:** make the admin create-order modal set `paymentType` (like the
  other paths) and/or run orders through a payment step, so admin-created orders can't
  silently ship unpaid.
- **Worth a sweep:** other `createdBy: admin` orders that are delivered/`pending` with no
  payment record (the same cohort).
