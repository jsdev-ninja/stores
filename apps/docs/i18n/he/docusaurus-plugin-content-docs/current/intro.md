---
slug: /
sidebar_position: 1
title: Overview
---

# Storebrix Docs

The **single source of truth** for the `@jsdev-store` platform — architecture,
modules, payment/ledger flows, conventions, and runbooks.

If you learn or decide something durable about how the system works, write it
here. If a page is wrong or missing, fix it as part of your change.

## Layout

- **Modules** — one page per backend module (`functions/src/modules/{name}`),
  describing its purpose, owned data, public surface, and flows.

## Conventions (quick reference)

- **Money** — stored as integer **agorot** (1 ILS = 100 agorot). Convert to
  shekels only at external boundaries (e.g. the HYP gateway).
- **Timestamps** — epoch **millis** (`Date.now()`). Never Firestore `Timestamp`.
- **Tenancy** — all data is scoped per `{companyId}/{storeId}`. Never read or
  query unscoped.

## Running these docs

```bash
# from apps/docs
npm run start   # dev server on http://localhost:5179
npm run build   # static build
```
