---
name: project-no-firestore-rules
description: @jsdev-store has no firestore.rules file in the repo — no rules-layer compensating control for callable IDOR bugs
metadata:
  type: project
---

As of 2026-05-30 there is NO `firestore.rules` file anywhere in the @jsdev-store repo, and `functions/firebase.json` declares no `firestore` block (only a `functions` codebase).

**Why:** Firestore security rules are normally the second line of defense behind a missing/buggy auth check in a Cloud Function. Here that compensating control is absent (or managed/deployed out-of-band, unverified). Cloud Functions use the Admin SDK, which bypasses rules anyway — so for server writes there is no rules safety net at all.

**How to apply:** When auditing any callable IDOR or missing-auth finding, do NOT downgrade severity on the assumption that rules will catch it — they won't. Treat the function-layer check as the only line of defense. If you cannot find/verify deployed rules, raise the rules-absence itself as a platform gap. Related: [[project-auth-tenant-model]].
