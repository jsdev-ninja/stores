import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TOrder } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Tracks every Firestore write attempt so we can assert the endpoint writes
// NOTHING (no transaction, no paymentLinks doc). The endpoint only ever calls
// `.get()` — any set/add/create/update/delete is a contract violation.
const writeSpy = vi.fn();

let orderExists = true;
let orderData: unknown;
let storePrivateExists = true;
let storePrivateData: unknown = {
	hypData: { masof: "12345", password: "store-pass", KEY: "store-key" },
};

// Route by collection path: orders live at `{company}/{store}/orders`,
// store creds live at `STORES/{store}/private`.
function docHandle(collectionPath: string) {
	const isStorePrivate = collectionPath.includes("/private");
	return {
		get: async () =>
			isStorePrivate
				? { exists: storePrivateExists, data: () => storePrivateData }
				: { exists: orderExists, data: () => orderData },
		set: (...a: unknown[]) => writeSpy("set", collectionPath, ...a),
		create: (...a: unknown[]) => writeSpy("create", collectionPath, ...a),
		update: (...a: unknown[]) => writeSpy("update", collectionPath, ...a),
		delete: (...a: unknown[]) => writeSpy("delete", collectionPath, ...a),
	};
}

vi.mock("firebase-admin", () => ({
	default: {
		firestore: () => ({
			collection: (collectionPath: string) => ({
				doc: () => docHandle(collectionPath),
				add: (...a: unknown[]) => writeSpy("add", collectionPath, ...a),
			}),
		}),
	},
}));

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock("firebase-functions/v1", () => ({
	https: { onCall: (h: unknown) => h },
}));

// HYP must never be hit for real — mock the lowest-level service and capture
// the exact params we POST so we can assert the server-side amount is used.
const createPaymentLinkMock = vi.fn(async (_params: Record<string, string>) => ({
	success: true,
	formAction: "https://pay.hyp.co.il/p/",
	formFields: {
		Amount: "150.50",
		Masof: "12345",
		// HYP should never echo these, but assert the denylist strips them anyway.
		KEY: "store-key",
		PassP: "store-pass",
		Sign: "abc123",
	} as Record<string, string>,
	errMessage: undefined as string | undefined,
}));

vi.mock("../../../services/hypPaymentService", () => ({
	hypPaymentService: {
		createPaymentLink: (p: Record<string, string>) => createPaymentLinkMock(p),
	},
}));

import { createHypCheckoutPayment } from "./createHypCheckoutPayment";

const handler = createHypCheckoutPayment as unknown as (
	data: unknown,
	context: unknown,
) => Promise<{
	success: boolean;
	error?: string;
	formAction?: string;
	formFields?: Record<string, string>;
}>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OWNER_UID = "user-123";

function makeOrder(over: Partial<Record<string, unknown>> = {}): TOrder {
	return {
		id: "order-1",
		userId: OWNER_UID,
		nameOnInvoice: "Dana Cohen",
		storeOptions: { isVatIncludedInPrice: true },
		client: {
			displayName: "Dana Cohen",
			email: "dana@example.com",
			phoneNumber: "0500000000",
			address: { street: "Herzl 1", city: "Tel Aviv" },
		},
		cart: {
			cartTotal: 150.5,
			deliveryPrice: 0,
			items: [
				{
					amount: 1,
					finalPrice: 150.5,
					product: { sku: "SKU1", name: [{ value: "Widget" }], vat: false },
				},
			],
		},
		...over,
	} as unknown as TOrder;
}

const authCtx = { auth: { uid: OWNER_UID } };

const validInput = {
	orderId: "order-1",
	companyId: "c1",
	storeId: "s1",
	isJ5: true,
};

beforeEach(() => {
	writeSpy.mockClear();
	createPaymentLinkMock.mockClear();
	orderExists = true;
	orderData = makeOrder();
	storePrivateExists = true;
	storePrivateData = {
		hypData: { masof: "12345", password: "store-pass", KEY: "store-key" },
	};
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createHypCheckoutPayment", () => {
	describe("authentication", () => {
		it("rejects an unauthenticated caller (no auth.uid)", async () => {
			const r = await handler(validInput, {});
			expect(r).toEqual({ success: false, error: "unauthenticated" });
			expect(createPaymentLinkMock).not.toHaveBeenCalled();
		});
	});

	describe("ownership", () => {
		it("rejects when order.userId does not match the caller uid", async () => {
			orderData = makeOrder({ userId: "someone-else" });
			const r = await handler(validInput, authCtx);
			expect(r).toEqual({ success: false, error: "forbidden" });
			expect(createPaymentLinkMock).not.toHaveBeenCalled();
		});

		it("succeeds when order.userId matches the caller uid", async () => {
			const r = await handler(validInput, authCtx);
			expect(r.success).toBe(true);
			expect(createPaymentLinkMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("amount is read server-side from the order", () => {
		it("sends the order's cartTotal as the HYP Amount", async () => {
			orderData = makeOrder({
				cart: {
					cartTotal: 222.0,
					deliveryPrice: 0,
					items: [
						{
							amount: 1,
							finalPrice: 222.0,
							product: { sku: "S", name: [{ value: "N" }], vat: false },
						},
					],
				},
			});
			await handler(validInput, authCtx);
			const params = createPaymentLinkMock.mock.calls[0][0];
			expect(params.Amount).toBe("222");
		});

		it("ignores a client-supplied amount and uses the order's cartTotal", async () => {
			// Attacker injects a tiny amount alongside the legitimate input.
			await handler(
				{ ...validInput, amount: 1, Amount: "1", cartTotal: 1 },
				authCtx,
			);
			const params = createPaymentLinkMock.mock.calls[0][0];
			// Order cartTotal is 150.50 — the client values must be ignored.
			expect(params.Amount).toBe("150.5");
		});
	});

	describe("store credentials", () => {
		it("returns missing_store_config when the store private doc is absent", async () => {
			storePrivateExists = false;
			const r = await handler(validInput, authCtx);
			expect(r).toEqual({ success: false, error: "missing_store_config" });
			expect(createPaymentLinkMock).not.toHaveBeenCalled();
		});

		it("loads HYP credentials from the store private doc, not from client input", async () => {
			await handler(validInput, authCtx);
			const params = createPaymentLinkMock.mock.calls[0][0];
			expect(params.KEY).toBe("store-key");
			expect(params.PassP).toBe("store-pass");
			expect(params.Masof).toBe("12345");
		});
	});

	describe("response shape and sanitization", () => {
		it("returns success, formAction and formFields", async () => {
			const r = await handler(validInput, authCtx);
			expect(r.success).toBe(true);
			expect(r.formAction).toBe("https://pay.hyp.co.il/p/");
			expect(r.formFields).toBeDefined();
		});

		it("strips denylisted secret keys (KEY, PassP) from the returned formFields", async () => {
			const r = await handler(validInput, authCtx);
			const fields = r.formFields!;
			expect(fields).not.toHaveProperty("KEY");
			expect(fields).not.toHaveProperty("PassP");
			// Non-secret fields pass through untouched.
			expect(fields).toHaveProperty("Amount");
			expect(fields).toHaveProperty("Sign");
		});

		it("returns the HYP error when the HYP call is unsuccessful", async () => {
			createPaymentLinkMock.mockResolvedValueOnce({
				success: false,
				formAction: undefined as unknown as string,
				formFields: undefined as unknown as Record<string, string>,
				errMessage: "ccode_400",
			});
			const r = await handler(validInput, authCtx);
			expect(r.success).toBe(false);
			expect(r.error).toBe("ccode_400");
		});
	});

	describe("no money-state writes", () => {
		it("writes NO transaction and NO paymentLinks doc (only reads)", async () => {
			await handler(validInput, authCtx);
			// Endpoint only loads the order and store creds via `.get()`.
			// Any write means a transaction or paymentLinks doc was persisted.
			expect(writeSpy).not.toHaveBeenCalled();
		});

		it("performs no writes even on the forbidden path", async () => {
			orderData = makeOrder({ userId: "intruder" });
			await handler(validInput, authCtx);
			expect(writeSpy).not.toHaveBeenCalled();
		});
	});
});
