# Security Coverage Map — what "secure" means for @jsdev-store

The full set of security topics for this app, grouped by domain. For each **group**:
**Why** it must be covered *for us* (anchored to our real stack — multi-tenant Firebase +
React SPA with direct Firestore access + HYP payments + Algolia + ezCount + AI features),
a **Definition of Done** (what "covered" means), and the **topics** inside it.

This is the standing checklist: every PR, plan, and new feature gets measured against the
relevant groups. It is reference material — no exploit detail lives here (that stays in the
audit/working notes).

**Posture legend (initial read from the 2026-06-25 review):**
🔴 known gap · ⚠️ partial / needs verify · ✅ in place · ⬜ not yet assessed

**Visual map:** open [`security-coverage-map.html`](security-coverage-map.html) in a browser
for the at-a-glance grid of all 16 domains and their topics (self-contained, light/dark aware).

---

## A. Tenant Isolation (multi-tenancy)  — 🔴
**Why:** One Firestore + one Algolia index serve every store. A single missing tenant
filter leaks another store's orders, customers, or catalog. This is the #1 named risk.
**Done when:** every data path — read, write, search, file — is provably scoped to
`{companyId}/{storeId}` derived from the **server/token**, never from client input.
- Firestore path scoping via `getPath({companyId,storeId})` — never hand-built / root collections ⚠️
- Firestore rules enforce tenant ownership (not just app-layer convention) 🔴
- Algolia/search every query filtered `storeId:X AND companyId:Y` ⚠️ (server ✅, client key to verify)
- Cloud Functions derive tenant from `token.companyId/storeId`, never client body ⚠️ (newer endpoints ✅)
- Storage object paths scoped per tenant ⬜
- Callable IDOR — caller proven to own the order/resource it names ⚠️
- `collectionGroup` queries constrained by tenant (token lookups only) ⬜
- No cross-tenant data in shared docs/logs/exports ⬜

## B. Authentication & Identity  — ⚠️
**Why:** Customers (incl. anonymous guest checkout) and admins all authenticate via Firebase
Auth; a weak identity layer undermines everything above it.
**Done when:** identity is verified server-side on every privileged path, tokens are fresh,
and account lifecycle is handled safely.
- Firebase Auth providers configured & hardened (email enumeration, password policy) ⬜
- Anonymous auth (guest checkout) — scoped, can't escalate ⚠️
- ID-token verification + freshness on callables (`context.auth`) ⚠️
- Token revocation / forced refresh after role change ⬜
- Account lifecycle: signup, deletion cascade (`onUserDelete`) ✅, re-auth for sensitive ops ⬜
- MFA for admin/operator accounts ⬜
- Email/phone verification where it gates trust ⬜

## C. Authorization & Admin Model  — 🔴
**Why:** `admin/companyId/storeId` custom claims are the authorization backbone, but today
they're set **by hand** via a script — undefined, unauditable. The rules depend on them.
**Done when:** there is a defined, automated, audited way to grant/revoke roles, with least
privilege and no escalation path.
- Define the model: per-store admin vs global `superAdmin`, scope boundaries 🔴
- Automated, auditable claim granting (replace manual `setCustomUserClaims` script) 🔴
- Revocation & offboarding flow ⬜
- Least privilege (no blanket super-admin) ⬜
- Privilege-escalation prevention (user can't self-grant `admin`) ⚠️
- Server-side enforcement of every admin-only action ⚠️

## D. Firestore Security Rules  — 🔴
**Why:** The SPA reads/writes Firestore directly, so rules *are* the authorization boundary.
They are currently `allow read, write: if true` (fully open). See RULES-REMEDIATION.md.
**Done when:** default-deny rules under version control, per-collection matrix enforced, with
a passing emulator test suite, deployed.
- Default-deny posture, no broad `if true` 🔴
- Per-collection read/write matrix (owner / store-admin / public) 🔴
- Field-level write constraints (order money/lifecycle fields locked) 🔴
- Rules in repo + CI `validate` on every change 🔴
- `@firebase/rules-unit-testing` emulator suite (allow + deny cases) 🔴
- Query/rule coupling verified (lists carry ownership filters) ⚠️

## E. Cloud Storage Security  — 🔴
**Why:** Delivery notes/invoices (customer PII) and uploads live in Storage. Rules are
currently fully open, and invoices are world-readable via `makePublic()`.
**Done when:** Storage rules are locked down and private docs use short-lived signed URLs.
- Storage rules: deny-all / tenant-scoped (no open default) 🔴
- Private documents via signed URLs, not `makePublic()` 🔴
- Upload validation (size, content-type) ⬜
- Path scoping per tenant ⬜

## F. Payments, Ledger & Order Integrity (HYP)  — ⚠️
**Why:** Money is the #2 named risk. Card data stays on HYP's hosted page (PCI SAQ-A), so our
job is the integrity of charges, callbacks, and order/ledger state.
**Done when:** charges are authentic, idempotent, server-priced, and order/ledger state can
only transition through trusted (function) paths.
- HYP callback/redirect authenticity (`verifyHypSignature`) ✅ — applied on *every* inbound path ⚠️
- Idempotency: deterministic doc ids + `hyp_/idem_/evt_` dedup → no double-charge/double-credit ⚠️
- Server-side amount authority — never trust client `cartTotal`/amount 🔴 (`createPaymentRedirect` trusts client)
- Order state machine: paid/charged/refunded transitions function-only ⚠️ (rules draft enforces)
- J5 authorize + capture flow integrity ⚠️
- Refund authorization, limits, and audit ⬜
- Ledger append-only / reconciliation / duplicate-charge detection ⚠️ (`detectDuplicateCharges` ✅)
- ezCount invoicing integrity & idempotency ⬜
- Payment endpoints require auth + tenant ownership ⚠️/🔴 (`createPaymentRedirect` unauthenticated)
- Maintain PCI SAQ-A scope (no card data ever touches our servers) ✅ — guard against regressions

## G. Backend / Cloud Functions Hardening  — ⚠️
**Why:** Callables/triggers are the trusted compute layer; thin, validated, abuse-resistant
entry points keep the trust boundary honest.
**Done when:** every entry point validates input, enforces auth, resists abuse, and never
leaks secrets.
- Auth enforced on every callable (`context.auth`, reject anonymous where required) ⚠️
- Input validation with zod at every entry point ⚠️
- App Check on callables / Firestore / Storage (anti-automation) 🔴
- Rate limiting / abuse controls on sensitive endpoints 🔴
- Idempotent external writes (`.create()` + dedup id) ⚠️
- Error handling: no internal detail leaked to clients ⬜
- Structured logging, never logs secrets/PII 🔴 (secrets currently logged)
- Trigger/subscriber safety: replay-safe, poison-message handling ⬜
- CORS / allowed origins on HTTP endpoints ⬜

## H. Frontend / Web App Security  — ⚠️
**Why:** A public storefront SPA is exposed to XSS, clickjacking, open redirects, and the
universal rule that the client can never be trusted for authorization.
**Done when:** no injection sinks, security headers in place, redirects/URLs validated, and
no authorization decided client-side.
- XSS: audit `dangerouslySetInnerHTML` / untrusted HTML rendering ⬜
- CSP + security headers on hosting (frame-ancestors, nosniff, HSTS) ⬜
- Clickjacking protection ⬜
- Open redirect on user-supplied URLs (`origin` param) ⚠️ (validated in `createPaymentRedirect` ✅)
- SSRF via user-provided URLs reaching the backend ⬜
- Client config holds only publishable keys (no secrets) ✅
- Authorization never enforced only in the UI ⚠️

## I. Search / Algolia Security  — ⚠️
**Why:** A search index mirrors catalog (and possibly more) across tenants; a non-secured
client key lets anyone bypass the tenant filter.
**Done when:** client keys are Secured API Keys with a locked tenant filter, admin keys are
server-only, and the index holds no more than needed.
- Client key is a **Secured API Key** with enforced `storeId/companyId` filter ⚠️
- Search-only key in client; admin key (`ALGOLIA_SECRET`) server-only ✅
- Indexed data minimization (no secrets/PII beyond what search needs) ⬜
- Server-side filter enforcement where feasible ✅ (server `AlgoliaService`)

## J. AI / LLM Features (chatbot, fridgeScan)  — ⬜
**Why:** The chatbot injects per-store context and consumes user input; fridgeScan sends
images to Google GenAI. Both add prompt-injection and data-exfil surface.
**Done when:** model inputs/outputs are treated as untrusted, tenant-isolated, PII-minimized,
and cost-bounded.
- Prompt injection defenses (chatbot `storeContext`, user messages) ⬜
- Model output never executed / used for authz ⬜
- PII minimization in data sent to Google GenAI ⬜
- Per-tenant isolation of chatbot context ⬜
- Cost/abuse limits on AI endpoints ⬜

## K. Secrets & Key Management  — 🔴
**Why:** HYP creds, ezCount keys, Algolia admin key, GenAI key gate money and data. Some are
in `STORES/*/private` (exposed by the open rules) and some are logged.
**Done when:** every secret is inventoried, stored in a managed secret store, never in
client/logs/git, with a rotation policy.
- Secret inventory (HYP, ezCount, Algolia, GenAI, service accounts) ⬜
- Storage: Secret Manager (`defineSecret`) over `process.env`/Firestore where possible ⚠️
- Never in client bundle ✅ / never in logs 🔴 / never in git ✅ (`_secrets` gitignored)
- Rotation policy + post-incident rotation (assume current creds exposed) 🔴
- Least-privilege service accounts / IAM ⬜

## L. Data Protection & Privacy (PII)  — ⚠️
**Why:** We hold customer names, addresses, phones, emails, and B2B org data under Israeli
Privacy Protection Law (and GDPR-equivalent expectations).
**Done when:** PII is inventoried, access-controlled, minimized, retained/deleted per policy,
and never publicly exposed.
- PII inventory & data-flow map ⬜
- Access control on PII (rules + function auth) 🔴 (open rules expose it)
- Retention & deletion / right-to-erasure (beyond `onUserDelete`) ⬜
- No public exposure of PII documents (invoices/delivery notes) 🔴
- Data export / portability ⬜
- Encryption in transit/at rest ✅ (Firebase default) — verify no plaintext leaks ⬜

## M. Supply Chain & Dependencies  — ⬜
**Why:** A shared `@jsdev_ninja/core` package plus many npm deps; a compromised or stale dep
affects client and backend together.
**Done when:** dependencies are monitored, pinned/auditable, and `core` versions are
consistent across all consumers.
- SCA / `npm audit` / Dependabot on client + functions ⬜
- `@jsdev_ninja/core` exact-version consistency across store + functions ⚠️
- Lockfile integrity, no unexpected transitive changes ⬜
- Build pipeline integrity ⬜

## N. Infrastructure, CI/CD & Deploy  — ⚠️
**Why:** Production is `jsdev-stores-prod`; the working setup auto-deploys from `main`, which
makes branch hygiene and gated deploys a security control, not just process.
**Done when:** prod changes are reviewed, gated, environment-separated, and recoverable.
- Firebase project IAM least privilege ⬜
- Branch protection + reviewed, gated deploys (esp. rules) ⚠️
- Environment separation: prod vs test stores ✅ (enforced in workflow) — verify isolation ⬜
- Secret scanning in CI ⬜
- Backups / Firestore export + restore drill (DR) ⬜
- Predeploy gates (lint/build) ✅ — add rules validation ⬜

## O. Logging, Monitoring & Incident Response  — ⚠️
**Why:** We can't defend what we can't see; payment and admin actions especially need an
audit trail and alerting.
**Done when:** security-relevant events are logged (without secrets), anomalies alert, and
there are runbooks to respond.
- Security event logging: auth, admin actions, payment/charge events ⚠️
- Alerting on anomalies (failed auth spikes, charge anomalies) ⬜
- Error monitoring (Sentry present) ✅ — scrub PII/secrets ⬜
- Audit trail (order `updatedBy/updatedAt`) ⚠️
- Incident-response + secret-rotation runbooks ⬜
- Postmortems (`apps/docs/past-issues`) ✅ — extend to security incidents ⬜

## P. Compliance & Governance  — ⬜
**Why:** Payment processing and PII handling carry external obligations (PCI, Israeli PPL,
third-party processors).
**Done when:** obligations are identified, documented, and attestable.
- PCI DSS SAQ-A attestation (card data stays on HYP) ⬜
- Privacy policy / Terms of Service current ⬜
- Data Processing Agreements with HYP, ezCount, Algolia, Google ⬜
- Data-subject request handling (access/erasure) ⬜

---

### How this gets used
- **Every PR / plan:** identify which groups it touches; the relevant topics become review gates.
- **Posture review:** the 🔴 items are the active backlog (rules + secrets + payments-endpoint hardening lead).
- **Living doc:** posture updates as we close items. Proposed permanent home: `apps/docs` (security section), wired into the sidebar — kept here in `security/` until you approve the content.
