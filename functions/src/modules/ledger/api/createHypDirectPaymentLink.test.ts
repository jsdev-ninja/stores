import { describe, it, expect, vi, beforeEach } from "vitest";

let storePrivateExists = true;
const storePrivateData = {
	hypData: { masof: "12345", password: "pw", KEY: "the-key", isJ5: false },
};

vi.mock("firebase-admin", () => ({
	default: {
		firestore: () => ({
			collection: () => ({
				doc: () => ({
					get: async () => ({
						exists: storePrivateExists,
						data: () => storePrivateData,
					}),
				}),
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

const createLinkMock = vi.fn(async (_arg: unknown) => ({
	success: true,
	url: "https://storebrix.com/pay/tok",
	token: "tok",
}));
vi.mock("../services/createPaymentLink", () => ({
	createPaymentLink: (a: unknown) => createLinkMock(a),
}));

import { createHypDirectPaymentLink } from "./createHypDirectPaymentLink";

const handler = createHypDirectPaymentLink as unknown as (
	data: unknown,
	context: unknown,
) => Promise<{ success: boolean; error?: string }>;

const adminCtx = {
	uid: "admin-1",
	auth: { uid: "admin-1", token: { admin: true, companyId: "c1", storeId: "s1" } },
};

const input = { orderId: "order-1", amountAgorot: 8475 };

describe("createHypDirectPaymentLink", () => {
	beforeEach(() => {
		storePrivateExists = true;
		createLinkMock.mockClear();
	});

	describe("admin auth + tenant from claims", () => {
		it("rejects when not admin", async () => {
			const r = await handler(input, { auth: { token: { admin: false } } });
			expect(r).toEqual({ success: false, error: "Unauthorized" });
			expect(createLinkMock).not.toHaveBeenCalled();
		});
		it("rejects when token lacks tenant claims", async () => {
			const r = await handler(input, {
				uid: "u",
				auth: { uid: "u", token: { admin: true } },
			});
			expect(r.error).toBe("missing_token_claims");
		});
		it("derives tenant from token claims, ignoring any client-supplied tenant", async () => {
			await handler({ ...input, companyId: "EVIL", storeId: "EVIL" }, adminCtx);
			const arg = createLinkMock.mock.calls[0][0] as {
				companyId: string;
				storeId: string;
			};
			expect(arg.companyId).toBe("c1");
			expect(arg.storeId).toBe("s1");
		});
	});

	describe("agorot → shekels conversion passed to HYP", () => {
		it("converts amountAgorot 8475 → Amount '84.75' in hypParams", async () => {
			await handler(input, adminCtx);
			const arg = createLinkMock.mock.calls[0][0] as {
				hypParams: { Amount: string };
				amountAgorot: number;
			};
			expect(arg.hypParams.Amount).toBe("84.75");
			// the agorot amount is preserved for persistence
			expect(arg.amountAgorot).toBe(8475);
		});
		it("converts 10000 → '100.00'", async () => {
			await handler({ orderId: "o", amountAgorot: 10000 }, adminCtx);
			const arg = createLinkMock.mock.calls[0][0] as {
				hypParams: { Amount: string };
			};
			expect(arg.hypParams.Amount).toBe("100.00");
		});
	});

	describe("input validation", () => {
		it("rejects a non-positive agorot amount", async () => {
			const r = await handler({ orderId: "o", amountAgorot: 0 }, adminCtx);
			expect(r.success).toBe(false);
			expect(r.error).toBe("invalid_input");
		});
	});
});
