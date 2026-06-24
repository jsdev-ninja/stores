---
sidebar_position: 1
title: Order looked unpaid but was actually paid
---

# Order looked unpaid but was actually paid

| | |
|---|---|
| **Store** | Balasi (balasistore) |
| **Customer** | Volumez — דנה קונין |
| **Recurring?** | **Yes — 4 confirmed cases** (all the same customer) |
| **Status** | ✅ Resolved each time — drafts cancelled; payments were collected correctly |

## In one line

An order *looks* like it was never paid — but it actually **was** paid in full.
It happens because **one shopping cart creates two orders**: one is left behind as
an empty "draft", and the other is the real one that gets packed, charged, and
invoiced.

## The pattern

For the same shopping session, **two order records** get created (anywhere from a
minute to ~40 minutes apart):

- a **draft** — left behind, holding the early version of the basket, showing as
  unpaid; and
- the **real order** — authorised at checkout, adjusted during packing, then
  charged and invoiced.

The payment and the invoice belong to the **real order**, so the leftover draft
looks abandoned/unpaid even though the customer paid in full.

## Known occurrences

| When | Leftover draft (looks unpaid) | Real order (paid) | Amount charged | Document |
|---|---|---|---|---|
| 17–19 Aug 2025 | `QCxvDOvpstZvqtWI5jy3` — 43 items, ₪1,930.72 — *cancelled* | `wotozq5wQ5wWakRF6vhc` — 46 items | **₪2,078.12** (19 Aug) | Invoice #1026 |
| 30 Oct – 2 Nov 2025 | `kjHBnGAheMXv2PO8Ldkk` — 46 items, ₪2,002.86 — *cancelled* | `AZLOYkEjwcmkl5fvrLlp` — 45 items | **₪2,064.18** (2 Nov) | EZcount receipt |
| 19–23 Nov 2025 | `2LkV1BzjHd8YIZTQq2OJ` — 37 items, ₪1,610.70 — *cancelled* | `gBrC4op3H3daOK7PU9tZ` — 40 items | **₪2,406.10** (23 Nov) | EZcount receipt |
| 24–25 Nov 2025 | `7DLW7Fv9v3jrBhk2Btt7` — 19 items, ₪773.50 — *cancelled* | `EfnR3cJLwDHBfHesesmH` — 21 items | **₪851.57** (25 Nov) | EZcount receipt |

All four: same customer (Volumez), same store, same credit card, same shared-cart
fingerprint — the draft and the paid order point at the **same basket**.

## Worked example (the August 2025 case)

1. **17 Aug, ~11:14** — customer builds the basket → saved as a **draft order**.
2. **17 Aug, ~11:15** — a minute later the order is actually placed → a **second,
   real order** is created from the *same basket*.
3. **17 Aug, ~11:16** — the card is **authorised** for ₪1,930.72 (a hold, not yet
   a charge).
4. **During packing** — items are swapped / added / removed → 46 items / ₪2,078.12.
5. **19 Aug, 12:33** — the store **charges** the card ₪2,078.12 and issues
   **Invoice #1026**.

The other cases are the same shape, just different numbers (see the table above).

## Why it's confusing

- The leftover **draft** carries the original basket and shows as unpaid, so on its
  own it looks like a lost order.
- The **payment and invoice live on the *other* (real) order**, so none of it shows
  up on the draft.
- Both orders come from the **same basket**, so their contents look almost
  identical — the small differences are just packing adjustments.

## How we confirm it

Take the invoice/charge details — amount, date, and the credit-card
approval/transaction numbers — and match them back to an order. They line up with
the **real** order, which is marked completed and paid. The draft has no payment of
its own.

## Resolution

- In every case the money was collected correctly and the customer has a valid
  invoice/receipt. **Nothing is owed and nothing needs refunding.**
- All four leftover **draft orders were cancelled**. No further action required.

## Worth keeping an eye on

This has now happened **at least four times, all for the same customer (Volumez)**.
That strongly suggests something in their checkout flow is creating a duplicate
draft order. It's worth a proper root-cause look at *why* the draft gets created,
plus a periodic sweep for leftover drafts that have a paid sibling on the same
basket — they inflate order counts and cause exactly this confusion.

Two practical notes:

- **Timing isn't a reliable signal.** The gap between the draft and the real order
  ranged from ~1 minute to ~40 minutes. The dependable link is the **shared
  basket**, not how close together they were created.
- **The final charge can differ from the amount first authorised** — sometimes
  higher, sometimes lower — because the basket is adjusted during packing.

---

**Reference (for tracing):**

| Case | Draft | Paid order | Shared basket |
|---|---|---|---|
| Aug 2025 | `QCxvDOvpstZvqtWI5jy3` | `wotozq5wQ5wWakRF6vhc` | `nu70Ed2lvRKnleKpC4SF` |
| Oct 2025 | `kjHBnGAheMXv2PO8Ldkk` | `AZLOYkEjwcmkl5fvrLlp` | `dF4POCK17Nl3p8aYQKRE` |
| Nov 2025 (a) | `2LkV1BzjHd8YIZTQq2OJ` | `gBrC4op3H3daOK7PU9tZ` | `i945rH4qDNFckDI0Xtrg` |
| Nov 2025 (b) | `7DLW7Fv9v3jrBhk2Btt7` | `EfnR3cJLwDHBfHesesmH` | `yqgSCg70OnZ15RBP7Zg4` |
