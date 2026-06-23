import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeFirestore } from "../../ledger/__tests__/fakeFirestore";

let fake: FakeFirestore;

vi.mock("firebase-admin", () => ({
	default: { firestore: () => fake },
}));

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { reconcileProjections } from "./reconcileProjections";

const JUNE_2026 = Date.UTC(2026, 5, 15, 9, 0, 0);
const TX = "c1/s1/transactions";
const REVENUE = "c1/s1/revenueRollups/2026-06";

function seedTx(
	id: string,
	t: {
		type: string;
		amount: number;
		direction: "in" | "out" | "none";
		organizationId?: string;
		createdAt?: number;
	},
) {
	fake.docs.set(`${TX}/${id}`, {
		id,
		type: t.type,
		amount: t.amount,
		direction: t.direction,
		createdAt: t.createdAt ?? JUNE_2026,
		...(t.organizationId
			? { payer: { organizationId: t.organizationId } }
			: {}),
	});
}

describe("reconcileProjections", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
	});

	it("rebuilds revenueRollups (byMethod + byOrg + net) from cash in/out rows", async () => {
		// legacy AR row (direction:"none") is skipped — not cash
		seedTx("d1", { type: "delivery_note", amount: 10000, direction: "none", organizationId: "org-1" });
		seedTx("p1", { type: "manual", amount: 4000, direction: "in", organizationId: "org-1" });
		seedTx("p2", { type: "hyp_capture", amount: 7000, direction: "in" });
		seedTx("r1", { type: "manual", amount: 1000, direction: "out", organizationId: "org-1" });

		const report = await reconcileProjections({ companyId: "c1", storeId: "s1" });

		expect(report.transactionsScanned).toBe(4);
		expect(fake.docs.get(REVENUE)).toMatchObject({
			yearMonth: "2026-06",
			totalIn: 11000, // 4000 + 7000 (legacy AR row excluded)
			totalOut: 1000,
			net: 10000,
			byMethod: { manual: 4000, hyp_capture: 7000 },
			byOrg: { "org-1": 4000, b2c: 7000 },
		});
		expect(report.months).toHaveLength(1);
		expect(report.months[0]).toMatchObject({ yearMonth: "2026-06", totalIn: 11000, totalOut: 1000, net: 10000 });
	});

	it("skips AR rows (direction:'none') — AR is now in documents module", async () => {
		seedTx("d1", { type: "delivery_note", amount: 5000, direction: "none", organizationId: "org-1" });

		const report = await reconcileProjections({ companyId: "c1", storeId: "s1" });

		// No cash rows → no revenue rollup written
		expect(fake.docs.get(REVENUE)).toBeUndefined();
		expect(report.months).toHaveLength(0);
	});

	it("dry run (apply:false) reports months but writes nothing", async () => {
		seedTx("p1", { type: "manual", amount: 5000, direction: "in", organizationId: "org-1" });

		const report = await reconcileProjections({ companyId: "c1", storeId: "s1", apply: false });

		expect(report.months[0]).toMatchObject({ totalIn: 5000 });
		// Nothing written in dry run
		expect(fake.docs.get(REVENUE)).toBeUndefined();
	});

	it("handles store with no transactions", async () => {
		const report = await reconcileProjections({ companyId: "c1", storeId: "s1" });

		expect(report.transactionsScanned).toBe(0);
		expect(report.months).toHaveLength(0);
	});
});
