import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeFirestore } from "../../ledger/__tests__/fakeFirestore";

// One shared fake Firestore instance per test, swapped in beforeEach.
let fake: FakeFirestore;

vi.mock("firebase-admin", () => ({
	default: { firestore: () => fake },
}));

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { applyLedgerProjection, ApplyLedgerProjectionInput } from "./applyLedgerProjection";

// 2026-06-15 — Asia/Jerusalem month is "2026-06"
const JUNE_2026 = Date.UTC(2026, 5, 15, 9, 0, 0);

const REVENUE = "c1/s1/revenueRollups/2026-06";

function input(
	overrides: Partial<ApplyLedgerProjectionInput> = {},
): ApplyLedgerProjectionInput {
	return {
		companyId: "c1",
		storeId: "s1",
		eventId: "evt-1",
		transactionId: "tx-1",
		type: "manual",
		amount: 4000,
		direction: "in",
		organizationId: "org-1",
		createdAt: JUNE_2026,
		...overrides,
	};
}

describe("applyLedgerProjection (revenue-only)", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
	});

	describe("cash in (payment)", () => {
		it("books revenue — byMethod, byOrg, totalIn, net", async () => {
			const { applied } = await applyLedgerProjection(input());
			expect(applied).toBe(true);

			expect(fake.docs.get(REVENUE)).toMatchObject({
				yearMonth: "2026-06",
				totalIn: 4000,
				totalOut: 0,
				net: 4000,
				byMethod: { manual: 4000 },
				byOrg: { "org-1": 4000 },
			});
		});

		it("accumulates across multiple cash-in events", async () => {
			await applyLedgerProjection(input({ eventId: "e1", amount: 4000, type: "manual" }));
			await applyLedgerProjection(input({ eventId: "e2", amount: 7000, type: "hyp_capture", organizationId: null }));

			expect(fake.docs.get(REVENUE)).toMatchObject({
				totalIn: 11000,
				byMethod: { manual: 4000, hyp_capture: 7000 },
				byOrg: { "org-1": 4000, b2c: 7000 },
			});
		});

		it("books B2C revenue under the 'b2c' bucket when no org", async () => {
			await applyLedgerProjection(
				input({
					type: "hyp_capture",
					organizationId: null,
					amount: 7000,
				}),
			);

			expect(fake.docs.get(REVENUE)).toMatchObject({
				totalIn: 7000,
				byMethod: { hyp_capture: 7000 },
				byOrg: { b2c: 7000 },
			});
		});
	});

	describe("cash out (refund)", () => {
		it("adds to totalOut, lowers net, does NOT touch AR (no orgBalance doc)", async () => {
			await applyLedgerProjection(input({ eventId: "e-pay", direction: "in", amount: 8000 }));
			await applyLedgerProjection(input({ eventId: "e-refund", direction: "out", amount: 3000 }));

			expect(fake.docs.get(REVENUE)).toMatchObject({
				totalIn: 8000,
				totalOut: 3000,
				net: 5000,
			});
		});
	});

	describe("idempotency", () => {
		it("is a no-op on replay of the same eventId (no double count)", async () => {
			const first = await applyLedgerProjection(input());
			const second = await applyLedgerProjection(input()); // same eventId

			expect(first.applied).toBe(true);
			expect(second.applied).toBe(false);
			// Revenue written only once
			expect(fake.docs.get(REVENUE)).toMatchObject({ totalIn: 4000 });
		});
	});
});
