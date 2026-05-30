import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostTransactionInput } from "../services/postTransaction";
import type { PaymentLink } from "../types";

let storePrivateExists = true;
let storePrivateData: unknown = {
	hypData: { masof: "12345", password: "pw", KEY: "key", isJ5: false },
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

const verifyMock = vi.fn();
vi.mock("../services/verifyHypSignature", () => ({
	verifyHypSignature: (...a: unknown[]) => verifyMock(...a),
}));

const getLinkMock = vi.fn<() => Promise<PaymentLink | null>>();
vi.mock("../internal/paymentLinksStore", () => ({
	getPaymentLinkByToken: () => getLinkMock(),
}));

const consumeMock = vi.fn();
vi.mock("../services/validateAndConsumeLink", () => ({
	validateAndConsumeLink: (...a: unknown[]) => consumeMock(...a),
}));

// records call order so we can assert record-before-consume (M1 ordering)
const callOrder: string[] = [];
const postTxMock = vi.fn(async (input: PostTransactionInput) => {
	callOrder.push("post");
	return { id: "hyp_555", ...input };
});
vi.mock("../services/postTransaction", () => ({
	postTransaction: (i: PostTransactionInput) => postTxMock(i),
}));

import { recordHypDirectPayment } from "./recordHypDirectPayment";

const handler = recordHypDirectPayment as unknown as (
	data: unknown,
	context: unknown,
) => Promise<{ success: boolean; error?: string; transactionId?: string }>;

function link(over: Partial<PaymentLink> = {}): PaymentLink {
	const now = Date.now();
	return {
		token: "tok",
		formAction: "https://pay.hyp.co.il/p/",
		formFields: {},
		reference: { type: "order", id: "order-1" },
		amount: 10000,
		currency: "ILS",
		createdAt: now,
		expiresAt: now + 60_000,
		usedAt: null,
		companyId: "c1",
		storeId: "s1",
		...over,
	};
}

function validInput(over: Record<string, unknown> = {}) {
	return {
		token: "tok",
		companyId: "c1",
		storeId: "s1",
		Id: "555",
		CCode: "0",
		Amount: "100.00",
		Order: "ord-1",
		Masof: "12345",
		rawResponse: { CCode: "0" },
		...over,
	};
}

describe("recordHypDirectPayment", () => {
	beforeEach(() => {
		verifyMock.mockReset().mockResolvedValue({ valid: true });
		getLinkMock.mockReset().mockResolvedValue(link());
		consumeMock.mockReset().mockResolvedValue({ success: true, link: link() });
		postTxMock.mockClear();
		callOrder.length = 0;
		storePrivateExists = true;
		storePrivateData = {
			hypData: { masof: "12345", password: "pw", KEY: "key", isJ5: false },
		};
	});

	describe("VERIFY + masof gating", () => {
		it("rejects with no write when VERIFY fails", async () => {
			verifyMock.mockResolvedValue({ valid: false, reason: "902" });
			const r = await handler(validInput(), {});
			expect(r.error).toBe("verify_failed");
			expect(postTxMock).not.toHaveBeenCalled();
		});
		it("rejects with no write/VERIFY on masof mismatch", async () => {
			const r = await handler(validInput({ Masof: "99999" }), {});
			expect(r.error).toBe("masof_mismatch");
			expect(verifyMock).not.toHaveBeenCalled();
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("link tenant/expiry gating", () => {
		it("rejects when the link tenant differs from the input tenant (no write)", async () => {
			getLinkMock.mockResolvedValue(link({ companyId: "OTHER" }));
			const r = await handler(validInput(), {});
			expect(r.error).toBe("tenant_mismatch");
			expect(postTxMock).not.toHaveBeenCalled();
		});
		it("rejects an expired link before write", async () => {
			getLinkMock.mockResolvedValue(link({ expiresAt: Date.now() - 1000 }));
			const r = await handler(validInput(), {});
			expect(r.error).toBe("link_expired");
			expect(postTxMock).not.toHaveBeenCalled();
		});
		it("rejects when the link is not found", async () => {
			getLinkMock.mockResolvedValue(null);
			const r = await handler(validInput(), {});
			expect(r.error).toBe("link_not_found");
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("M1 ordering — record BEFORE consume", () => {
		it("calls postTransaction before validateAndConsumeLink", async () => {
			consumeMock.mockImplementation(async () => {
				callOrder.push("consume");
				return { success: true, link: link() };
			});
			await handler(validInput(), {});
			expect(callOrder).toEqual(["post", "consume"]);
		});

		it("returns success with the transactionId even when consume FAILS after record", async () => {
			consumeMock.mockResolvedValue({
				success: false,
				reason: "consume_failed",
			});
			const r = await handler(validInput(), {});
			expect(r.success).toBe(true);
			expect(r.transactionId).toBe("hyp_555");
			expect(postTxMock).toHaveBeenCalledTimes(1);
		});

		it("returns success when consume reports already_used (idempotent replay)", async () => {
			consumeMock.mockResolvedValue({
				success: false,
				reason: "already_used",
			});
			const r = await handler(validInput(), {});
			expect(r.success).toBe(true);
			expect(r.transactionId).toBe("hyp_555");
		});
	});

	describe("amount + reference sourcing", () => {
		it("uses HYP-verified amount (agorot) and the link's reference, not client input", async () => {
			await handler(validInput({ Amount: "84.75" }), {});
			const passed = postTxMock.mock.calls[0][0];
			expect(passed.amount).toBe(8475);
			expect(passed.reference).toEqual({ type: "order", id: "order-1" });
		});

		it("rejects a zero/NaN amount with no write", async () => {
			const r = await handler(validInput({ Amount: "0" }), {});
			expect(r.error).toBe("invalid_amount");
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});
});
