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

const ORG_BALANCE = "c1/s1/orgBalances/org-1";
const REVENUE = "c1/s1/revenueRollups/2026-06";

function input(
	overrides: Partial<ApplyLedgerProjectionInput> = {},
): ApplyLedgerProjectionInput {
	return {
		companyId: "c1",
		storeId: "s1",
		eventId: "evt-1",
		transactionId: "tx-1",
		kind: "debit",
		type: "delivery_note",
		amount: 10000,
		direction: "none",
		organizationId: "org-1",
		createdAt: JUNE_2026,
		...overrides,
	};
}

describe("applyLedgerProjection", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
	});

	describe("debit (delivery note accrual)", () => {
		it("increases owed + totalDebits and writes no revenue doc", async () => {
			const { applied } = await applyLedgerProjection(input());
			expect(applied).toBe(true);

			const org = fake.docs.get(ORG_BALANCE);
			expect(org).toMatchObject({
				organizationId: "org-1",
				owed: 10000,
				totalDebits: 10000,
				totalCredits: 0,
			});
			// debits are accruals, not revenue
			expect(fake.docs.get(REVENUE)).toBeUndefined();
		});

		it("accumulates across multiple debits", async () => {
			await applyLedgerProjection(input({ eventId: "e1", amount: 10000 }));
			await applyLedgerProjection(input({ eventId: "e2", amount: 5000 }));

			expect(fake.docs.get(ORG_BALANCE)).toMatchObject({
				owed: 15000,
				totalDebits: 15000,
			});
		});
	});

	describe("credit in (payment)", () => {
		it("reduces owed, adds totalCredits, and books revenue (byMethod + byOrg)", async () => {
			// org owes 10000 first
			await applyLedgerProjection(input({ eventId: "e-debit" }));
			// then pays 4000
			const { applied } = await applyLedgerProjection(
				input({
					eventId: "e-pay",
					kind: "credit",
					type: "manual",
					direction: "in",
					amount: 4000,
				}),
			);
			expect(applied).toBe(true);

			expect(fake.docs.get(ORG_BALANCE)).toMatchObject({
				owed: 6000,
				totalDebits: 10000,
				totalCredits: 4000,
			});

			expect(fake.docs.get(REVENUE)).toMatchObject({
				yearMonth: "2026-06",
				totalIn: 4000,
				totalOut: 0,
				net: 4000,
				byMethod: { manual: 4000 },
				byOrg: { "org-1": 4000 },
			});
		});

		it("clamps owed at zero on over-payment", async () => {
			await applyLedgerProjection(input({ eventId: "e-debit", amount: 3000 }));
			await applyLedgerProjection(
				input({
					eventId: "e-pay",
					kind: "credit",
					type: "manual",
					direction: "in",
					amount: 5000, // more than owed
				}),
			);

			expect(fake.docs.get(ORG_BALANCE)).toMatchObject({
				owed: 0, // clamped, not -2000
				totalCredits: 5000,
			});
		});

		it("books B2C revenue under the 'b2c' bucket with no org balance", async () => {
			await applyLedgerProjection(
				input({
					kind: "credit",
					type: "hyp_capture",
					direction: "in",
					organizationId: null,
					amount: 7000,
				}),
			);

			expect(fake.docs.get(ORG_BALANCE)).toBeUndefined();
			expect(fake.docs.get(REVENUE)).toMatchObject({
				totalIn: 7000,
				byMethod: { hyp_capture: 7000 },
				byOrg: { b2c: 7000 },
			});
		});
	});

	describe("credit out (refund)", () => {
		it("adds to totalOut and lowers net, leaving AR untouched", async () => {
			await applyLedgerProjection(
				input({
					eventId: "e-pay",
					kind: "credit",
					type: "manual",
					direction: "in",
					amount: 8000,
				}),
			);
			await applyLedgerProjection(
				input({
					eventId: "e-refund",
					kind: "credit",
					type: "manual",
					direction: "out",
					amount: 3000,
				}),
			);

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
			expect(fake.docs.get(ORG_BALANCE)).toMatchObject({
				owed: 10000,
				totalDebits: 10000,
			});
		});
	});
});
