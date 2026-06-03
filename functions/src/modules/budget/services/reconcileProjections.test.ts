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
const ORG_BALANCE = "c1/s1/orgBalances/org-1";
const REVENUE = "c1/s1/revenueRollups/2026-06";

function seedTx(
	id: string,
	t: {
		kind?: "credit" | "debit";
		type: string;
		amount: number;
		direction: "in" | "out" | "none";
		organizationId?: string;
		createdAt?: number;
	},
) {
	fake.docs.set(`${TX}/${id}`, {
		id,
		kind: t.kind ?? "credit",
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

	it("rebuilds orgBalances from debits − credits-in (clamped ≥0)", async () => {
		seedTx("d1", { kind: "debit", type: "delivery_note", amount: 10000, direction: "none", organizationId: "org-1" });
		seedTx("p1", { kind: "credit", type: "manual", amount: 4000, direction: "in", organizationId: "org-1" });

		const report = await reconcileProjections({ companyId: "c1", storeId: "s1" });

		expect(report.transactionsScanned).toBe(2);
		expect(fake.docs.get(ORG_BALANCE)).toMatchObject({
			owed: 6000,
			totalDebits: 10000,
			totalCredits: 4000,
		});
		const org = report.orgs.find((o) => o.organizationId === "org-1");
		expect(org).toMatchObject({ owed: 6000, drift: 6000, previousOwed: null });
	});

	it("rebuilds revenueRollups (byMethod + byOrg + net) from cash only", async () => {
		seedTx("d1", { kind: "debit", type: "delivery_note", amount: 10000, direction: "none", organizationId: "org-1" });
		seedTx("p1", { kind: "credit", type: "manual", amount: 4000, direction: "in", organizationId: "org-1" });
		seedTx("p2", { kind: "credit", type: "hyp_capture", amount: 7000, direction: "in" });
		seedTx("r1", { kind: "credit", type: "manual", amount: 1000, direction: "out", organizationId: "org-1" });

		await reconcileProjections({ companyId: "c1", storeId: "s1" });

		expect(fake.docs.get(REVENUE)).toMatchObject({
			yearMonth: "2026-06",
			totalIn: 11000, // 4000 + 7000 (debit excluded)
			totalOut: 1000,
			net: 10000,
			byMethod: { manual: 4000, hyp_capture: 7000 },
			byOrg: { "org-1": 4000, b2c: 7000 },
		});
	});

	it("dry run (apply:false) reports drift but writes nothing", async () => {
		seedTx("d1", { kind: "debit", type: "delivery_note", amount: 5000, direction: "none", organizationId: "org-1" });
		// Pretend a stale projection exists that disagrees with the ledger.
		fake.docs.set(ORG_BALANCE, {
			organizationId: "org-1",
			owed: 999,
			totalDebits: 999,
			totalCredits: 0,
			currency: "ILS",
			updatedAt: 1,
			companyId: "c1",
			storeId: "s1",
		});

		const report = await reconcileProjections({ companyId: "c1", storeId: "s1", apply: false });

		const org = report.orgs.find((o) => o.organizationId === "org-1")!;
		expect(org.owed).toBe(5000);
		expect(org.previousOwed).toBe(999);
		expect(org.drift).toBe(5000 - 999);
		expect(report.driftedOrgs).toBe(1);
		// Not written — stale doc untouched in dry run.
		expect(fake.docs.get(ORG_BALANCE)).toMatchObject({ owed: 999 });
	});

	it("treats legacy rows with no kind as credit", async () => {
		// Legacy payment row written before the kind field existed.
		fake.docs.set(`${TX}/legacy1`, {
			id: "legacy1",
			type: "hyp_capture",
			amount: 3000,
			direction: "in",
			createdAt: JUNE_2026,
			payer: { organizationId: "org-1" },
		});
		seedTx("d1", { kind: "debit", type: "delivery_note", amount: 8000, direction: "none", organizationId: "org-1" });

		await reconcileProjections({ companyId: "c1", storeId: "s1" });

		expect(fake.docs.get(ORG_BALANCE)).toMatchObject({
			owed: 5000, // 8000 debit − 3000 legacy credit
			totalCredits: 3000,
		});
	});
});
