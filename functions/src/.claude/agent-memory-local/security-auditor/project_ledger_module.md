---
name: project-ledger-module
description: Security state of functions/src/modules/ledger after the 2026-05-30 fix pass — what was closed, residual risks, design of the HYP money-write path
metadata:
  type: project
---

`functions/src/modules/ledger` is a standalone (UNWIRED — not in index.tsx) money-ledger module for HYP payments. As of 2026-05-30 re-audit, all 6 prior CRITICAL/HIGH findings are CLOSED.

**Why:** First audit returned DO NOT SHIP (4 crit, 3 high): forged-tenant webhook handler, unverified J5 amount, unauthenticated admin callables w/ client tenant, dead single-use-link code, empty capture identity, non-atomic event emit.

**How to apply (design facts to re-check on future edits):**
- `services/postTransaction.ts` is the ONLY Transaction writer. It co-writes the doc (`fsxn.create(ref, tx)`) and the `ledger.transaction_posted` event via `emit(fsxn, ...)` in ONE `runTransaction` → atomic. `create()` throws gRPC ALREADY_EXISTS (code 6 / "already-exists") → caught as idempotent no-op. Dedup doc id = `hyp_{Id}` / `idem_{key}` / `evt_{sub}_{eventId}`. Don't move the emit outside the txn.
- Customer endpoints (`recordHypJ5Auth`, `recordHypDirectPayment`) have NO auth claim — integrity rests entirely on: (1) HYP VERIFY (`services/verifyHypSignature.ts`, action=APISign&What=VERIFY, requires CCode==="0", FAILS CLOSED on network/parse error), (2) Masof cross-check vs `STORES/{storeId}/private/data.hypData.masof`, (3) amount taken from HYP-verified `Amount` → agorot with `<=0 || !isFinite` guard, (4) dedup on HYP-verified `Id`. Tenant binding works because VERIFY uses the store's own KEY/PassP/Masof, so a wrong storeId fails VERIFY.
- `recordHypDirectPayment` ordering: VERIFY → consume link (`consumePaymentLink`, expiry+usedAt checked INSIDE the txn) → postTransaction. Residual MEDIUM: if VERIFY passes + link consumes but postTransaction throws, the link is burned with no money fact (customer charged at HYP, no ledger row). Acceptable (audit trail via rawResponse + dedup means a retry with same Id is a no-op) but note it.
- Admin callables (`postManualTransaction`, `captureHypJ5`, `createHypDirectPaymentLink`) follow budgetApi pattern: `context.auth.token.admin` required, companyId/storeId from token claims, NOT client input. captureHypJ5 has H1b pre-HYP double-charge guard (`queryCaptursByAuthTx` before charge) + H1 identity pulled from auth tx.

**Known residual (pre-existing, NOT ledger's bug):** `services/hypPaymentService/index.ts` createPaymentLink logs full `params` (includes KEY/PassP) via logger.write INFO. Out of scope for ledger but worth flagging upstream.
