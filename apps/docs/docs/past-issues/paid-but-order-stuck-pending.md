---
sidebar_position: 2
title: Order paid at the gateway but stuck on "pending"
---

# Order paid at the gateway but stuck on "pending"

| | |
|---|---|
| **Store** | Balasi (balasistore) |
| **Customer** | Volumez — דנה קונין |
| **When** | Charged 13 Apr 2026 · reconciled 24 Jun 2026 |
| **Status** | ✅ Fixed — both orders manually marked paid (ledger backfill still open) |

## In one line

Two orders were **charged successfully** at the payment provider (the customer even
got a receipt), but the orders kept showing as **unpaid** in the system. We
manually corrected their status.

> This is a **different** problem from the
> [duplicate-draft issue](./order-looked-unpaid-but-was-paid.md). There the money
> was on a *sibling* order; here the money is on *this* order, but its status never
> updated.

## What went wrong

These are B2B "charge later" (J5) orders: the customer's card is authorised at
checkout, and the store charges it later when the order is packed.

- The first charge attempts (February) were **declined** by the card.
- On **13 Apr 2026** the charges finally went **through** — the provider approved
  them and an EZcount **receipt was issued**.
- **But the order records never updated.** They stayed at status `pending` /
  payment `pending_j5`, so in the admin they still looked unpaid — even though the
  money had been collected.

## Why it happened

The successful April 13 charge recorded the payment and issued the receipt, but it
did **not** run the normal "order paid" flow that flips the order to completed and
writes a ledger entry. So the payment and the order status drifted apart: **paid at
the provider, unpaid in the order record.**

## How we found it

- The payment provider's dashboard showed the charges as **approved** on April 13.
- The stored payment records confirmed success (approval code + **receipt issued**),
  matching the provider's transaction numbers.
- Yet the order documents still read `pending` / `pending_j5`, with **no ledger
  transaction**.

## What we did

- Manually set both orders to **`completed` / `completed`**, stamped with a note
  pointing at the April 13 transaction.
- Verified the change processed cleanly: no delivery note needed (J5); one internal
  "payment completed" record was added to the organization's timeline; **no customer
  was contacted and no money moved**.

## Still open

The **ledger has no transaction** for these charges, so the amounts **do not yet
appear in revenue/ledger reports**. The money was collected — it's only the internal
accounting record that's missing. Backfilling a capture transaction per order would
close this.

## Occurrences

| Order | Charged (gateway) | Amount | Now |
|---|---|---|---|
| `314oTtPvzxhZKPM9QwGE` | 13 Apr 2026 — txn 414258039 | ₪1,640.72 | completed / paid |
| `TM8bY48dLoMXpMuJvYUm` | 13 Apr 2026 — txn 414258129 | ₪2,939.92 | completed / paid |

Both: Volumez / דנה קונין, balasistore, same card.

## Worth keeping an eye on

If a J5 charge can succeed without flipping the order to paid, there may be **other
orders sitting as `pending_j5` that were actually charged**. A periodic sweep for
`pending_j5` orders that have a successful (receipt-issued) payment record would
catch them.
