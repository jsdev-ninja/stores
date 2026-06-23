# HYP (pay.hyp.co.il) — summary for our cases

Only the parts we actually use, with exact parameter names. Full docs:
https://developers.hyp.co.il/pay · index: https://developers.hyp.co.il/llms.txt

## Basics
- **Endpoint:** everything is a `GET` to `https://pay.hyp.co.il/p/` with an `action=` param.
- **Terminal = `Masof`.** Credentials: `Masof`, `KEY` (API key), `PassP` (API password).
  Ours live in `STORES/{storeId}/private/data.hypData` (`masof`, `password`).
- **Money:** HYP amounts are in **shekels** (e.g. `Amount=100.00`). Our ledger is **agorot** —
  convert at the HYP boundary (`amount/100` out, `Math.round(x*100)` in).
- **`Coin`:** `1`=ILS (default) · `2`=USD · `3`=EUR · `4`=GBP. We only use ILS.
- **All values URL-encoded.**

## Actions we care about ([full list](https://developers.hyp.co.il/pay/reference/actions.md))
| action | What it does | We use it for |
|---|---|---|
| `APISign` `What=SIGN` | sign + build a payment-page URL | direct payment + J5 auth (the redirect link) |
| `APISign` `What=VERIFY` | server-side verify a returned transaction | **must** run before trusting any redirect result |
| `soft` | server-to-server execution (direct charge, token charge, **J5 capture**, payout) | capturing a J5 hold |
| `getToken` | get a card token from a transaction `Id` | step before J5 capture |
| `zikoyAPI` | **refund** a *settled* transaction | (gap — not built yet) |
| `CancelTrans` | **cancel** an *unsettled* transaction (same day) | (gap — not built yet) |
| `payRequest` | create/list/delete hosted payment **links** | optional admin link-sending |

## Status codes ([full list](https://developers.hyp.co.il/pay/reference/response-status-codes.md))
`CCode` is the result code on every response/redirect.
- **Success:** `0` = approved (charge/capture/refund/cancel) · `700` = **J5 authorization OK** ·
  `600` = J2 card-validation · `800` = postponed.
- **Declines:** `1` blocked card · `2` stolen · `4` not approved · `6` CVV/ID · `15` invalid card · `429` card-not-in-valid-file.
- **Errors we'd hit:** `425` duplicate · `33` refund exceeds original · `920` cancel failed (already transmitted → must refund) · `995` link already paid · `403` below min amount.

> ⚠️ **J5 auth success is `CCode=700`, NOT `0`.** A J5 *capture* (the `soft` call) returns `0`.
> Don't gate the auth step on `CCode===0`.

---

## Flow 1 — J5 (authorize now, capture later)
J5 "locks" funds without charging; you capture (≤ authorized amount) later.
**Hold expires in ~5 days** — capture before then or it's gone.
Docs: [two-phase-commits](https://developers.hyp.co.il/pay/advanced-features/two-phase-commits.md)

**a) Authorize** — same as the direct payment page, plus `J5=True`:
```
APISign&What=SIGN&Masof&KEY&PassP&Amount&J5=True&MoreData=True&Order&Info...
```
Redirect success = **`CCode=700`**. Save from the redirect: `Id`, `ACode`, `UID`, `UserId`.
→ our `recordHypJ5Auth` posts `hyp_j5_auth` (order → `pending_j5`).

**b) Capture** — `getToken` then `action=soft`:
```
# 1. token from the auth transaction Id
getToken&Masof&PassP&TransId={Id}            → returns Token, Tokef

# 2. capture
soft&Masof&PassP&Token=True&CC={Token}&Tmonth&Tyear (from Tokef)
   &AuthNum={ACode}&Amount={≤ authorized}&UserId
   &inputObj.originalAmount={authorized, subunits}
   &inputObj.originalUid={UID}
   &inputObj.authorizationCodeManpik=7
```
Success = **`CCode=0`**.
→ our `captureHypJ5` posts `hyp_capture` (order → `completed`). *(Legacy `payments/chargeOrder`
does the same — to be retired; `captureHypJ5` is canonical.)*

---

## Flow 2 — Direct payment (immediate charge, J4)
Hosted payment page; we never touch card data (PCI SAQ-A).
Docs: [creating-a-payment-page](https://developers.hyp.co.il/pay/getting-started/creating-a-payment-page.md) · [transaction-validation](https://developers.hyp.co.il/pay/security/transaction-validation.md)

**1) Sign (server):**
```
APISign&What=SIGN&Sign=True&Masof&KEY&PassP&Amount&Order&Info
   &Coin&Tash(max installments)&sendemail&PageLang&ClientName&email&cell...
```
→ HYP returns the signed params; redirect the customer to `https://pay.hyp.co.il/p/?<params>`.
→ our `createHypDirectPaymentLink` / `createHypCheckoutPayment` (via `createPaymentLink`).

**2) Customer pays → redirect back** with:
`Id` (transaction id) · `CCode` (`0`=paid) · `Amount` · `ACode` (auth code) ·
`Order` · `Fild1`=name · `Fild2`=email · `Fild3` · `Sign` · `UID` · `L4digit` · `Tmonth/Tyear`.

**3) VERIFY before trusting it (server) — mandatory:**
```
APISign&What=VERIFY&Masof&KEY&PassP&<every redirect param, SAME ORDER>&Sign={Sign}
```
`CCode=0` ⇒ genuine. Anything else ⇒ forged/unknown → reject.
→ our `verifyHypSignature` + `recordHypDirectPayment` posts `hyp_direct` (order → `completed`).

> ⚠️ The redirect lands on the **client**; the client params are spoofable. **Only the server
> `VERIFY` result may flip an order to paid** — this is exactly the `pending_j5` bug fix.

---

## Flow 3 — Manual admin transaction
**Not a HYP call.** This records money received *outside* HYP (cash, wire, manual adjustment)
straight into our ledger as a `manual` transaction. No `Masof`/`Sign`/`CCode` involved.
→ our `postManualTransaction` (admin-only).

---

## Refund & Cancel (we don't build these yet — the gap)
- **Cancel** (before settlement, **same day, before 22:00 IL** — no acquirer fee):
  `CancelTrans&Masof&PassP&TransId={Id}` → success `CCode=0` + `ReversalStatus=777`;
  `CCode=920` = already transmitted → must refund instead.
  Docs: [cancellations](https://developers.hyp.co.il/pay/common-use-cases/cancellations.md)
- **Refund** (after settlement, full or partial):
  `zikoyAPI&Masof&PassP&TransId={Id}&Amount={≤ original}` → success `CCode=0` + a new refund `Id`;
  `CCode=33` = amount exceeds original.
  Docs: [refunds](https://developers.hyp.co.il/pay/common-use-cases/refunds.md)
- In the ledger these would be `direction:"out"` reversing money facts (`reference.type:"refund"`)
  — the schema already anticipates them; the HYP call + ledger posting aren't implemented.

---

## Gotchas to get right (collected)
1. **J5 auth = `CCode=700`**, capture = `CCode=0`. Different success codes.
2. **Always `VERIFY` server-side** before marking paid; never trust the redirect params alone.
3. **J5 hold ~5 days** — our stuck `pending_j5` orders from mid-May are already past that; a
   late capture will likely be declined (re-charge instead).
4. **`Sign` verification needs the raw values in order** — don't reorder/normalize params.
5. **Agorot ↔ shekels** convert only at the HYP boundary; store agorot.
6. `Tash` = max installments offered; `Pritim`/`heshDesc` = line items for the invoice
   (`[sku~name~qty~price]…`); `MoreData=True` returns the extended field set.
7. Idempotency: dedup our ledger on the HYP `Id` (`hyp_{Id}`) — HYP may redirect/retry.

## Optional deeper reading
Installments [installments](https://developers.hyp.co.il/pay/common-use-cases/installments.md) ·
tokenization [tokenization](https://developers.hyp.co.il/pay/common-use-cases/tokenization.md) ·
recurring [recurring-payments](https://developers.hyp.co.il/pay/advanced-features/recurring-payments.md) ·
3DS [3ds](https://developers.hyp.co.il/pay/advanced-features/3ds.md) ·
Enterprise API (server-to-server `dodeal`/`refunddeal`/`canceldeal`) [api-reference](https://developers.hyp.co.il/enterprise/api-reference/index.md)
