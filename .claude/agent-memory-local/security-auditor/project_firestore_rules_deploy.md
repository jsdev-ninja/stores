---
name: project_firestore_rules_deploy
description: How Firestore security rules are (not) wired for deployment in @jsdev-store; client writes orders/cart directly so rules are the real boundary
metadata:
  type: project
---

The authoritative production Firestore ruleset is NOT checked into this repo. As of 2026-06-14, `functions/firebase.json` DOES declare a `firestore` block but it contains ONLY `"indexes": "firestore.indexes.json"` — there is NO `rules` key, so `firebase deploy` from this repo deploys indexes but never rules. Rules are managed out of band.

There is currently NO `firestore.rules` file anywhere in the repo (an earlier untracked one in the budget rebuild is gone). If someone wires it and runs `firebase deploy --only firestore`, it REPLACES the entire prod ruleset. It only grants reads to a few budget collections + STORES and `allow write: if false` for the catch-all — which would lock out the storefront.

**Why:** The client app writes Firestore directly (`FirebaseApi.firestore.update/setV2/set`) for `orders` (incl. `status` transitions), `cart`, products, etc., gated only by client-side `isValidAdmin`. The Firestore rules are the ONLY real server-side authorization boundary for those direct writes.

**How to apply:** When auditing any client-writable collection, do NOT assume `functions/firestore.rules` reflects production. Ask for the deployed ruleset. Treat order-status writes as client-reachable unless proven otherwise by the live rules. See [[project_budget_money_path]].
