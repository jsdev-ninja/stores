# superAdmin

Cross-store internal admin module — one actor, every store. Gives Philip a verified, audited surface for reading Orders/Products/Profiles across all tenants and performing three curated writes, replacing Firebase console spelunking and one-off ops scripts.

## Firestore paths owned

- `{companyId}/{storeId}/orders/{orderId}` — read-only (orders module owns writes)
- `{companyId}/{storeId}/products/{productId}` — read + E2/E3 writes
- `{companyId}/{storeId}/profiles/{profileId}` — read-only
- `STORES/{storeId}` — read-only (store metadata list)
- **`SUPER_ADMIN_AUDIT/{id}` (root collection — documented exception)**

  Justification: the audit log is cross-tenant by nature (one actor touching many stores); pathing it under any single tenant would fragment "show me everything I changed last week" into a fan-out query. A god-mode log also belongs to the *operator*, not the tenant, and integrity isolation is cleaner in a separate root collection that only these callables ever append to.

## Public surface

All callables are re-exported from `index.ts`. Wire into the deployed surface via `functions/src/index.tsx`.

### Read callables (10)

| Callable | Input | Responsibility |
|---|---|---|
| `saListStores` | `{}` | List all stores from root `STORES` |
| `saListOrders` | `ListReq` | List orders for a tenant, newest first, paginated |
| `saGetOrder` | `GetReq` | Get one full `TOrder` by id, tenant-scoped |
| `saSearchOrders` | `SearchOrdersReq` | Filter by exact id or by status, tenant-scoped |
| `saListProducts` | `ListReq` | List products for a tenant, paginated |
| `saGetProduct` | `GetReq` | Get one full `TProduct` by id, tenant-scoped |
| `saSearchProducts` | `SearchProductsReq` | Find by SKU (exact) or name (prefix/contains) |
| `saListProfiles` | `ListReq` | List profiles for a tenant, paginated |
| `saGetProfile` | `GetReq` | Get one full `TProfile` by id, tenant-scoped |
| `saSearchProfiles` | `SearchProfilesReq` | Find by exact email or phoneNumber |

### Write + audit callables (3)

| Callable | Input | Responsibility |
|---|---|---|
| `saSetProductVisibility` | `SetProductVisibilityReq` | **E2.** Toggle `Product.isPublished`; audit. Algolia re-syncs via `onProductUpdate`. |
| `saSetProductStock` | `SetProductStockReq` | **E3.** Set `Product.stock.quantity` (≥0); audit. |
| `saListAuditEntries` | `ListAuditReq` | List audit records newest-first, optional tenant filter, paginated. |

### Deferred

- **E1 `saSetOrderStatus`** — deferred pending product decision on `onOrderUpdate` side-effect semantics (completeOrder / cancelOrder / refundOrder fire on certain status transitions). Do not implement until documented and approved (see architecture.md Risk R-OrderTrigger).

## Conventions

1. **`verifySuperAdmin` first.** Every callable calls `verifySuperAdmin(request.auth)` before any Firestore access. A non-superAdmin caller receives `{ success: false, error: "unauthorized" }` — no data leaks.
2. **Tenant scoping via `getPath`.** All tenant-scoped reads and writes use `ordersCollectionPath` / `orderDocPath` / `productsCollectionPath` / etc. from `internal/paths.ts`, which delegates to `FirebaseAPI.firestore.getPath`. Never hand-build a path.
3. **Audit append-only.** `SUPER_ADMIN_AUDIT` documents are written with `.create()` (deterministic id: `sa_{uid}_{entityType}_{docId}_{field}_{ts}`). They are never updated or deleted. An `ALREADY_EXISTS` error on retry is treated as an idempotent no-op.
4. **Field write before audit.** For writes, the entity field is written first; the audit record is appended only on success. If the audit append fails after a successful field write, the error is logged at ERROR (`audit_write_failed`) and the callable still returns success — the field change is the user's intent; a missing audit row is a monitoring concern, not a data-integrity failure.
5. **Thin api/ layer.** `api/` files: verify → parse → call service/store → return. No business logic.
6. **No secrets in logs.** Structured logger fields include `uid`, `companyId`, `storeId`, `count` — never tokens, passwords, or payment credentials.
