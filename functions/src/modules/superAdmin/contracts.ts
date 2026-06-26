/**
 * Super-admin module contracts.
 *
 * All DTO schemas and inferred types for the superAdmin callable surface.
 * These are admin-only types shared between the backend callables and the
 * apps/super-admin frontend.
 *
 * IMPORTANT: Do NOT move these to @jsdev_ninja/core. They are not domain
 * entities used by the store frontend — they are admin DTOs that belong to
 * this module's public surface.
 *
 * The Zod schemas live here (backend) and are used for runtime validation via
 * safeParse. The frontend imports only the inferred TypeScript types from this
 * file (via the tsconfig path alias) and mirrors the per-field input schemas
 * locally when it needs form validation.
 */
import { z } from "zod";
import { OrderSchema } from "@jsdev_ninja/core";
import type { TOrder, TProduct, TProfile } from "@jsdev_ninja/core";

/**
 * Extracted status schema — breaks the TS2589 "type instantiation excessively
 * deep" error that occurs when OrderSchema.shape.status is referenced inline
 * inside .extend()/.refine() chains. Assigning it to a named variable with an
 * opaque z.ZodType<OrderStatus> annotation severs the deep inference chain
 * that the TypeScript checker cannot resolve.
 *
 * At runtime this is still exactly OrderSchema.shape.status — no change to
 * validation behaviour. The union values are preserved via OrderStatus type.
 */
const orderStatusSchema = (OrderSchema as unknown as { shape: { status: z.ZodTypeAny } }).shape.status;

// ─── Shared request primitives ───────────────────────────────────────────────

/**
 * Every tenant-scoped callable carries explicit ids — NEVER derived from a
 * single-store token (that is the R1 cross-tenant constraint).
 */
export const TenantRefSchema = z.object({
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});

export const ListReqSchema = TenantRefSchema.extend({
	limit: z.number().int().min(1).max(100).default(50),
	/** Opaque cursor: last doc id from the previous page. */
	cursor: z.string().optional(),
});

export const GetReqSchema = TenantRefSchema.extend({
	id: z.string().min(1),
});

export type TenantRef = z.infer<typeof TenantRefSchema>;
export type ListReq = z.infer<typeof ListReqSchema>;
export type GetReq = z.infer<typeof GetReqSchema>;

// ─── Error codes ─────────────────────────────────────────────────────────────

export type SuperAdminError =
	| "unauthorized" // missing / !== true superAdmin claim
	| "invalid_input" // zod parse failed
	| "not_found" // doc absent at tenant path
	| "invalid_status" // E1 target not in Order.status enum
	| "stock_uninitialized" // E3 on a product with no stock object
	| "forbidden" // path blocked by guardrail (e.g. private subcollections)
	| "internal";

// ─── Uniform result envelope ──────────────────────────────────────────────────

/**
 * Mirrors the project's existing { success, ... } callable return convention.
 */
export type Result<T> =
	| { success: true; data: T; nextCursor?: string }
	| { success: false; error: SuperAdminError };

// ─── List-row types (lean projections for list views) ────────────────────────

export type StoreListItem = {
	id: string; // storeId
	companyId: string;
	name: string;
	urls: string[];
};

export type OrderListRow = {
	id: string;
	date: number;
	status: TOrder["status"];
	paymentStatus: TOrder["paymentStatus"];
	/** client?.displayName ?? nameOnInvoice ?? null */
	customerName: string | null;
	/** cart.cartTotal AS STORED (legacy shekels) — display only, no math */
	total: number;
};

export type ProductListRow = {
	id: string;
	sku: string;
	/** First locale value, for the list. */
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

// Extract the Order status enum type to avoid TS2589 (excessive type inference
// depth) when embedding OrderSchema.shape.status inside a .refine() chain.
type OrderStatus = TOrder["status"];

export type SearchOrdersReq = z.infer<typeof TenantRefSchema> & {
	byId?: string;
	byStatus?: OrderStatus;
};

export type SearchProductsReq = z.infer<typeof TenantRefSchema> & {
	bySku?: string;
	byName?: string;
};

export type SearchProfilesReq = z.infer<typeof TenantRefSchema> & {
	byEmail?: string;
	byPhone?: string;
};

// Runtime schemas — the type annotations break the TS2589 inference loop while
// preserving the full runtime parse/validate behaviour.
export const SearchOrdersReqSchema: z.ZodType<SearchOrdersReq> = TenantRefSchema.extend({
	byId: z.string().min(1).optional(),
	/** Reuse the enum — single source of truth (via orderStatusSchema). */
	byStatus: orderStatusSchema.optional(),
}).refine((v) => v.byId || v.byStatus, { message: "one filter required" }) as unknown as z.ZodType<SearchOrdersReq>;

export const SearchProductsReqSchema: z.ZodType<SearchProductsReq> = TenantRefSchema.extend({
	bySku: z.string().min(1).optional(),
	byName: z.string().min(1).optional(),
}).refine((v) => v.bySku || v.byName, { message: "one filter required" }) as unknown as z.ZodType<SearchProductsReq>;

export const SearchProfilesReqSchema: z.ZodType<SearchProfilesReq> = TenantRefSchema.extend({
	byEmail: z.string().email().optional(),
	byPhone: z.string().min(1).optional(),
}).refine((v) => v.byEmail || v.byPhone, { message: "one filter required" }) as unknown as z.ZodType<SearchProfilesReq>;

// ─── Curated-write requests (E1 / E2 / E3) ───────────────────────────────────

// Explicit types for the write requests avoid TS2589 depth errors that arise
// when embedding OrderSchema (a deeply nested schema) in a .extend() chain.
export type SetOrderStatusReq = z.infer<typeof GetReqSchema> & {
	/**
	 * Reuse the entity enum so the API can never drift from the schema.
	 * Single source of truth: OrderSchema.shape.status
	 */
	status: OrderStatus;
};

export type SetProductVisibilityReq = z.infer<typeof GetReqSchema> & {
	isPublished: boolean;
};

export const SetOrderStatusReqSchema: z.ZodType<SetOrderStatusReq> = GetReqSchema.extend({
	/** Reuse the enum — single source of truth (via orderStatusSchema). */
	status: orderStatusSchema,
}) as unknown as z.ZodType<SetOrderStatusReq>;

export const SetProductVisibilityReqSchema: z.ZodType<SetProductVisibilityReq> = GetReqSchema.extend({
	isPublished: z.boolean(),
}) as unknown as z.ZodType<SetProductVisibilityReq>;

export type SetProductStockReq = z.infer<typeof GetReqSchema> & {
	/** Mirror ProductSchema.stock — must be a non-negative integer/float. */
	quantity: number;
};

export const SetProductStockReqSchema: z.ZodType<SetProductStockReq> = GetReqSchema.extend({
	quantity: z.number().min(0),
}) as unknown as z.ZodType<SetProductStockReq>;

export type WriteResult = {
	docId: string;
	field: string;
	oldValue: unknown;
	newValue: unknown;
};

// ─── Audit log ────────────────────────────────────────────────────────────────

export const SuperAdminActionSchema = z.enum([
	"setOrderStatus",
	"setProductVisibility",
	"setProductStock",
]);
export type SuperAdminAction = z.infer<typeof SuperAdminActionSchema>;

export const AuditEntrySchema = z.object({
	id: z.string(),
	actorUid: z.string(),
	actorEmail: z.string().nullable(),
	action: SuperAdminActionSchema,
	companyId: z.string(),
	storeId: z.string(),
	collection: z.enum(["orders", "products"]),
	docId: z.string(),
	field: z.enum(["status", "isPublished", "stock.quantity"]),
	oldValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
	newValue: z.union([z.string(), z.number(), z.boolean()]),
	/** Epoch millis via Date.now() — project convention, never Firestore Timestamp. */
	timestamp: z.number(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const ListAuditReqSchema = z.object({
	companyId: z.string().min(1).optional(),
	storeId: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(100).default(50),
	cursor: z.string().optional(),
});
export type ListAuditReq = z.infer<typeof ListAuditReqSchema>;

// ─── Re-export core entity types used in response shapes ─────────────────────
// The frontend callables module imports these from here so it has one import
// location for all super-admin types without depending on the full core package
// surface for admin-specific payloads.
export type { TOrder, TProduct, TProfile };

// ─── Firestore browser (god-mode read-only tree browser) ─────────────────────
// These callables are intentionally cross-tenant — they take raw Firestore paths
// (not tenant-scoped getPath paths). This is the ONE deliberate exception to the
// multi-tenant isolation rule, gated exclusively by the superAdmin claim +
// the `private` path guardrail that blocks secrets subcollections.

export const ListCollectionsReqSchema = z.object({
	/** Empty string or omitted = Firestore root. Must resolve to a document path (even segment count). */
	path: z.string().optional(),
});
export type ListCollectionsReq = z.infer<typeof ListCollectionsReqSchema>;
export type ListCollectionsRes = { collections: string[] };

export const ListDocumentsReqSchema = z.object({
	/** Must resolve to a collection path (odd segment count). */
	collectionPath: z.string().min(1),
	limit: z.number().int().min(1).max(100).default(50),
	/** Opaque cursor: last doc id from the previous page. Accepts null (callable SDK serializes undefined→null). */
	cursor: z.string().nullish(),
});
export type ListDocumentsReq = z.infer<typeof ListDocumentsReqSchema>;
export type ListDocumentsRes = { docs: { id: string }[]; nextCursor?: string };

export const GetDocumentReqSchema = z.object({
	/** Must resolve to a document path (even segment count, non-empty). */
	path: z.string().min(1),
});
export type GetDocumentReq = z.infer<typeof GetDocumentReqSchema>;
export type GetDocumentRes = { id: string; data: Record<string, unknown> | null };
