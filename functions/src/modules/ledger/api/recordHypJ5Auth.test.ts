import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostTransactionInput } from "../services/postTransaction";

// --- mocks -----------------------------------------------------------------

let storePrivateExists = true;
let storePrivateData: unknown = {
	hypData: { masof: "12345", password: "pw", KEY: "key", isJ5: true },
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

const postTxMock = vi.fn(async (input: PostTransactionInput) => ({
	id: "hyp_888",
	...input,
}));
vi.mock("../services/postTransaction", () => ({
	postTransaction: (i: PostTransactionInput) => postTxMock(i),
}));

import { recordHypJ5Auth } from "./recordHypJ5Auth";

const handler = recordHypJ5Auth as unknown as (
	data: unknown,
	context: unknown,
) => Promise<{ success: boolean; error?: string; transactionId?: string }>;

function validInput(over: Record<string, unknown> = {}) {
	return {
		companyId: "c1",
		storeId: "s1",
		Id: "888",
		CCode: "0",
		Amount: "100.00",
		Order: "ord-1",
		Masof: "12345",
		UID: "uid-token",
		reference: { type: "order", id: "order-1" },
		rawResponse: { CCode: "0" },
		...over,
	};
}

describe("recordHypJ5Auth", () => {
	beforeEach(() => {
		verifyMock.mockReset();
		postTxMock.mockClear();
		storePrivateExists = true;
		storePrivateData = {
			hypData: { masof: "12345", password: "pw", KEY: "key", isJ5: true },
		};
		verifyMock.mockResolvedValue({ valid: true });
	});

	describe("VERIFY gating", () => {
		it("writes a transaction when VERIFY passes (CCode=0)", async () => {
			const r = await handler(validInput(), {});
			expect(r.success).toBe(true);
			expect(postTxMock).toHaveBeenCalledTimes(1);
		});

		it("rejects and writes NOTHING when VERIFY fails", async () => {
			verifyMock.mockResolvedValue({ valid: false, reason: "CCode=902" });
			const r = await handler(validInput(), {});
			expect(r.success).toBe(false);
			expect(r.error).toBe("verify_failed");
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("masof cross-check (before VERIFY/write)", () => {
		it("rejects when payload Masof != store masof and never calls VERIFY", async () => {
			const r = await handler(validInput({ Masof: "99999" }), {});
			expect(r.success).toBe(false);
			expect(r.error).toBe("masof_mismatch");
			expect(verifyMock).not.toHaveBeenCalled();
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("missing store config", () => {
		it("rejects when the store private doc does not exist", async () => {
			storePrivateExists = false;
			const r = await handler(validInput(), {});
			expect(r.success).toBe(false);
			expect(r.error).toBe("missing_store_config");
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("amount conversion shekels → agorot (from verified HYP amount)", () => {
		it("converts 100 → 10000", async () => {
			await handler(validInput({ Amount: "100" }), {});
			expect(postTxMock.mock.calls[0][0].amount).toBe(10000);
		});
		it("converts 84.75 → 8475", async () => {
			await handler(validInput({ Amount: "84.75" }), {});
			expect(postTxMock.mock.calls[0][0].amount).toBe(8475);
		});
		it("rounds 10.005 → 1001 (Math.round on agorot)", async () => {
			await handler(validInput({ Amount: "10.005" }), {});
			expect(postTxMock.mock.calls[0][0].amount).toBe(1001);
		});
	});

	describe("amount guards (reject before write)", () => {
		// NaN/negative/zero must all be rejected. Amount is a string in the input.
		it.each([
			["zero", "0"],
			["negative", "-5"],
			["NaN (non-numeric)", "abc"],
			["Infinity", "Infinity"],
		])("rejects %s amount with no write", async (_label, amount) => {
			const r = await handler(validInput({ Amount: amount }), {});
			expect(r.success).toBe(false);
			expect(r.error).toBe("invalid_amount");
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("dedup + amount source", () => {
		it("uses hyp_{Id} dedup and never trusts a client amount field", async () => {
			await handler(
				validInput({ Amount: "100.00", amount: 999999 }),
				{},
			);
			const passed = postTxMock.mock.calls[0][0];
			expect(passed.source).toBe("hyp_result");
			// @ts-expect-error narrow at runtime
			expect(passed.hypTransactionId).toBe("888");
			expect(passed.amount).toBe(10000); // from HYP Amount, not the injected field
		});
	});
});
