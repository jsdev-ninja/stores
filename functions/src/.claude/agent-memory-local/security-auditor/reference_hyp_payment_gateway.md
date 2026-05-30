---
name: reference-hyp-payment-gateway
description: HYP (Hyp/Yaad-Sarig) payment gateway integration details for @jsdev-store — where credentials live and how Sign verification should work
metadata:
  type: reference
---

@jsdev-store's payment processor is **HYP** (Hyp/Yaad-Sarig, pay.hyp.co.il). Reused client: `functions/src/services/hypPaymentService/index.ts` (createPaymentLink via APISign, chargeJ5Transaction).

**Per-store credentials** live at Firestore `STORES/{storeId}/private/data` → `hypData.{KEY, password (==PassP), masof}`. These are secrets; never log or return them.

**Sign verification (for inbound webhooks):** HYP signs response/callback params with a `Sign` field derived from the response params + the store's `KEY`. As of 2026-05-30 NO Sign-verification helper exists anywhere in the repo — any new inbound HYP callback receiver must implement it from scratch (recompute over returned params with the store KEY, constant-time compare, AND cross-check payload `Masof` against the store's real masof). The ledger module's `hypWebhookHandler` shipped with this verification missing (a `// SECURITY TODO`).

**How to apply:** When auditing any HYP webhook/callback handler, require Sign HMAC verification + Masof cross-check before processing, and prefer server-to-server confirmation of transaction Id/Amount over trusting the callback body. J5 flow is auth-then-capture: never trust a client-asserted auth amount; the captured amount must come from a HYP-verified response. See also [[project-auth-tenant-model]].
