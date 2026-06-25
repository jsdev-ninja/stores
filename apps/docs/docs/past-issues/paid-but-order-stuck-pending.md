---
sidebar_position: 2
title: Order paid at the gateway but stuck on "pending"
---

# Order paid at the gateway but stuck on "pending"

| | |
|---|---|
| **Store** | Balasi (balasistore) |
| **Affected customers** | Volumez **and** Dentsu — **not customer-specific** |
| **Status** | ✅ Root cause found · band-aid fix written (not yet deployed) · all known orders reconciled by hand |
| **Found so far** | **7 orders · ₪12,569.39** |

## In one line

A card payment **succeeds** at the gateway (the customer even gets a receipt), but
the order keeps showing as **unpaid** (`pending_j5`) — because the code path that
recorded the payment never told the order it was paid.

> Different from the [duplicate-draft issue](./order-looked-unpaid-but-was-paid.md):
> there the money sat on a *sibling* order; here the money is on *this* order, but
> its status never updated.

## The symptom

For each affected order:
- gateway shows the charge **approved** (receipt issued), but
- the order is stuck at `status: completed/delivered` + **`paymentStatus: pending_j5`**, and
- there is **no ledger transaction** for it.

## Root cause (the real find)

Recording a payment result is **mid-migration between two places**:

- **Old (client / browser):** after the gateway redirect, the browser writes the
  order + payment doc directly. It sets `paymentStatus: "pending_j5"` and saves the
  payment record, but **posts no ledger transaction**.
- **New (server / Cloud Function):** re-verifies the gateway signature and **posts a
  ledger transaction**; a subscriber (`markOrderPaidOnTransactionPosted`) then flips
  the order to `completed`.

The **only** code that sets `paymentStatus: "completed"` is that subscriber, and it
**only runs when a ledger transaction is posted**. Direct / admin-payment-link
charges still go through the **old client path**, which posts no transaction → the
order is stranded at `pending_j5` even though the card was charged.

(Secondary, same class of bug: the server J5 recorder always logged an "authorization"
even when the result was a real charge — which also maps to `pending_j5`.)

**Why two places at all:** the team is moving payment recording from client →
server (server re-verifies + is the single source of truth via the ledger). The J5
path was migrated; the **direct / admin-link path was not** — the "#2 cutover" was
never finished, so the legacy client write is still live.

## Known occurrences (all reconciled to paid)

| Order | Customer | Charged | Amount |
|---|---|---|---|
| `314oTtPvzxhZKPM9QwGE` | Volumez | 13 Apr 2026 | ₪1,640.72 |
| `TM8bY48dLoMXpMuJvYUm` | Volumez | 13 Apr 2026 | ₪2,939.92 |
| `aY5a0S5XBzIA6FuPGKwy` | Volumez | 26 Feb 2026 | ₪503.16 |
| `GAvwJI1kBb5RdbBzJNXt` | Volumez | 20 Apr 2026 | ₪1,948.25 |
| `RgyCzLGlIVmZYglhWlfW` | Volumez | 20 May 2026 | ₪3,364.08 |
| `hbYRg7vlLsn3ySQcbYXI` | Volumez | 20 May 2026 | ₪1,334.48 |
| `GRlvqL0yd3aEz9toBXJ6` | **Dentsu** | 24 Jun 2026 | ₪838.78 |

Each was confirmed paid at the gateway (receipt issued) and then manually set to
`paymentStatus: completed`.

## The fix

**Band-aid (written, not committed)** — corrects the order status on both live paths:
- `apps/store/src/appApi/index.ts` (`onOrderPaid` legacy fallback): when the result is
  actually charged (`CCode === "0"`), set `paymentStatus: "completed"` instead of
  `pending_j5`.
- `functions/src/modules/ledger/api/recordHypJ5Auth.ts`: a `CCode "0"` result posts a
  `hyp_direct` transaction (→ `completed`) instead of `hyp_j5_auth` (→ `pending_j5`).

**Proper fix (future):** finish the cutover — route direct / admin-link payments
through the existing server handler `recordHypDirectPayment` (verifies + posts the
ledger transaction), then delete the legacy client write. One place, no bug.

## Still open / worth watching

- The **band-aid fixes only the order status, not the ledger** — these charges still
  have no ledger transaction, so they won't appear in revenue/ledger reports until a
  backfill is done (deferred).
- The fix is **not deployed** — until it is, newly-charged direct/admin-link orders can
  still get stuck. A periodic sweep for `pending_j5` orders that have a successful
  (receipt-issued) charge will catch any new ones.
