import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeFirestore } from "../__tests__/fakeFirestore";
import type { PaymentLink } from "../types";

// Integration-style: validateAndConsumeLink delegates to consumePaymentLink,
// which runs validity checks inside a Firestore transaction. We exercise the
// real consume path against the in-memory store to prove single-use semantics.
let fake: FakeFirestore;
vi.mock("firebase-admin", () => ({ default: { firestore: () => fake } }));

import { validateAndConsumeLink } from "./validateAndConsumeLink";
import { writePaymentLink } from "../internal/paymentLinksStore";

function makeLink(over: Partial<PaymentLink> = {}): PaymentLink {
	const now = Date.now();
	return {
		token: "tok16chars000000",
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

describe("validateAndConsumeLink", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
	});

	it("first consume succeeds", async () => {
		await writePaymentLink(makeLink());
		const r = await validateAndConsumeLink("tok16chars000000");
		expect(r.success).toBe(true);
	});

	it("second consume returns already_used", async () => {
		await writePaymentLink(makeLink());
		await validateAndConsumeLink("tok16chars000000");
		const r = await validateAndConsumeLink("tok16chars000000");
		expect(r.success).toBe(false);
		if (!r.success) expect(r.reason).toBe("already_used");
	});

	it("expired link is rejected", async () => {
		await writePaymentLink(makeLink({ expiresAt: Date.now() - 1 }));
		const r = await validateAndConsumeLink("tok16chars000000");
		expect(r.success).toBe(false);
		if (!r.success) expect(r.reason).toBe("expired");
	});

	it("unknown token is rejected as not_found", async () => {
		const r = await validateAndConsumeLink("does-not-exist");
		expect(r.success).toBe(false);
		if (!r.success) expect(r.reason).toBe("not_found");
	});
});
