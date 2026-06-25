/**
 * superAdmin module — public surface.
 *
 * Currently: contracts + types only (B1 skeleton).
 *
 * Callables are added in subsequent tasks:
 *   B2 — read/list/get/search callables (saListStores, saListOrders, saGetOrder,
 *         saSearchOrders, saListProducts, saGetProduct, saSearchProducts,
 *         saListProfiles, saGetProfile, saSearchProfiles)
 *   B3 — curated-write callables + audit (saSetOrderStatus, saSetProductVisibility,
 *         saSetProductStock, saListAuditEntries)
 *
 * All 14 callables will be re-exported here so that functions/src/index.tsx
 * can wire the entire module in one line:
 *   export { <callable>, ... } from "./modules/superAdmin";
 */

// ─── Contracts (schemas + inferred types) ────────────────────────────────────
export {
	// Primitives
	TenantRefSchema,
	ListReqSchema,
	GetReqSchema,
	// Write-request schemas
	SearchOrdersReqSchema,
	SearchProductsReqSchema,
	SearchProfilesReqSchema,
	SetOrderStatusReqSchema,
	SetProductVisibilityReqSchema,
	SetProductStockReqSchema,
	// Audit schemas
	SuperAdminActionSchema,
	AuditEntrySchema,
	ListAuditReqSchema,
} from "./contracts";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
	// Primitives
	TenantRef,
	ListReq,
	GetReq,
	// Error + envelope
	SuperAdminError,
	Result,
	// List-row projections
	StoreListItem,
	OrderListRow,
	ProductListRow,
	ProfileListRow,
	// Search request types
	SearchOrdersReq,
	SearchProductsReq,
	SearchProfilesReq,
	// Write-request types
	SetOrderStatusReq,
	SetProductVisibilityReq,
	SetProductStockReq,
	WriteResult,
	// Audit
	SuperAdminAction,
	AuditEntry,
	ListAuditReq,
	// Re-exported core entity types (one import location for the frontend)
	TOrder,
	TProduct,
	TProfile,
} from "./contracts";

// ─── B2: Read callables ───────────────────────────────────────────────────────
export { saListStores } from "./api/listStores";
export { saListOrders } from "./api/listOrders";
export { saGetOrder } from "./api/getOrder";
export { saSearchOrders } from "./api/searchOrders";
export { saListProducts } from "./api/listProducts";
export { saGetProduct } from "./api/getProduct";
export { saSearchProducts } from "./api/searchProducts";
export { saListProfiles } from "./api/listProfiles";
export { saGetProfile } from "./api/getProfile";
export { saSearchProfiles } from "./api/searchProfiles";

// ─── B3: Write callables + audit ─────────────────────────────────────────────

// E1 saSetOrderStatus: DEFERRED pending owner O-2 decision on onOrderUpdate
// side-effect semantics (completeOrder / cancelOrder / refundOrder fire on
// certain status transitions). Do not implement until the product decision is
// documented and approved.
// export { saSetOrderStatus } from "./api/setOrderStatus";

export { saSetProductVisibility } from "./api/setProductVisibility";
export { saSetProductStock } from "./api/setProductStock";
export { saListAuditEntries } from "./api/listAuditEntries";
