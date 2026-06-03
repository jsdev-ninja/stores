# 🔴 Critical Security Findings

These are exploitable today. Several allow unauthenticated callers to take destructive actions, leak credentials, or charge money against arbitrary stores.

**Estimated time to remediate Phase 1 (the worst 7): a few hours.**

---

## SEC-01 🔴 Mixpanel API token committed to source

**File:** [`functions/src/modules/analytics/api/mixpanelData.ts:16`](../../../functions/src/modules/analytics/api/mixpanelData.ts)

**The issue**

```ts
authorization: "Basic OWM5NWIxZWZkOGI2Y2VmYmRmZDI1NmQ2NzdhNzg0OGQ6",
```

Base64 decoded: `9c95b1efd8b6cefbdfd256d677a7848d:` — a live Mixpanel service-account secret committed to the repo.

**Impact**

Anyone who clones the repo (or sees the source) can read/write to project_id 2965387. Mixpanel data is product-analytics — its loss is reputational and may expose customer behavior data, but no money.

**Fix**

1. **Rotate the secret immediately** in the Mixpanel dashboard.
2. Move the new secret to Firebase secret manager:
   ```bash
   firebase functions:secrets:set MIXPANEL_API_TOKEN
   ```
3. Read it in the function with `defineSecret`:
   ```ts
   import { defineSecret } from "firebase-functions/params";
   const mixpanelToken = defineSecret("MIXPANEL_API_TOKEN");
   // ... in the function:
   authorization: `Basic ${Buffer.from(mixpanelToken.value() + ":").toString("base64")}`,
   ```
4. Scrub git history with `git filter-repo` (or accept the leak since rotation happened; the old token is dead).

---

## SEC-02 🔴 `createCompanyClient` has zero authentication

**File:** [`functions/src/modules/customers/api/createCompany.ts:5-31`](../../../functions/src/modules/customers/api/createCompany.ts)

**The issue**

```ts
export const createCompanyClient = onCall(async (request) => {
  // todo: check if user is admin   ← the bug is acknowledged
  const newCompany = request.data;
  const user = await admin.auth().createUser({
    email: newCompany.email,
    password: newCompany.password,
    displayName: newCompany.fullName,
  });
  // ... writes profile doc
});
```

The handler creates Firebase Auth users with chosen passwords and writes profile docs. No `request.auth` check at all.

**Impact**

Any unauthenticated client on the internet can call this Cloud Function and:
- Create arbitrary Firebase Auth users (account takeover vector if the email belongs to a real customer)
- Write profile data into the root `profile/{uid}` collection
- If profile data drives admin claims downstream, this is full privilege escalation

**Fix**

```ts
export const createCompanyClient = onCall(async (request) => {
  if (!request.auth?.token.admin) {
    throw new HttpsError("permission-denied", "Admin only");
  }
  const companyId = request.auth.token.companyId;
  const storeId = request.auth.token.storeId;
  // ... derive tenant from token claims, NEVER from request.data
  const newCompany = createCompanyInputSchema.parse(request.data); // add Zod schema
  // ... rest
});
```

---

## SEC-03 🔴 `createPayment` / `createPaymentRedirect` accept storeId from client, no auth

**Files:**
- [`functions/src/modules/payments/api/createPayment.ts:24-105`](../../../functions/src/modules/payments/api/createPayment.ts)
- [`functions/src/modules/payments/api/createPaymentRedirect.ts:34-141`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts)

**The issue**

Both functions take an `order` object from the client (including `order.storeId`) and use that to load `STORES/{storeId}/private/data` (HYP credentials) and sign a payment link. No `context.auth` check, no admin gating, no comparison of token tenant vs client `storeId`.

**Impact**

An unauthenticated attacker can:
1. **Enumerate** which storeIds have HYP credentials configured (information disclosure)
2. **Generate signed HYP forms** charging arbitrary amounts to any victim store's masof
3. Combined with `SEC-05` (credentials in logs), this is amplified — they could test their generated form against the victim and read the response

**Fix**

Match the pattern in the newer `chargeOrder` and `createHypCheckoutPayment`:

```ts
export const createPayment = onCall(async (request) => {
  if (!request.auth?.token.admin) {
    throw new HttpsError("permission-denied", "Admin only");
  }
  const { companyId, storeId } = request.auth.token;
  if (!companyId || !storeId) {
    throw new HttpsError("permission-denied", "Tenant claim missing");
  }
  // Load the order server-side, do NOT trust request.data.order
  const order = await ordersStore.getOrder({ companyId, storeId, orderId: request.data.orderId });
  // ... rest
});
```

---

## SEC-04 🔴 `createInvoice` has no auth + accepts storeId from client

**File:** [`functions/src/modules/documents/api/createInvoice.ts:16-134`](../../../functions/src/modules/documents/api/createInvoice.ts)

**The issue**

```ts
const storeId = request.data.storeId; // ← from client
// ...
const storePrivateData = await admin.firestore()
  .doc(`STORES/${storeId}/private/data`).get(); // ezcount_key, etc.
```

No `auth?.token.admin` gate. `auth?.token.companyId/storeId` is referenced later but the invoice gets created against the client-supplied `storeId`.

**Impact**

Unauthenticated attacker can issue arbitrary tax invoices via any victim store's ezCount account, and corrupt order docs cross-tenant.

**Fix**

```ts
const auth = request.auth;
if (!auth?.token.admin) throw new HttpsError("permission-denied");
const storeId = auth.token.storeId; // from token, not request.data
const companyId = auth.token.companyId;
```

---

## SEC-05 🔴 HYP password + API KEY logged on every payment call

**Files:**

- [`functions/src/services/hypPaymentService/index.ts`](../../../functions/src/services/hypPaymentService/index.ts) — lines 69, 87, 126, 140, 156, 167, 183, 197, 210, 220
- [`functions/src/modules/payments/api/createPaymentRedirect.ts:70`](../../../functions/src/modules/payments/api/createPaymentRedirect.ts)
- [`functions/src/appApi/index.ts:140-147`](../../../functions/src/appApi/index.ts)

**The issue**

`params` and `transParams` in `chargeJ5Transaction` and `createPaymentLink` both contain `PassP` (Masof password) and `KEY` (HYP API key). All 10 `logger.write` calls log them.

`createPaymentRedirect.ts:70`:
```ts
console.log("storePrivateData", JSON.stringify(storePrivateData));
// storePrivateData.hypData includes KEY, password, masof
```

`appApi/index.ts:140`:
```ts
logger.write({ ..., storePrivateData, store, order });
// storePrivateData includes ezcount_key AND hypData
```

**Impact**

Anyone with log read access (operators, support, any leaked log dashboard credential) has every store's HYP credentials in plaintext. They can then:
- Initiate charges against any store via HYP directly
- Read transaction history
- Refund/cancel transactions

**Fix**

Build a sanitized log payload helper:

```ts
function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const REDACT_KEYS = new Set(["KEY", "PassP", "password", "api_key", "ezcount_key", "masof"]);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      REDACT_KEYS.has(k) ? "[REDACTED]" : (typeof v === "object" && v !== null ? sanitizeForLog(v as any) : v),
    ]),
  );
}
```

Then replace every `logger.write({ ..., params })` with `logger.write({ ..., params: sanitizeForLog(params) })`. Delete the `console.log("storePrivateData", ...)` line entirely — never log private credentials.

---

## SEC-06 🔴 ezCount api_key logged on every doc create

**File:** [`functions/src/services/ezCountService/index.ts`](../../../functions/src/services/ezCountService/index.ts) — lines 81-85, 116-120, 231-235

**The issue**

```ts
logger.info("ezcount params", { params }); // params.api_key included
// ...
logger.info("ezcount res", { result: res }); // res.config.data has the request body
```

**Impact**

Same as SEC-05 but for ezCount. Operator can issue arbitrary invoices on any store.

**Fix**

Sanitize `params` before logging (same helper as SEC-05). Log only `res.data`, never the full axios response object — `res.config.data` echoes the request including the api_key.

---

## SEC-07 🔴 No `firestore.rules` file exists in the repo

**File missing:** `functions/firestore.rules` (or any `*.rules`)

**The issue**

`functions/firebase.json` declares `firestore.indexes` but no `firestore.rules` entry. The actually-deployed rules are unknown and not version-controlled.

**Impact**

Every Firestore document access from any client (including the website) is governed by an unknown, possibly default-allow rules file. Tenant isolation, money documents (`transactions`, `budgetRecords`, `paymentLinks`, `paymentRedirects`), HYP credentials (`STORES/{id}/private`), and admin checks all depend on rules that aren't in the repo.

**Fix**

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
   - Default-deny posture
   - `STORES/{storeId}/private/**` must be admin-only (no client read)
   - `transactions`, `budgetRecords`, `paymentLinks` — server-write only
   - All tenant-scoped reads check `request.auth.token.companyId == companyId && storeId == storeId`
4. Commit the rules and treat them as code (PR-reviewed).

---

## SEC-08 🟠 `chargeOrder` lacks admin role check

**File:** [`functions/src/modules/payments/api/chargeOrder.ts:26-197`](../../../functions/src/modules/payments/api/chargeOrder.ts)

**The issue**

Checks `context.auth?.token.storeId/companyId` exist, but does NOT check `token.admin`. Any authenticated user in the tenant (a logged-in customer) could attempt to capture a J5 charge on someone else's order.

**Impact**

A customer in the same store could trigger J5 capture against another customer's order — moves money via HYP.

**Fix**

```ts
if (!context.auth?.token.admin) {
  throw new HttpsError("permission-denied", "Admin only");
}
```

---

## SEC-09 🟠 `createDeliveryNote` lacks admin role check

**File:** [`functions/src/modules/documents/api/createDeliveryNote.ts:10-52`](../../../functions/src/modules/documents/api/createDeliveryNote.ts)

**The issue**

Checks token has `companyId/storeId` but not `admin`. Any authenticated user can create delivery notes and pass arbitrary `order` payload from the client.

**Impact**

Any logged-in customer can manufacture delivery notes against ezCount — financial/document fraud.

**Fix**

Add admin claim check; validate the `order` against a server-loaded copy (don't trust the client payload).

---

## SEC-10 🟠 `migrateProfilesToMultiOrg` accepts companyId/storeId from client even though admin-gated

**File:** [`functions/src/modules/customers/api/migrateProfiles.ts:6-96`](../../../functions/src/modules/customers/api/migrateProfiles.ts)

**The issue**

Admin claim is verified, but `companyId/storeId` come from `opts.data` not token claims. An admin scoped to store A could migrate profiles in store B.

**Impact**

Cross-tenant data mutation by any admin.

**Fix**

```ts
const companyId = opts.auth.token.companyId;
const storeId = opts.auth.token.storeId;
// NOT: const { companyId, storeId } = opts.data;
```

---

## SEC-11 🟠 `getOrganizationActions` reads root-level path without tenant scoping

**File:** [`functions/src/api/organizationActionsApi.ts:5-34`](../../../functions/src/api/organizationActionsApi.ts)

**The issue**

Admin check is present, but the read path `organizations/{organizationId}/actions` is at the root, not under `{companyId}/{storeId}`. Any admin in any tenant can read another tenant's organization actions if they know the organizationId.

**Impact**

Cross-tenant data leak among admins.

**Fix**

Either:
1. Move the collection under `{companyId}/{storeId}/organizations/{id}/actions` and require ownership match, OR
2. Verify the organization belongs to the caller's tenant before reading:
   ```ts
   const orgDoc = await db.doc(`organizations/${orgId}`).get();
   if (orgDoc.data()?.companyId !== auth.token.companyId) {
     throw new HttpsError("permission-denied");
   }
   ```

---

## SEC-12 🟠 `recordHypJ5Auth` trusts client-supplied `payer.organizationId`

**File:** [`functions/src/modules/ledger/api/recordHypJ5Auth.ts:35-42, 141`](../../../functions/src/modules/ledger/api/recordHypJ5Auth.ts)

**The issue**

```ts
const payer = {
  organizationId: request.data.payer.organizationId, // from client
  clientId: request.data.payer.clientId,
  billingAccountId: request.data.payer.billingAccountId,
};
// ... persisted into the Transaction doc
// ... reduceDebtOnTransactionPosted later credits that org's debt
```

**Impact**

A real B2B customer making a real payment can spoof `payer.organizationId` to reduce a different (e.g., competitor) organization's outstanding debt within the same tenant. The money was paid, but the credit lands on the wrong B2B account.

**Fix**

Match `recordHypDirectPayment` (lines 172-198): load the order server-side and read `order.organizationId/client.id/billingAccount.id` from the stored doc. Never trust the client's payer fields.

---

## SEC-13 🟡 `uiLogs` callable accepts arbitrary data, no auth

**File:** [`functions/src/index.tsx:10-13`](../../../functions/src/index.tsx)

**The issue**

```ts
export const uiLogs = onCall(async (request) => {
  functionsV2.logger.write(request.data);
});
```

**Impact**

Anyone can flood production logs with arbitrary payloads. Cost amplification ($$), log volume DoS, log-injection attacks against any tooling that parses logs.

**Fix**

```ts
export const uiLogs = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated");
  const parsed = UiLogSchema.parse(request.data); // Zod schema, capped sizes
  functionsV2.logger.write({
    ...parsed,
    userId: request.auth.uid,
    source: "ui",
  });
});
```

---

## SEC-14 🟡 `appInit` is unauthenticated and leaks per-domain company/store data

**File:** [`functions/src/modules/application/api/init.ts:5-38`](../../../functions/src/modules/application/api/init.ts)

**The issue**

Returns full `company` and `store` doc data based on the `Origin` header alone. Returns `company.docs[0]/stores.docs[0]` blindly without checking they exist (will throw on empty), and there's no rate limit.

**Fix**

- Add try/catch + return `{ found: false }` on empty
- Audit the shape of `TStore`/`TCompany` for fields that shouldn't be public (private settings, internal IDs)
- Consider adding a rate limit (Firebase doesn't ship one — use a Firestore counter with TTL or check origin against a known-list)
