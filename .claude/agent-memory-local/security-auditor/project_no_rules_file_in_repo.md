---
name: project-no-rules-file-in-repo
description: This repo has NO firestore.rules file tracked in git; rules are managed by hand in the Firebase console and prod is currently open allow-all
metadata:
  type: project
---

There is **no `firestore.rules` file anywhere in the @jsdev-store repo** (confirmed via `git ls-files | grep .rules` → empty). `functions/firebase.json` declares only `firestore.indexes`, no `rules` pointer. Firestore security rules are edited by hand in the Firebase console.

The live deployed prod rules (jsdev-stores-prod, as of 2026-06-26) contain a top-level `match /{document=**} { allow read, write: if true; }` — a global allow-all. Because Firestore evaluates rules as an OR across all matches, this single rule makes **every document world-read/write**, including any new root collection (e.g. `SUPER_ADMIN_AUDIT`) and all `STORES/*/private/*` secrets.

**Why:** Long-standing, separately-tracked remediation (see auto-memory `project_prod_rules_open.md`, 2026-06-25). Remediation still pending.

**How to apply:** For ANY feature that adds a new collection or relies on rules to deny client access, the rules assumption does NOT hold today. Flag that (a) no rules file ships with the change to lock the new collection down, and (b) under current prod rules the collection is fully exposed. The prioritized fix is always: introduce a real `firestore.rules` in the repo, wire it in `firebase.json`, replace the global allow-all with default-deny, and add explicit `allow read, write: if false` for server-only collections. Do not double-count the pre-existing open-rules platform issue as a NEW critical of the feature under audit — scope it as "feature ships into an unsafe rules baseline + ships no rules to fix it."
