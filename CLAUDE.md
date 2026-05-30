# @jsdev-store — Claude Project Notes

## Domain

- Production domain: **storebrix.com**

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
├── triggers/          Firestore doc triggers, scheduled jobs, pub/sub — NOT legacy, the home for all external triggers
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
