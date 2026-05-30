import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostTransactionInput } from "../services/postTransaction";

const postTxMock = vi.fn(async (input: PostTransactionInput) => ({
	id: "idem_k1",
	...input,
}));

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock("firebase-functions/v1", () => ({
	https: { onCall: (h: unknown) => h },
}));
vi.mock("../services/postTransaction", () => ({
	postTransaction: (i: PostTransactionInput) => postTxMock(i),
}));

import { postManualTransaction } from "./postManualTransaction";

const handler = postManualTransaction as unknown as (
	data: unknown,
	context: unknown,
) => Promise<{ success: boolean; error?: string; transactionId?: string }>;

const adminCtx = {
	uid: "admin-uid",
	auth: { uid: "admin-uid", token: { admin: true, companyId: "c1", storeId: "s1" } },
};

describe("postManualTransaction — admin auth", () => {
	beforeEach(() => postTxMock.mockClear());

	it("rejects when context.auth is missing", async () => {
		const r = await handler({ amount: 100, idempotencyKey: "k" }, {});
		expect(r).toEqual({ success: false, error: "Unauthorized" });
		expect(postTxMock).not.toHaveBeenCalled();
	});

	it("rejects when admin claim is not exactly true", async () => {
		const r = await handler(
			{ amount: 100, idempotencyKey: "k" },
			{ uid: "u", auth: { uid: "u", token: { admin: false, companyId: "c1", storeId: "s1" } } },
		);
		expect(r).toEqual({ success: false, error: "Unauthorized" });
		expect(postTxMock).not.toHaveBeenCalled();
	});

	it("rejects when token is missing tenant claims", async () => {
		const r = await handler(
			{ amount: 100, idempotencyKey: "k" },
			{ uid: "u", auth: { uid: "u", token: { admin: true } } },
		);
		expect(r.success).toBe(false);
		expect(r.error).toBe("missing_token_claims");
	});

	describe("tenant from token claims, not input", () => {
		it("derives companyId/storeId from the token and ignores client-supplied tenant", async () => {
			await handler(
				{
					amount: 100,
					idempotencyKey: "k1",
					// attacker attempts to inject a different tenant — must be ignored
					companyId: "EVIL",
					storeId: "EVIL",
				},
				adminCtx,
			);
			const passed = postTxMock.mock.calls[0][0];
			expect(passed.companyId).toBe("c1");
			expect(passed.storeId).toBe("s1");
		});

		it("attributes the actor to the admin uid", async () => {
			await handler({ amount: 100, idempotencyKey: "k1" }, adminCtx);
			const passed = postTxMock.mock.calls[0][0];
			// postManualTransaction always posts via the "api" source variant,
			// which is the only variant carrying an `actor`. Narrow to it before
			// asserting on the actor attribution.
			expect(passed.source).toBe("api");
			if (passed.source !== "api") throw new Error("expected api source");
			expect(passed.actor).toEqual({ type: "user", userId: "admin-uid" });
		});
	});

	describe("input validation", () => {
		it("rejects a non-integer / non-positive amount", async () => {
			const r = await handler({ amount: -5, idempotencyKey: "k" }, adminCtx);
			expect(r.success).toBe(false);
			expect(r.error).toBe("invalid_input");
		});
	});
});
