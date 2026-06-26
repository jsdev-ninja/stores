/**
 * MIRROR of functions/src/modules/superAdmin/contracts.ts — keep in sync.
 *
 * This file contains TYPE-ONLY copies of the DTO types that the frontend
 * needs from the superAdmin module's contracts. No Zod schemas are included
 * here — only the inferred TypeScript types.
 *
 * Why a mirror instead of a path alias to the source file?
 * The path alias approach (via tsconfig.json "@sa-contracts") causes tsc to
 * include contracts.ts in the compilation graph, which triggers TS2589
 * ("type instantiation excessively deep") from the deeply-nested Zod inference
 * chains in that file. Mirroring the inferred types here avoids pulling in
 * any Zod inference at all.
 *
 * When the backend contracts change, update this file too.
 */

import type { TOrder, TProduct, TProfile } from "@jsdev_ninja/core";

// ─── Error codes ─────────────────────────────────────────────────────────────

export type SuperAdminError =
	| "unauthorized"
	| "invalid_input"
	| "not_found"
	| "invalid_status"
	| "stock_uninitialized"
	| "forbidden"
	| "internal";

// ─── Uniform result envelope ──────────────────────────────────────────────────

export type Result<T> =
	| { success: true; data: T; nextCursor?: string }
	| { success: false; error: SuperAdminError };

// ─── Request primitives ───────────────────────────────────────────────────────

export type TenantRef = {
	companyId: string;
	storeId: string;
};

export type ListReq = TenantRef & {
	limit?: number;
	cursor?: string;
};

export type GetReq = TenantRef & {
	id: string;
};

// ─── List-row types ───────────────────────────────────────────────────────────

export type StoreListItem = {
	id: string;
	companyId: string;
	name: string;
	urls: string[];
};

export type OrderListRow = {
	id: string;
	date: number;
	status: TOrder["status"];
	paymentStatus: TOrder["paymentStatus"];
	customerName: string | null;
	total: number;
};

export type ProductListRow = {
	id: string;
	sku: string;
	name: string;
	isPublished: boolean;
	price: number;
	stockQuantity: number | null;
};

export type ProfileListRow = {
	id: string;
	displayName: string;
	email: string;
	phoneNumber: string | null;
};

// ─── Search requests ──────────────────────────────────────────────────────────

export type SearchOrdersReq = TenantRef & {
	byId?: string;
	byStatus?: TOrder["status"];
};

export type SearchProductsReq = TenantRef & {
	bySku?: string;
	byName?: string;
};

export type SearchProfilesReq = TenantRef & {
	byEmail?: string;
	byPhone?: string;
};

// ─── Curated-write requests ───────────────────────────────────────────────────

export type SetOrderStatusReq = GetReq & {
	status: TOrder["status"];
};

export type SetProductVisibilityReq = GetReq & {
	isPublished: boolean;
};

export type SetProductStockReq = GetReq & {
	quantity: number;
};

export type WriteResult = {
	docId: string;
	field: string;
	oldValue: unknown;
	newValue: unknown;
};

// ─── Audit log ────────────────────────────────────────────────────────────────

export type SuperAdminAction =
	| "setOrderStatus"
	| "setProductVisibility"
	| "setProductStock";

export type AuditEntry = {
	id: string;
	actorUid: string;
	actorEmail: string | null;
	action: SuperAdminAction;
	companyId: string;
	storeId: string;
	collection: "orders" | "products";
	docId: string;
	field: "status" | "isPublished" | "stock.quantity";
	oldValue: string | number | boolean | null;
	newValue: string | number | boolean;
	timestamp: number;
};

export type ListAuditReq = {
	companyId?: string;
	storeId?: string;
	limit?: number;
	cursor?: string;
};

// ─── Firestore browser ────────────────────────────────────────────────────────
// MIRROR of functions/src/modules/superAdmin/contracts.ts — keep in sync.

export type ListCollectionsReq = {
	path?: string; // "" / omit = Firestore root; else a DOCUMENT path
};

export type ListCollectionsRes = {
	collections: string[]; // child collection ids (secret `private` already filtered server-side)
};

export type ListDocumentsReq = {
	collectionPath: string;
	limit?: number;
	cursor?: string | null;
};

export type ListDocumentsRes = {
	docs: { id: string }[];
	nextCursor?: string;
};

export type GetDocumentReq = {
	path: string; // a DOCUMENT path
};

export type GetDocumentRes = {
	id: string;
	data: Record<string, unknown> | null;
};

// Re-export the core entity types so callers can import everything from one place.
export type { TOrder, TProduct, TProfile };
