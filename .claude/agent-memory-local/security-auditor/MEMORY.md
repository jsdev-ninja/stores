# Memory Index

- [Firestore rules deployment model](project_firestore_rules_deploy.md) — prod rules NOT in repo; firebase.json firestore block has indexes only, no rules key; client writes orders/cart directly
- [Budget money-path architecture](project_budget_money_path.md) — event-driven debt model; amount-from-server invariant; reversal double-credit gap
- [AR organizationBalance security model](project_ar_organization_balance.md) — documents-module AR ledger; admin callables token-scoped; subscribers server-authoritative + replay-safe; audited clean
- [Auth & tenant model](project_auth_tenant_model.md) — custom claims (admin/companyId/storeId) minted per-tenant; canonical secure callable pattern; truthiness-short-circuit IDOR gotcha
- [Genkit media SSRF + AI cost-abuse](project_genkit_media_ssrf.md) — genkit downloadRequestMedia fetches user http(s) URLs IN our function (SSRF); 20MB cap only; no rate-limiting anywhere in backend; invoker:public is normal not a finding
