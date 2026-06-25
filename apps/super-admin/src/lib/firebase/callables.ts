import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";
import type {
	Result,
	ListReq,
	GetReq,
	ListAuditReq,
	StoreListItem,
	OrderListRow,
	ProductListRow,
	ProfileListRow,
	WriteResult,
	SearchOrdersReq,
	SearchProductsReq,
	SearchProfilesReq,
	SetOrderStatusReq,
	SetProductVisibilityReq,
	SetProductStockReq,
	AuditEntry,
	TOrder,
	TProduct,
	TProfile,
} from "src/lib/saContracts";

// No region arg: the sa* callables deploy to the project default region
// (us-central1) — same as apps/store's getFunctions(app). Hardcoding
// "europe-west1" pointed the client at the wrong region (the functions live in
// us-central1), which surfaced as "Failed to load stores → internal".
const fns = getFunctions(app);

// ─── Stores ───────────────────────────────────────────────────────────────────

export const saListStores = () =>
	httpsCallable<Record<string, never>, Result<StoreListItem[]>>(fns, "saListStores")({}).then(
		(r) => r.data
	);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const saListOrders = (req: ListReq) =>
	httpsCallable<ListReq, Result<OrderListRow[]>>(fns, "saListOrders")(req).then((r) => r.data);

export const saGetOrder = (req: GetReq) =>
	httpsCallable<GetReq, Result<TOrder>>(fns, "saGetOrder")(req).then((r) => r.data);

export const saSearchOrders = (req: SearchOrdersReq) =>
	httpsCallable<SearchOrdersReq, Result<OrderListRow[]>>(fns, "saSearchOrders")(req).then(
		(r) => r.data
	);

// ─── Products ─────────────────────────────────────────────────────────────────

export const saListProducts = (req: ListReq) =>
	httpsCallable<ListReq, Result<ProductListRow[]>>(fns, "saListProducts")(req).then(
		(r) => r.data
	);

export const saGetProduct = (req: GetReq) =>
	httpsCallable<GetReq, Result<TProduct>>(fns, "saGetProduct")(req).then((r) => r.data);

export const saSearchProducts = (req: SearchProductsReq) =>
	httpsCallable<SearchProductsReq, Result<ProductListRow[]>>(fns, "saSearchProducts")(req).then(
		(r) => r.data
	);

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const saListProfiles = (req: ListReq) =>
	httpsCallable<ListReq, Result<ProfileListRow[]>>(fns, "saListProfiles")(req).then(
		(r) => r.data
	);

export const saGetProfile = (req: GetReq) =>
	httpsCallable<GetReq, Result<TProfile>>(fns, "saGetProfile")(req).then((r) => r.data);

export const saSearchProfiles = (req: SearchProfilesReq) =>
	httpsCallable<SearchProfilesReq, Result<ProfileListRow[]>>(fns, "saSearchProfiles")(req).then(
		(r) => r.data
	);

// ─── Curated writes ───────────────────────────────────────────────────────────

export const saSetOrderStatus = (req: SetOrderStatusReq) =>
	httpsCallable<SetOrderStatusReq, Result<WriteResult>>(fns, "saSetOrderStatus")(req).then(
		(r) => r.data
	);

export const saSetProductVisibility = (req: SetProductVisibilityReq) =>
	httpsCallable<SetProductVisibilityReq, Result<WriteResult>>(fns, "saSetProductVisibility")(
		req
	).then((r) => r.data);

export const saSetProductStock = (req: SetProductStockReq) =>
	httpsCallable<SetProductStockReq, Result<WriteResult>>(fns, "saSetProductStock")(req).then(
		(r) => r.data
	);

// ─── Audit log ────────────────────────────────────────────────────────────────

export const saListAuditEntries = (req: ListAuditReq) =>
	httpsCallable<ListAuditReq, Result<AuditEntry[]>>(fns, "saListAuditEntries")(req).then(
		(r) => r.data
	);
