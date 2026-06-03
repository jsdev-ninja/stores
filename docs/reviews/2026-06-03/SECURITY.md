# 🔒 Security Issues — Master Index

**Consolidated security view across all review passes.** Every security-relevant finding from the June 2026 review is listed here, grouped by attack vector, with full remediation steps.

This document is the authoritative security checklist for the review. The detailed write-ups live in the source reports — links inline.

---

## Threat model summary

The app is a multi-tenant B2B/B2C e-commerce platform on Firebase. Each tenant is `{companyId, storeId}`. Customers, store admins, and the platform owner have different privilege levels. Money moves through HYP (payment gateway) and tax invoices are issued via ezCount. The attack surface most worth protecting:

1. **HYP credentials** (`KEY`, `PassP`, `masof`) — anyone holding these can charge real money or move funds.
2. **ezCount API key** — anyone holding it can issue tax invoices in the platform's name.
3. **Cross-tenant isolation** — store A must never read/write store B's data.
4. **Firebase Auth user creation** — must be admin-gated; otherwise account takeover is trivial.
5. **B2B billing accuracy** — debt must be tracked correctly per organization.

This review found exploitable weaknesses in **every one** of those areas.

---

## Severity legend

- 🚨 **CRITICAL — exploitable today by an unauthenticated attacker**
- 🔴 **CRITICAL — exploitable by an authenticated low-privilege user**
- 🟠 **HIGH — exploitable by an admin in a wrong scope (cross-tenant)**
- 🟡 **MEDIUM — exploitable in narrow window or requires log access**
- ⚪ **LOW — minor info leak or hardening opportunity**

---

## 📊 Summary table

| ID | Severity | Category | Title |
|---|---|---|---|
| SEC-01 | 🚨 | Leaked credential | Mixpanel API token committed to source |
| SEC-02 | 🚨 | Unauth endpoint | `createCompanyClient` creates Firebase Auth users without auth |
| SEC-03 | 🚨 | Unauth endpoint | `createPayment` / `createPaymentRedirect` accept storeId from client |
| SEC-04 | 🚨 | Unauth endpoint | `createInvoice` issues tax invoices without auth |
| SEC-05 | 🚨 | Credential in logs | HYP `PassP` + `KEY` logged on every payment call |
| SEC-06 | 🚨 | Credential in logs | ezCount `api_key` logged on every doc creation |
| SEC-07 | 🚨 | Infrastructure | No `firestore.rules` in the repo |
| SEC-08 | 🔴 | Missing admin gate | `chargeOrder` lacks admin role check |
| SEC-09 | 🔴 | Missing admin gate | `createDeliveryNote` lacks admin role check |
| SEC-10 | 🟠 | Cross-tenant | `migrateProfilesToMultiOrg` reads tenant from client input |
| SEC-11 | 🟠 | IDOR | `getOrganizationActions` reads root path without tenant scoping |
| SEC-12 | 🟠 | Trust client data | `recordHypJ5Auth` credits debt to client-supplied `organizationId` |
| SEC-13 | 🟡 | DoS / log abuse | `uiLogs` accepts arbitrary unauthenticated data |
| SEC-14 | 🟡 | Info disclosure | `appInit` returns full company/store docs |
| SEC-15 | 🚨 | Leaked credential | `_secrets` file contains live npm publish token |
| SEC-16 | 🟠 | Leaked credential | Hardcoded demo API key in `EZcount.NodeJs.example/` |
| SEC-17 | 🟡 | Stale credential | Unused `OPENAI_API_KEY` in `.env.jsdev-stores-prod` |
| SEC-18 | 🟡 | Credential in logs | `storePrivateData` JSON-dumped in `appApi/index.ts` |
| SEC-19 | 🟡 | Info disclosure | Full error stack traces persisted to Firestore |
| SEC-20 | 🟡 | Weak token | 8-char `paymentRedirects` token, root collection, `.set()` |
| SEC-21 | 🟡 | Replay window | `recordHypDirectPayment` link consume is best-effort |
| SEC-22 | 🟡 | Multi-tenant breach | Root collections for tenant data (`paymentRedirects`, `landingLeads`, `profile(s)`) |
| SEC-23 | 🚨 | Leaked credential | Hardcoded Mixpanel Basic Auth header (same root as SEC-01) |

**22 distinct security findings, 8 of which are exploitable by an unauthenticated attacker today.**

---

## 🚨 Section A — Leaked credentials (rotate first)

### SEC-01 — Mixpanel API token committed to source

**File:** [`functions/src/modules/analytics/api/mixpanelData.ts:16`](../../../functions/src/modules/analytics/api/mixpanelData.ts)

```ts
authorization: "Basic OWM5NWIxZWZkOGI2Y2VmYmRmZDI1NmQ2NzdhNzg0OGQ6",
```

Base64 decoded: `9c95b1efd8b6cefbdfd256d677a7848d:` — a live Mixpanel service-account secret committed to the git history. Anyone who has ever cloned the repo holds this credential.

**Exploitation**

Read/write any data in Mixpanel project `2965387`. Could be used to:
- Read customer behavior data (privacy breach)
- Inject fake events to manipulate dashboards
- Drain Mixpanel quota (cost amplification)

**Remediation**

1. **Rotate immediately** in Mixpanel dashboard
2. Move the new secret to Firebase Secret Manager:
   ```bash
   firebase functions:secrets:set MIXPANEL_API_TOKEN
   ```
3. Read in code with `defineSecret`:
   ```ts
   import { defineSecret } from "firebase-functions/params";
   const mixpanelToken = defineSecret("MIXPANEL_API_TOKEN");
   authorization: `Basic ${Buffer.from(mixpanelToken.value() + ":").toString("base64")}`,
   ```
4. Scrub from git history with `git filter-repo` (the old token is dead after rotation, so this is hygiene rather than necessity)
5. **Bonus:** the function is scheduled but targets dead stores (`tester-store`, `opal-market-store`) — consider deleting it entirely instead. See [DC-07](06-dead-code.md#dc-07).

---

### SEC-15 — `_secrets` file at repo root with live npm publish token

**File:** [`_secrets`](../../../_secrets) (56 bytes, gitignored but on disk in plaintext)

Contains an active `npm_qJl…` publish token. Even though it's gitignored, it sits in plaintext on the developer's machine — at risk via:
- Backup tools (Time Machine, iCloud, Dropbox)
- Screenshots / screen-sharing
- Stolen / lost device
- Malware on the dev machine

**Exploitation**

Whoever holds the token can publish arbitrary code to any npm package the owning account has rights to. If the account publishes a package consumed downstream, this is a **supply-chain attack vector**.

**Remediation**

1. Rotate the token via npm dashboard immediately
2. `rm /Users/philbro/workspace/@jsdev-store/_secrets`
3. If automation needs it, store as a **GitHub Actions secret** or **1Password CLI** reference — not as a file on disk
4. Audit all dev machines for similar plaintext-secret files

---

### SEC-16 — Hardcoded demo API key in `EZcount.NodeJs.example/`

**Files:**
- [`EZcount.NodeJs.example/clearing-and-invoice/main.js`](../../../EZcount.NodeJs.example/clearing-and-invoice/main.js)
- (and likely the sibling sample)

Vendor SDK example with a demo API key committed to git. The real integration lives in `functions/src/services/ezCountService/`.

**Exploitation**

Limited if it's only a demo key (vendor sandbox), but:
- If it's a real key from a copy-paste, it could issue real invoices
- Demonstrates a pattern (committing vendor samples with keys) that may have happened elsewhere — audit

**Remediation**

1. Verify whether the key is sandbox-only with ezCount
2. Rotate if it touches anything real
3. **Delete the entire `EZcount.NodeJs.example/` folder** — it's unused (see [DC-12](06-dead-code.md#dc-12))

---

### SEC-17 — `OPENAI_API_KEY` in `.env.jsdev-stores-prod` (likely stale)

**File:** `functions/.env.jsdev-stores-prod` (gitignored)

Contains `OPENAI_API_KEY` but the `openai` npm package is **not imported anywhere** in `functions/src/`. The project uses Genkit + `@genkit-ai/google-genai` instead. The key is dormant infrastructure.

**Exploitation**

If the key is still live on OpenAI's side, anyone who reads the file can drain the linked OpenAI account's quota (cost).

**Remediation**

1. Rotate the OpenAI key
2. Remove the env var from `.env.jsdev-stores-prod`
3. Audit all `.env.*` files for other unused/stale secrets — credentials that aren't actively used are still credentials

---

### SEC-23 — Same as SEC-01

Listed separately in the analytics-module audit because it was independently discovered there. Same fix.

---

## 🚨 Section B — Unauthenticated callable endpoints

These Cloud Functions accept calls from any unauthenticated client on the internet and perform privileged actions. They are exploitable today.

### SEC-02 — `createCompanyClient` creates Firebase Auth users without auth

**File:** [`functions/src/modules/customers/api/createCompany.ts:5-31`](../../../functions/src/modules/customers/api/createCompany.ts)

```ts
export const createCompanyClient = onCall(async (request) => {
  // todo: check if user is admin   ← the bug is acknowledged
  const newCompany = request.data;
  const user = await admin.auth().createUser({
    email: newCompany.email,
    password: newCompany.password,
    displayName: newCompany.fullName,
  });
  // ... writes profile doc to root `profile/{uid}`
});
```

**Exploitation**

Any unauthenticated client on the internet can:
1. Create arbitrary Firebase Auth users with **chosen passwords**
2. If the email belongs to a real customer who hasn't signed up yet, the attacker controls the account when the customer tries to log in
3. Write arbitrary profile data into the root `profile/{uid}` collection
4. If profile data drives any admin claim downstream, this is a privilege escalation path

**Remediation**

```ts
export const createCompanyClient = onCall(async (request) => {
  if (!request.auth?.token.admin) {
    throw new HttpsError("permission-denied", "Admin only");
  }
  const { companyId, storeId } = request.auth.token;
  if (!companyId || !storeId) {
    throw new HttpsError("permission-denied", "Tenant claim missing");
  }
  // Validate input
  const input = CreateCompanyClientInputSchema.parse(request.data);
  // ... use companyId/storeId from token, never from request.data
});
```

Plus: replace the root `profile/` collection with a tenant-scoped path (see SEC-22).

---

### SEC-03 — `createPayment` / `createPaymentRedirect` accept storeId from client without auth

**Files:**
- [`functions/src/modules/payments/api/createPayment.ts:24-105`](../../../functions/src/modules/payments/api/createPayment.ts)
- [`functions/src/modules/payments/api/createPaymentRedirect.ts:34-141`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts)

Both functions take an `order` object from the client (including `order.storeId`) and use that to load `STORES/{storeId}/private/data` (HYP credentials) and sign a payment link. No `context.auth` check.

**Exploitation**

An unauthenticated attacker can:
1. **Enumerate** which storeIds have HYP credentials configured
2. **Generate signed HYP forms** charging arbitrary amounts to any victim store's masof
3. Combined with SEC-05 (credentials in logs), can test their generated form and read the response

This is *the* highest-impact finding — it enables money movement against any store on the platform without authentication.

**Remediation**

Match the pattern in `chargeOrder` and `createHypCheckoutPayment`:

```ts
export const createPayment = onCall(async (request) => {
  if (!request.auth?.token.admin) {
    throw new HttpsError("permission-denied", "Admin only");
  }
  const { companyId, storeId } = request.auth.token;
  if (!companyId || !storeId) {
    throw new HttpsError("permission-denied", "Tenant claim missing");
  }
  // Load the order server-side; never trust request.data.order
  const order = await ordersStore.getOrder({ companyId, storeId, orderId: request.data.orderId });
  // ... rest
});
```

---

### SEC-04 — `createInvoice` issues tax invoices without auth

**File:** [`functions/src/modules/documents/api/createInvoice.ts:16-134`](../../../functions/src/modules/documents/api/createInvoice.ts)

```ts
const storeId = request.data.storeId; // from client
const storePrivateData = await admin.firestore()
  .doc(`STORES/${storeId}/private/data`).get(); // ezcount_key, etc.
// ... calls ezCount to issue an invoice
```

No `auth?.token.admin` gate.

**Exploitation**

Unauthenticated attacker can:
- Issue arbitrary tax invoices via any victim store's ezCount account
- Corrupt order docs cross-tenant
- Exhaust the victim's ezCount quota / billable line items

**Remediation**

```ts
const auth = request.auth;
if (!auth?.token.admin) throw new HttpsError("permission-denied");
const { companyId, storeId } = auth.token;
if (!companyId || !storeId) throw new HttpsError("permission-denied");
// Use storeId from token, NEVER from request.data
```

---

### SEC-13 — `uiLogs` accepts arbitrary data unauthenticated

**File:** [`functions/src/index.tsx:10-13`](../../../functions/src/index.tsx)

```ts
export const uiLogs = onCall(async (request) => {
  functionsV2.logger.write(request.data);
});
```

**Exploitation**

1. **Cost amplification** — flood production logs (Stackdriver/Cloud Logging is billed by volume)
2. **Log injection** — inject fake log entries that look like errors from real users
3. **Log poisoning** — inject fields that break downstream log-parsing tooling

**Remediation**

```ts
export const uiLogs = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated");
  const parsed = UiLogSchema.parse(request.data); // strict Zod, capped lengths
  functionsV2.logger.write({
    ...parsed,
    userId: request.auth.uid,
    tenantCompanyId: request.auth.token.companyId,
    source: "ui",
  });
});
```

---

## 🔴 Section C — Missing admin authorization (authed but under-protected)

### SEC-08 — `chargeOrder` lacks admin role check

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:26-197`](../../../functions/src/modules/payments/api/chargeOrder.ts)

Verifies `context.auth?.token.storeId/companyId` exist but does NOT check `token.admin`. Any authenticated user in the tenant (a logged-in customer) can attempt to capture a J5 charge on someone else's order.

**Exploitation**

A logged-in customer in store A guesses (or browses-by-incrementing) another customer's `orderId` and triggers a J5 capture against their card. Money moves.

**Remediation**

```ts
if (!context.auth?.token.admin) {
  throw new HttpsError("permission-denied", "Admin only");
}
```

---

### SEC-09 — `createDeliveryNote` lacks admin role check

**File:** [`functions/src/modules/documents/api/createDeliveryNote.ts:10-52`](../../../functions/src/modules/documents/api/createDeliveryNote.ts)

Checks `companyId/storeId` exist but not `admin`. Any authenticated customer can pass an arbitrary `order` payload from the client and create delivery notes.

**Exploitation**

Any logged-in customer can manufacture delivery notes against ezCount with arbitrary client data — financial / document fraud, ezCount quota drain.

**Remediation**

```ts
if (!context.auth?.token.admin) {
  throw new HttpsError("permission-denied", "Admin only");
}
// AND validate the order against a server-loaded copy:
const order = await ordersStore.getOrder({ companyId, storeId, orderId: request.data.orderId });
// Use `order` fields, never trust request.data.order
```

---

## 🟠 Section D — Cross-tenant / IDOR (admin in wrong scope)

### SEC-10 — `migrateProfilesToMultiOrg` reads tenant from client input

**File:** [`functions/src/modules/customers/api/migrateProfiles.ts:6-96`](../../../functions/src/modules/customers/api/migrateProfiles.ts)

Admin claim is verified, but `companyId/storeId` come from `opts.data`, not token claims.

**Exploitation**

An admin scoped to store A can pass `{ companyId: B, storeId: B }` and migrate profiles in store B — cross-tenant data mutation by any admin.

**Remediation**

```ts
const companyId = opts.auth.token.companyId;
const storeId = opts.auth.token.storeId;
// NOT: const { companyId, storeId } = opts.data;
```

Note: this function is also a deployed-but-uncalled one-shot migration (see [DC-07](06-dead-code.md#dc-07)) — consider decommissioning entirely.

---

### SEC-11 — `getOrganizationActions` reads root path without tenant scoping

**File:** [`functions/src/api/organizationActionsApi.ts:5-34`](../../../functions/src/api/organizationActionsApi.ts)

Admin check is present, but the read path `organizations/{organizationId}/actions` is at the **root level**, not under `{companyId}/{storeId}`.

**Exploitation**

Any admin in any tenant can read another tenant's organization actions if they know (or guess) the organizationId.

**Remediation**

Option 1: Move data to tenant-scoped path
```
{companyId}/{storeId}/organizations/{id}/actions
```

Option 2: Verify ownership before reading
```ts
const orgDoc = await db.doc(`organizations/${orgId}`).get();
if (orgDoc.data()?.companyId !== auth.token.companyId) {
  throw new HttpsError("permission-denied");
}
```

---

### SEC-12 — `recordHypJ5Auth` trusts client-supplied `payer.organizationId`

**File:** [`functions/src/modules/ledger/api/recordHypJ5Auth.ts:35-42, 141`](../../../functions/src/modules/ledger/api/recordHypJ5Auth.ts)

```ts
const payer = {
  organizationId: request.data.payer.organizationId, // ← from client
  clientId: request.data.payer.clientId,
  billingAccountId: request.data.payer.billingAccountId,
};
// ... persisted into Transaction doc
// ... reduceDebtOnTransactionPosted later credits that org's debt
```

**Exploitation**

A real B2B customer making a real payment can spoof `payer.organizationId` to reduce a different (e.g., competitor) organization's outstanding debt within the same tenant. The money was paid, but the credit lands on the wrong B2B account. Financial discrepancy that's hard to detect without manual ledger reconciliation.

**Remediation**

Match `recordHypDirectPayment` (lines 172-198): load the order server-side and read `order.organizationId/client.id/billingAccount.id` from the stored doc.

```ts
const order = await ordersStore.getOrder({ companyId, storeId, orderId });
const payer = {
  organizationId: order.organizationId,    // server-resolved
  clientId: order.client?.id,
  billingAccountId: order.billingAccount?.id,
};
```

---

## 🚨 Section E — Credentials in logs

Every line in this section gives operator log access the same power as the underlying credential. Logs are typically more broadly accessible than databases — support engineers, observability tools, and incident-response dashboards all read logs.

### SEC-05 — HYP `PassP` + `KEY` logged on every payment call

**Files:**
- [`functions/src/services/hypPaymentService/index.ts`](../../../functions/src/services/hypPaymentService/index.ts) — lines 69, 87, 126, 140, 156, 167, 183, 197, 210, 220
- [`functions/src/modules/payments/api/createPaymentRedirect.ts:70`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts) — `console.log("storePrivateData", JSON.stringify(storePrivateData))`

`params` and `transParams` passed into `logger.write` include `PassP` (Masof password) and `KEY` (HYP API key) on every call.

**Exploitation**

Anyone with log read access (operators, SRE, support, any leaked log dashboard credential) has every store's HYP credentials in plaintext. They can then:
- Initiate charges against any store via HYP directly
- Refund / cancel real transactions
- Read transaction history

**Remediation**

Create a sanitization helper:

```ts
const SENSITIVE_KEYS = new Set([
  "KEY", "PassP", "password", "api_key", "ezcount_key", "masof",
]);

function sanitizeForLog<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLog) as T;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k) ? "[REDACTED]" : sanitizeForLog(v),
    ]),
  ) as T;
}
```

Replace every `logger.write({ ..., params })` with `logger.write({ ..., params: sanitizeForLog(params) })`. Delete `console.log("storePrivateData", ...)` entirely.

---

### SEC-06 — ezCount `api_key` logged on every doc creation

**File:** [`functions/src/services/ezCountService/index.ts`](../../../functions/src/services/ezCountService/index.ts) — lines 81, 116, 231

```ts
logger.info("ezcount params", { params }); // params.api_key included
logger.info("ezcount res", { result: res }); // res.config.data echoes the request body
```

**Exploitation**

Operator with log access can issue arbitrary invoices on any store's ezCount account.

**Remediation**

- Sanitize `params` before logging (same helper as SEC-05)
- Log only `res.data`, **never** the full axios response object (`res.config.data` echoes the request including the api_key)

---

### SEC-18 — `storePrivateData` JSON-dumped in `appApi/index.ts`

**File:** [`functions/src/appApi/index.ts:140-147`](../../../functions/src/appApi/index.ts)

```ts
logger.write({ ..., storePrivateData, store, order });
// storePrivateData includes ezcount_key AND hypData
```

Same problem as SEC-05/SEC-06 — drops both ezCount and HYP credentials into the structured log.

**Remediation**

Remove `storePrivateData` from the logged payload entirely. There is no log-debugging case where the credentials should appear.

---

### SEC-19 — Full error stack traces persisted to Firestore

**File:** [`functions/src/platform/eventBus/subscribe.ts:28-33`](../../../functions/src/platform/eventBus/subscribe.ts)

`describeError` falls back to `err.stack ?? err.message`, persisted into the `eventBusAttempts` doc (`errors` array).

**Exploitation**

Minor — stack traces include file paths, dependency versions, sometimes configuration values. Anyone with Firestore read access on the attempts collection has them. Also: the `errors` array uses `arrayUnion` and the per-message cap is 1000 chars, but enough error volume could approach Firestore's 1 MB document limit.

**Remediation**

```ts
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 1000); // no stack
  return String(err).slice(0, 1000);
}
// Log the full stack to functions logger; persist only the message to Firestore
```

---

## 🚨 Section F — Infrastructure

### SEC-07 — No `firestore.rules` in the repo

**File missing:** `functions/firestore.rules` (or any `*.rules` file)

`functions/firebase.json` declares `firestore.indexes` but no `firestore.rules` entry. The actually-deployed rules are unknown and not version-controlled.

**Why this matters most**

Every other security finding in this document assumes a particular Firestore rules posture. Without committed rules, **we don't know what's actually protected at the database layer.** The current backend code may enforce admin checks, but a misconfigured rule could allow clients to bypass the backend entirely.

In particular, the following data **must** be admin-only or server-only at the rules layer:
- `STORES/{storeId}/private/**` — HYP credentials, ezCount API key
- `transactions/**` — ledger entries (money records)
- `budgetRecords/**` — debt ledger
- `paymentLinks/**` — payment tokens
- `paymentRedirects/**` — payment redirect tokens
- All `internal/*` data

**Remediation**

1. Pull the currently-deployed rules:
   ```bash
   firebase firestore:rules:get > functions/firestore.rules
   ```
2. Add to `functions/firebase.json`:
   ```json
   {
     "firestore": {
       "rules": "firestore.rules",
       "indexes": "firestore.indexes.json"
     }
   }
   ```
3. Audit the rules for:
   - **Default-deny** posture (`match /{document=**} { allow read, write: if false; }`)
   - `STORES/{storeId}/private/**` — admin-only
   - `transactions`, `budgetRecords`, `paymentLinks` — server-write only (`if false` for client writes; backend writes via admin SDK bypass rules)
   - All tenant-scoped reads check `request.auth.token.companyId == companyId && storeId == storeId`
4. Commit the rules and treat them as code (PR-reviewed)
5. Set up a `firebase deploy --only firestore:rules` step in CI

**Verification**

After committing the rules, write a test using `@firebase/rules-unit-testing`:

```ts
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

test("client cannot read another tenant's HYP credentials", async () => {
  const env = await initializeTestEnvironment({ ... });
  const user = env.authenticatedContext("user1", { companyId: "A", storeId: "A" });
  await assertFails(user.firestore().doc("STORES/B/private/data").get());
});
```

---

### SEC-22 — Tenant data stored in root collections

Multiple collections that should be tenant-scoped live at the root level:

| Collection | File | Risk |
|---|---|---|
| `paymentRedirects` | [`payments/api/createPaymentRedirect.ts:118`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts) | Payment tokens — high value |
| `landingLeads` | [`notifications/triggers/landingLead.tsx:10`](../../../functions/src/modules/notifications/triggers/landingLead.tsx) | Lead data, possible PII |
| `profile` (singular) | [`customers/api/createCompany.ts:28`](../../../functions/src/modules/customers/api/createCompany.ts) | Customer profile data |
| `profiles` (plural) | [`customers/internal/profileService.ts:6`](../../../functions/src/modules/customers/internal/profileService.ts) | Same — different collection name due to typo |
| `organizations` | [`api/organizationActionsApi.ts`](../../../functions/src/api/organizationActionsApi.ts) | B2B account data — see SEC-11 |

**Why this matters**

CLAUDE.md explicitly requires: *"All tenant-scoped data lives under `{companyId}/{storeId}/{collectionName}` — never use a root collection."* The exceptions are `STORES/{storeId}` and `STORES/{storeId}/private`.

Root collections risk:
- Easier accidental cross-tenant reads
- Harder to write correct `firestore.rules` (rules at root must `match /collection/{id}` with a `where` check, vs path-based `match /{companyId}/{storeId}/{coll}/{id}`)
- Index bloat across tenants

**Remediation**

Migrate each root collection to a tenant-scoped path. For lookup-by-opaque-token reads where the caller has no tenant context (e.g. a payment redirect link), use `collectionGroup` queries:

```ts
const snap = await db.collectionGroup("paymentRedirects")
  .where("token", "==", token)
  .limit(1)
  .get();
```

Also fix the singular `profile` vs plural `profiles` inconsistency while migrating.

---

### SEC-20 — Weak `paymentRedirects` token (8 chars, root collection, `.set()`)

**File:** [`functions/src/modules/payments/api/createPaymentRedirect.ts:118-127`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts)

```ts
const token = randomBytes(6).toString("base64url"); // 8 chars
await admin.firestore().collection("paymentRedirects").doc(token).set(...);
```

**Exploitation**

- 6 bytes = 48 bits of entropy. Brute-forcing for valid tokens is feasible at scale (~3.5 × 10^14 combinations — possible against any throttled lookup).
- `.set()` silently overwrites on collision instead of failing loudly with `.create()` + `ALREADY_EXISTS`.
- Token collision → second payment overwrites first → original payment data lost.

**Remediation**

```ts
const token = randomBytes(16).toString("base64url"); // 22 chars, 128 bits
await ref.create({ ... }); // throws ALREADY_EXISTS on collision; caller retries with new token
```

Compare with `paymentLinks` (which already uses 12+ bytes — the same hardening should apply here).

---

### SEC-21 — `recordHypDirectPayment.consumeResult` is best-effort

**File:** [`functions/src/modules/ledger/api/recordHypDirectPayment.ts:233-255`](../../../functions/src/modules/ledger/api/recordHypDirectPayment.ts)

If `validateAndConsumeLink` fails AFTER `postTransaction` succeeds (reason: `consume_failed`, not `already_used`), the link remains unconsumed. Subsequent browser replay would retry both — `postTransaction` is idempotent (OK), but the replay could potentially re-consume the link during the failure window.

**Exploitation**

Narrow time window where a manually-replayed payment link could be considered valid again. Requires an attacker who knows the link token (which they typically would, since they just used it).

**Remediation**

Either:
1. Retry `validateAndConsumeLink` inline (3 attempts with exponential backoff) so post-transaction consume failures are rare
2. Surface the partial-failure explicitly to the caller, log loudly, and add a cleanup job that consumes orphaned links

---

## 🟡 Section G — Information disclosure

### SEC-14 — `appInit` returns full company/store docs based on Origin header

**File:** [`functions/src/modules/application/api/init.ts:5-38`](../../../functions/src/modules/application/api/init.ts)

Returns full `company` and `store` doc data based on the `Origin` header alone. Possibly intentional for bootstrapping (so the store's UI knows which tenant it is), but:

- Returns `company.docs[0]/stores.docs[0]` blindly without checking they exist (will throw on empty)
- No rate limit
- Schemas may contain fields that aren't intended for public exposure (internal settings, IDs, configuration)

**Remediation**

1. Add try/catch + return `{ found: false }` on empty
2. Audit the shape of `TStore`/`TCompany` for fields that shouldn't be public:
   - Internal flags
   - Webhook URLs
   - Email addresses
   - Cost / pricing tier
3. Return only a curated public subset:
   ```ts
   return {
     found: true,
     store: { id, name, theme, supportedLocales, defaultLocale },
     company: { id, name },
   };
   ```
4. Consider rate limiting (Firestore counter with TTL, or origin allowlist)

---

## 🎯 Phased remediation plan

### Phase 0 — Rotate credentials (do this right now, takes ~30 minutes)

1. ✅ Rotate Mixpanel API token (SEC-01)
2. ✅ Rotate npm publish token, delete `_secrets` (SEC-15)
3. ✅ Verify/rotate ezCount demo key in `EZcount.NodeJs.example/` (SEC-16)
4. ✅ Verify/rotate OpenAI key in `.env.jsdev-stores-prod` (SEC-17)
5. ✅ Delete `EZcount.NodeJs.example/` folder entirely

**Once Phase 0 is done, the leaked credentials are dead. Everything else can be tackled at code-review pace.**

### Phase 1 — Add the missing front gates (today, ~1 hour)

6. ✅ Add admin check to `createCompanyClient` (SEC-02)
7. ✅ Add admin check to `createPayment` + `createPaymentRedirect`, server-resolve storeId (SEC-03)
8. ✅ Add admin check to `createInvoice`, server-resolve storeId (SEC-04)
9. ✅ Add auth check + schema to `uiLogs` (SEC-13)
10. ✅ Add admin check to `chargeOrder` (SEC-08)
11. ✅ Add admin check to `createDeliveryNote` (SEC-09)

These are the highest-impact code changes. After Phase 1, the unauthenticated and under-authenticated attack surface is gone.

### Phase 2 — Stop logging credentials (today, ~30 minutes)

12. ✅ Build `sanitizeForLog` helper
13. ✅ Apply to every `logger.write` in `hypPaymentService` (SEC-05) — 10 sites
14. ✅ Apply to every `logger.info` in `ezCountService` (SEC-06) — 3 sites
15. ✅ Remove `storePrivateData` from `appApi/index.ts` log (SEC-18)
16. ✅ Remove `console.log("storePrivateData", JSON.stringify(...))` (SEC-05)
17. ✅ Drop stack traces from Firestore `eventBusAttempts` (SEC-19)

### Phase 3 — Lock down the database (this week, ~half day)

18. ✅ Pull deployed `firestore.rules` into the repo, commit (SEC-07)
19. ✅ Audit & tighten rules (admin-only on `STORES/*/private`, server-only on money collections)
20. ✅ Set up `@firebase/rules-unit-testing` and write tests for cross-tenant isolation
21. ✅ Add `firebase deploy --only firestore:rules` to CI

### Phase 4 — Trust the server, not the client (this week, ~half day)

22. ✅ Server-resolve tenant in `migrateProfilesToMultiOrg` (SEC-10)
23. ✅ Server-resolve org ownership in `getOrganizationActions` (SEC-11)
24. ✅ Server-resolve `payer.organizationId` in `recordHypJ5Auth` (SEC-12) — **money correctness**

### Phase 5 — Tenant-scope the root collections (next sprint)

25. ✅ Migrate `paymentRedirects` to tenant-scoped path with `collectionGroup` lookup (SEC-22)
26. ✅ Migrate `landingLeads`, `profile`(s), `organizations` paths
27. ✅ Strengthen `paymentRedirects` token: 16 bytes + `.create()` instead of `.set()` (SEC-20)

### Phase 6 — Harden remaining minor surface (next sprint)

28. ✅ Curate `appInit` response shape, add rate limit (SEC-14)
29. ✅ Retry consume in `recordHypDirectPayment` or add orphan cleanup (SEC-21)

---

## ✅ Defense-in-depth recommendations (post-remediation)

After Phases 0-6, the immediate issues are resolved. To prevent the next leak, add:

### Pre-commit hooks
- **`gitleaks`** or **`trufflehog`** to block secrets from ever entering the repo
- **`eslint-plugin-security`** rules for the obvious patterns (`eval`, `child_process` with concat'd input, etc.)
- **`@typescript-eslint/no-floating-promises`** to catch swallowed errors

### CI checks
- Run **`gitleaks`** on every PR
- Run a **secret-rotation reminder** quarterly
- Run **`firebase deploy --only firestore:rules --dry-run`** in CI to ensure rules compile

### Logging discipline
- Make `logger.info({ ...sensitive })` impossible by wrapping the logger:
  ```ts
  // platform/safeLogger.ts
  export const logger = {
    info: (msg: string, ctx?: Record<string, unknown>) =>
      _logger.info(msg, ctx ? sanitizeForLog(ctx) : undefined),
    // ... etc
  };
  ```
- ESLint rule banning bare `console.log` in `functions/src/`

### Secret management
- All production secrets in **Firebase Secret Manager** via `defineSecret`
- All dev machine secrets in **1Password** or env vars sourced from a CLI tool
- Never store secrets in `_secrets`, `.env.*`, `notes.txt` — period

### Auth-claim audit
- Quarterly audit: list every callable in `functions/src/modules/*/api/`, verify each has appropriate auth check
- Add a lint rule that flags `onCall(async (request) => { ... })` without `request.auth?.token.*` somewhere in the first 10 lines

### Threat modeling
- For each new Cloud Function PR, the description must include:
  - Who is authorized to call this?
  - What input is trusted (token claims) vs untrusted (request body)?
  - What sensitive data is read / written?
  - What's the impact of unauthorized invocation?

---

## How to use this document

- **Before deploying anything new**, check this document and confirm none of the open items regress
- **Each finding has an ID** (`SEC-NN`) — use it as a GitHub issue / Linear ticket reference
- **Mark resolved findings** with ✅ inline in the document as they're fixed, with a link to the commit/PR
- **Re-run the audit quarterly** — at minimum, after every major migration

Last updated: 2026-06-03
Next review due: 2026-09-03 (or after the next major migration, whichever is sooner)
