import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostTransactionInput } from "../services/postTransaction";
import type { Transaction } from "../types";

let storePrivateExists = true;
const storePrivateData = {
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

const getTxMock = vi.fn<() => Promise<Transaction | null>>();
const queryCapturesMock = vi.fn<() => Promise<Transaction[]>>();
vi.mock("../internal/transactionsStore", () => ({
	getTransactionById: () => getTxMock(),
	queryCaptursByAuthTx: () => queryCapturesMock(),
}));

const chargeMock = vi.fn();
vi.mock("../../../services/hypPaymentService", () => ({
	hypPaymentService: {
		chargeJ5Transaction: (...a: unknown[]) => chargeMock(...a),
		createPaymentLink: vi.fn(),
	},
}));

const postTxMock = vi.fn(async (input: PostTransactionInput) => ({
	id: "idem_cap1",
	...input,
}));
vi.mock("../services/postTransaction", () => ({
	postTransaction: (i: PostTransactionInput) => postTxMock(i),
}));

import { captureHypJ5 } from "./captureHypJ5";

const handler = captureHypJ5 as unknown as (
	data: unknown,
	context: unknown,
) => Promise<{
	success: boolean;
	error?: string;
	transactionId?: string;
	existingTransactionId?: string;
}>;

const adminCtx = {
	uid: "admin-1",
	auth: { uid: "admin-1", token: { admin: true, companyId: "c1", storeId: "s1" } },
};

function authTx(over: Partial<Transaction> = {}): Transaction {
	return {
		id: "hyp_888",
		type: "hyp_j5_auth",
		amount: 8475,
		currency: "ILS",
		direction: "in",
		reference: { type: "order", id: "order-1" },
		clientName: "Dana",
		email: "dana@example.com",
		actor: { type: "customer" },
		dedupKey: "hyp_888",
		source: "hyp_result",
		createdAt: Date.now(),
		companyId: "c1",
		storeId: "s1",
		hyp: {
			masof: "12345",
			paymentToken: "tok-uid",
			ccode: "0",
			hypTransactionId: "888",
			rawResponse: {},
		},
		...over,
	} as Transaction;
}

const input = { j5TransactionId: "hyp_888", idempotencyKey: "cap1" };

describe("captureHypJ5", () => {
	beforeEach(() => {
		storePrivateExists = true;
		getTxMock.mockReset().mockResolvedValue(authTx());
		queryCapturesMock.mockReset().mockResolvedValue([]);
		chargeMock.mockReset().mockResolvedValue({ success: true, data: { ok: 1 } });
		postTxMock.mockClear();
	});

	describe("admin auth + tenant from claims", () => {
		it("rejects when not admin", async () => {
			const r = await handler(input, { auth: { token: { admin: false } } });
			expect(r).toEqual({ success: false, error: "Unauthorized" });
		});
		it("rejects when token lacks tenant claims", async () => {
			const r = await handler(input, {
				uid: "u",
				auth: { uid: "u", token: { admin: true } },
			});
			expect(r.error).toBe("missing_token_claims");
		});
	});

	describe("type guard", () => {
		it("rejects when the referenced tx is not hyp_j5_auth", async () => {
			getTxMock.mockResolvedValue(authTx({ type: "hyp_direct" }));
			const r = await handler(input, adminCtx);
			expect(r.error).toBe("invalid_tx_type");
			expect(chargeMock).not.toHaveBeenCalled();
		});
		it("rejects when the auth tx is not found", async () => {
			getTxMock.mockResolvedValue(null);
			const r = await handler(input, adminCtx);
			expect(r.error).toBe("auth_tx_not_found");
		});
	});

	describe("double-charge guard (before HYP call)", () => {
		it("does NOT call HYP and does NOT post when a capture already exists", async () => {
			queryCapturesMock.mockResolvedValue([authTx({ id: "existing-cap", type: "hyp_capture" })]);
			const r = await handler(input, adminCtx);
			expect(r.success).toBe(false);
			expect(r.error).toBe("already_captured");
			expect(r.existingTransactionId).toBe("existing-cap");
			expect(chargeMock).not.toHaveBeenCalled();
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});

	describe("happy path", () => {
		it("converts amount agorot→shekels for the HYP charge (8475 → '84.75')", async () => {
			await handler(input, adminCtx);
			const chargeArg = chargeMock.mock.calls[0][0];
			expect(chargeArg.originalAmount).toBe(84.75);
			expect(chargeArg.actualAmount).toBe(84.75);
		});

		it("pulls clientName/email from the auth tx into the capture", async () => {
			await handler(input, adminCtx);
			const chargeArg = chargeMock.mock.calls[0][0];
			expect(chargeArg.clientName).toBe("Dana");
			expect(chargeArg.email).toBe("dana@example.com");
			const posted = postTxMock.mock.calls[0][0];
			expect(posted.clientName).toBe("Dana");
			expect(posted.email).toBe("dana@example.com");
		});

		it("records a hyp_capture linked to the auth tx via capturedFromTransactionId", async () => {
			await handler(input, adminCtx);
			const posted = postTxMock.mock.calls[0][0];
			expect(posted.type).toBe("hyp_capture");
			// @ts-expect-error runtime check on hyp sub-object
			expect(posted.hyp.capturedFromTransactionId).toBe("hyp_888");
			expect(posted.companyId).toBe("c1");
			expect(posted.storeId).toBe("s1");
		});

		it("does NOT record a capture when the HYP charge fails", async () => {
			chargeMock.mockResolvedValue({ success: false, errMessage: "declined" });
			const r = await handler(input, adminCtx);
			expect(r.success).toBe(false);
			expect(r.error).toBe("hyp_capture_failed");
			expect(postTxMock).not.toHaveBeenCalled();
		});
	});
});
