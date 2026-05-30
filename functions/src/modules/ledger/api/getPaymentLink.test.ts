import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentLink } from "../types";

const getLinkMock = vi.fn<() => Promise<PaymentLink | null>>();

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// onCall in firebase-functions/v1 wraps a handler; for unit testing we extract
// the raw handler. The mock returns the handler itself so we can invoke it directly.
vi.mock("firebase-functions/v1", () => ({
	https: { onCall: (handler: unknown) => handler },
}));

vi.mock("../internal/paymentLinksStore", () => ({
	getPaymentLinkByToken: () => getLinkMock(),
}));

import { getPaymentLink } from "./getPaymentLink";

// the mocked onCall returns the bare handler (data, context) => result
const handler = getPaymentLink as unknown as (
	data: unknown,
	context?: unknown,
) => Promise<{
	success: boolean;
	error?: string;
	formAction?: string;
	formFields?: Record<string, string>;
}>;

const VALID_TOKEN = "abcdEFGH12345678"; // 16 base64url chars

function makeLink(fields: Record<string, string>): PaymentLink {
	const now = Date.now();
	return {
		token: VALID_TOKEN,
		formAction: "https://pay.hyp.co.il/p/",
		formFields: fields,
		reference: { type: "order", id: "order-1" },
		amount: 10000,
		currency: "ILS",
		createdAt: now,
		expiresAt: now + 60_000,
		usedAt: null,
		companyId: "c1",
		storeId: "s1",
	};
}

describe("getPaymentLink", () => {
	beforeEach(() => {
		getLinkMock.mockReset();
	});

	describe("secret field stripping", () => {
		it("strips denylisted secret fields (case-insensitive) from formFields", async () => {
			getLinkMock.mockResolvedValue(
				makeLink({
					Amount: "100.00",
					KEY: "supersecret",
					PassP: "pw",
					password: "pw2",
					pass: "pw3",
					signKey: "sk",
					secret: "s",
					SECRET: "s2",
					Sign: "True",
				}),
			);
			const r = await handler({ token: VALID_TOKEN });
			expect(r.success).toBe(true);
			const fields = r.formFields!;
			expect(fields).toHaveProperty("Amount");
			expect(fields).toHaveProperty("Sign"); // not a secret
			expect(fields).not.toHaveProperty("KEY");
			expect(fields).not.toHaveProperty("PassP");
			expect(fields).not.toHaveProperty("password");
			expect(fields).not.toHaveProperty("pass");
			expect(fields).not.toHaveProperty("signKey");
			expect(fields).not.toHaveProperty("secret");
			expect(fields).not.toHaveProperty("SECRET");
		});

		it("never returns orderId / companyId / storeId to the public caller", async () => {
			getLinkMock.mockResolvedValue(makeLink({ Amount: "100.00" }));
			const r = await handler({ token: VALID_TOKEN });
			expect(r).not.toHaveProperty("orderId");
			expect(r).not.toHaveProperty("companyId");
			expect(r).not.toHaveProperty("storeId");
			expect(Object.keys(r).sort()).toEqual(
				["formAction", "formFields", "success"].sort(),
			);
		});
	});

	describe("state gating", () => {
		it("rejects an invalid token format without hitting the store", async () => {
			const r = await handler({ token: "short" });
			expect(r.success).toBe(false);
			expect(r.error).toBe("not_found");
			expect(getLinkMock).not.toHaveBeenCalled();
		});

		it("returns not_found when the link is missing", async () => {
			getLinkMock.mockResolvedValue(null);
			const r = await handler({ token: VALID_TOKEN });
			expect(r.success).toBe(false);
			expect(r.error).toBe("not_found");
		});

		it("returns expired for a past-expiry link", async () => {
			const link = makeLink({ Amount: "100.00" });
			link.expiresAt = Date.now() - 1000;
			getLinkMock.mockResolvedValue(link);
			const r = await handler({ token: VALID_TOKEN });
			expect(r.success).toBe(false);
			expect(r.error).toBe("expired");
		});

		it("returns already_used for a consumed link", async () => {
			const link = makeLink({ Amount: "100.00" });
			link.usedAt = Date.now();
			getLinkMock.mockResolvedValue(link);
			const r = await handler({ token: VALID_TOKEN });
			expect(r.success).toBe(false);
			expect(r.error).toBe("already_used");
		});
	});
});
