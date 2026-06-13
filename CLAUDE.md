# @jsdev-store

# HARD RULES

- NEVER run commands/CLI if you not sure what command do
- NEVER add args to commands if you not sure what is do
- ALWAYS make sure before run coomand/CLI u understard how its works first

## User Roles

At the start of each session, determine who you are talking to. If unknown, ASK:
"Who am I working with — the developer or the app owner?"

### Developer (Philip) — FULL ACCESS

- Can do anything: architecture changes, refactors, dependencies, deployments.
- Can make and approve large decisions.
- No restrictions.

### App Owner (David) — RESTRICTED

-This person is NOT a developer and does not read code.
Explain everything in plain, non-technical language. No code dumps.

- Before any restricted action, STOP and say:
  "This needs the developer's approval — I've noted it for them."
- when. work with David dont ask question about git handle it alone.
- make sure before start task you update up date date main veersion if code, use git pull or fetch

- if you ask question or needd permission from onwer, or for working locale machime, alway ask and descibe what you need in **Hebrew**.

- ALLOWED:
  - allow content/text changes, copy, images.
  - allow fix small bugs, that without regression risk.
  - allow make ui ux changed that not break api contract and busniess logic
  - allow add small feature that not effect on core functionality and dont have regression risk
  - allow add feature for admin panel that dont create regression
  - always create new branch and create pull
  - if risk low, merge, if big wait for review from Philip

- NOT ALLOWED without developer approval:
  - NEVER WORK ON MAIN BRANCH ALWAYS WORK ON FEATURE BRANCH
  - NEVER allow any code or database migration
  - NEVER allow schema changes for entities defined in @jsdev-core package
  - NEVER allow code breaking changes
  - NEVER make large/irreversible decisions on the owner's behalf.

## Domain

- Production domain: **storebrix.com**

## worflow

- ALWAYS validate build complie before merge or commit
- ALWAYS validate lint before merge or commit

## Architecture

# @jsdev_ninja/core - shared package backend and frontend

- any change in this folder require package version update.
- make sure all apps and firebase function use same and latest version of @jsdev_ninja/core package.
- **When you bump the `@jsdev_ninja/core` version, you MUST also update the dependency to that exact new version in every consumer** — the client (`apps/store/package.json`) and the backend (`functions/package.json`). Do not leave consumers pointing at the old version. (On merge to `main`, CI publishes the new core version to npm; the backend installs it from the registry, so the version reference must match.)

### /Users/philbro/workspace/@jsdev-store/apps/store/src/websites

store spefics design by store id, used when design store specific pages/components

/Users/philbro/workspace/@jsdev-store/apps/store/src/components/renders
how we render store spefics components

## Dev / Preview Rules

- Only use test stores for dev and preview
- Never use `balasistore` or `pecanis` dev scripts
- Use `dev:test` (port 5175) and `dev:test2` (port 5176) (before run dev server check if its running already)

## Scope

- This chat is **only** for the `@jsdev-store` project
- Anything unrelated should be flagged and ignored

## Code conventions

### Timestamps

- Always use **`number`** (epoch millis via `Date.now()`) for all timestamps in Firestore docs and TypeScript types.
- **Do NOT use `FirebaseFirestore.Timestamp`** or `FieldValue.serverTimestamp()`. The project standardizes on plain millis for simpler JSON serialization, easier client/server sharing, and consistent comparison.
- When reading existing docs that may contain old `Timestamp` fields, convert to millis at the boundary.

### Money

- Store all monetary amounts as **integer agorot** (1 ILS = 100 agorot). Never floats for money in stored data.
- Convert to/from shekels only at external boundaries (e.g. HYP expects shekels — convert at the call site).

(we have legecy data in ILS, every time need udnerstard what legacy and what not)

### Tenant isolation (HARD RULE)

- This is a **multi-tenant** system. Data is scoped per `{companyId}/{storeId}`. **NEVER** read, search, or query data without scoping to the current tenant — unscoped access leaks data across stores/companies and is a critical security bug.
- **Algolia / external search indexes:** EVERY `index.search(...)` call MUST pass `filters: \`storeId:${storeId} AND companyId:${companyId}\``(use the order's / entity's own`storeId`+`companyId`, or the active store). Never search an index without this filter. Same for any other external index or cache.
- **Firestore:** always build paths with `FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName })` (see "Firestore paths" below). Never hand-build a path or use a root collection.
- When in doubt, derive `companyId`/`storeId` from the entity you already hold (e.g. `order.companyId` / `order.storeId`) or the auth token — never from unscoped client input.

## Backend module structure

The functions backend is a **modular monolith** under `functions/src/modules/{moduleName}/`. Every module follows the same shape.

### Folder layout

```
modules/{name}/
├── README.md          purpose, owned Firestore paths, public surface, conventions
├── index.ts           the ONLY public surface — exports the module's Cloud Functions + public schemas
├── events.ts          event type constants + Zod payload schemas (if the module emits/owns events)
├── types.ts           backend-only, module-private types/schemas (only if the module needs them)
├── api/               one file per Cloud Function endpoint (callable / https)
├── triggers/          Firestore doc triggers, scheduled jobs, pub/sub — NOT legacy, the home for all external
├── subscribers/       event-bus subscribers (react to events from this or other modules)
├── services/          business logic — one operation per file, verb-named
└── internal/          module-private impl (paths, stores) — MUST NOT be imported from outside the module
```

### File naming (one concept per file)

| Folder         | One file per…    | Filename                                     | Example                                         |
| -------------- | ---------------- | -------------------------------------------- | ----------------------------------------------- |
| `api/`         | Cloud Function   | function name = export = deployed name       | `createPayment.ts`                              |
| `triggers/`    | trigger          | `on{Resource}{Action}` or `{action}Schedule` | `onOrderCreated.ts`, `rollupBudgetsSchedule.ts` |
| `subscribers/` | subscription     | `{verb}On{EventName}`                        | `closeCartOnOrderPlaced.ts`                     |
| `services/`    | operation        | verb                                         | `placeOrder.ts`, `cancelOrder.ts`               |
| `internal/`    | entity (grouped) | `{entity}Store.ts`, `paths.ts`               | `transactionsStore.ts`                          |

- **No generic/layered file names** like `lifecycle.ts`, `writer.ts`, `service.ts`, `repository.ts`. Name files by what they DO (the operation), not the layer they live in. Data-only files (`paths.ts`, `events.ts`, `types.ts`, `constants.ts`) are the exception.

### Rules

- **Triggers / api / subscribers are THIN** — parse input, call a service, return. No business logic in entry points.
- **Services hold the business logic** and are entry-point-agnostic — the same `placeOrder(...)` can be called from a trigger, an api endpoint, or another service.
- A "service" that is only an `emitEvent` wrapper does **NOT** qualify — **always inline `emitEvent` at the call site. No `emit*.ts` wrapper files anywhere.**
- `internal/` is module-private. Never import it from another module. Cross-module use goes through the target module's `index.ts` (or its public `events.ts`).
- Side-effect errors that shouldn't abort the caller are caught + logged in the service; the core write propagates.

### Firestore paths

- All tenant-scoped data lives under `{companyId}/{storeId}/{collectionName}`. Build with `FirebaseAPI.firestore.getPath({ collectionName, companyId, storeId })` from `@jsdev_ninja/core` — never hand-build a path, never use a root collection.
- For lookup-by-opaque-token reads where the caller has no tenant context, use `db.collectionGroup(name).where("token","==",token).limit(1)` — do NOT promote the collection to root.
- Exceptions: `STORES/{storeId}` (store metadata), `STORES/{storeId}/private` (secrets).

### Idempotency (event-driven & external writes)

- Writers use a **deterministic doc id** per source + Firestore `.create()` (not `.set`). On `ALREADY_EXISTS` → treat as an idempotent no-op (return existing), never duplicate.
- Dedup key by source: subscriber `evt_{subscriber}_{eventId}` · api `idem_{idempotencyKey}` (client-generated) · external/HYP `hyp_{verifiedExternalId}`.

### Where schemas go

| Is it…                                                           | Goes in                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| A domain entity the **client also uses** (Order, Cart, Product…) | `@jsdev_ninja/core` (`packages/core/lib/entities`) |
| An **event payload** (subscribed by other modules)               | `modules/{x}/events.ts`                            |
| A type used **only inside one module**, backend-only             | `modules/{x}/types.ts`                             |
| A backend-wide shared schema (secrets, external protocol)        | `functions/src/schema/`                            |

### Logging

- Use `firebase-functions/v2` `logger` with **structured fields** (`logger.info("msg", { orderId, ... })`). No `console.log`. Never log secrets (API keys, passwords, payment-gateway credentials).
