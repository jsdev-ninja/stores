import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeFirestore } from "../__tests__/fakeFirestore";
import { PaymentLink } from "../types";

let fake: FakeFirestore;

vi.mock("firebase-admin", () => ({
	default: { firestore: () => fake },
}));

import {
	writePaymentLink,
	getPaymentLinkByToken,
	consumePaymentLink,
} from "./paymentLinksStore";

function makeLink(overrides: Partial<PaymentLink> = {}): PaymentLink {
	const now = Date.now();
	return {
		token: "tok16chars000000",
		formAction: "https://pay.hyp.co.il/p/",
		formFields: { Amount: "100.00" },
		reference: { type: "order", id: "order-1" },
		amount: 10000,
		currency: "ILS",
		createdAt: now,
		expiresAt: now + 60_000,
		usedAt: null,
		companyId: "c1",
		storeId: "s1",
		...overrides,
	};
}

describe("paymentLinksStore.consumePaymentLink", () => {
	beforeEach(async () => {
		fake = new FakeFirestore();
	});

	it("returns not_found when the token does not exist", async () => {
		const r = await consumePaymentLink("missing-token-xx");
		expect(r.consumed).toBe(false);
		if (!r.consumed) expect(r.reason).toBe("not_found");
	});

	it("first consume succeeds and stamps usedAt", async () => {
		await writePaymentLink(makeLink());
		const r = await consumePaymentLink("tok16chars000000");
		expect(r.consumed).toBe(true);
		const stored = fake.docs.get(
			"c1/s1/paymentLinks/tok16chars000000",
		) as PaymentLink;
		expect(stored.usedAt).not.toBeNull();
	});

	it("second consume returns already_used", async () => {
		await writePaymentLink(makeLink());
		await consumePaymentLink("tok16chars000000");
		const r = await consumePaymentLink("tok16chars000000");
		expect(r.consumed).toBe(false);
		if (!r.consumed) expect(r.reason).toBe("already_used");
	});

	it("rejects an expired link (checked inside the transaction)", async () => {
		await writePaymentLink(
			makeLink({ expiresAt: Date.now() - 1_000 }),
		);
		const r = await consumePaymentLink("tok16chars000000");
		expect(r.consumed).toBe(false);
		if (!r.consumed) expect(r.reason).toBe("expired");
	});

	it("does not stamp usedAt when the link is expired", async () => {
		await writePaymentLink(makeLink({ expiresAt: Date.now() - 1_000 }));
		await consumePaymentLink("tok16chars000000");
		const stored = fake.docs.get(
			"c1/s1/paymentLinks/tok16chars000000",
		) as PaymentLink;
		expect(stored.usedAt).toBeNull();
	});
});

describe("paymentLinksStore.getPaymentLinkByToken", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
	});

	it("resolves a tenant-scoped link via collectionGroup using only the token", async () => {
		await writePaymentLink(makeLink());
		const link = await getPaymentLinkByToken("tok16chars000000");
		expect(link).not.toBeNull();
		expect(link?.companyId).toBe("c1");
	});

	it("returns null for an unknown token", async () => {
		const link = await getPaymentLinkByToken("nope");
		expect(link).toBeNull();
	});
});
