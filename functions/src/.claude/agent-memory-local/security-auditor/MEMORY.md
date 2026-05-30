# Memory Index

- [Auth & tenant model](project_auth_tenant_model.md) — Firebase multi-tenancy; only admins get claims, customers get none → token-storeId guards short-circuit; use budgetApi pattern
- [No firestore.rules in repo](project_no_firestore_rules.md) — no rules-layer compensating control; never downgrade callable IDOR severity assuming rules catch it
- [HYP payment gateway](reference_hyp_payment_gateway.md) — creds at STORES/{storeId}/private/data.hypData; Sign verification must be built from scratch, none exists in repo
- [Ledger module](project_ledger_module.md) — money-ledger at functions/src/modules/ledger; 2026-05-30 all 6 prior crit/high CLOSED; VERIFY-gated customer endpoints + atomic postTransaction
