import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeFirestore } from "../__tests__/fakeFirestore";

// One shared fake Firestore instance per test, swapped in beforeEach.
let fake: FakeFirestore;

vi.mock("firebase-admin", () => ({
	default: { firestore: () => fake },
}));

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const emitMock = vi.fn<(...args: unknown[]) => void>();
vi.mock("../../../platform/eventBus", () => ({
	emit: (...args: unknown[]) => emitMock(...args),
	emitEvent: vi.fn(),
}));

const detectMock = vi.fn(async () => undefined);
vi.mock("./detectDuplicateCharges", () => ({
	detectDuplicateCharges: (...args: unknown[]) => detectMock(...args),
}));

import { postTransaction, PostTransactionInput } from "./postTransaction";

function hypResultInput(
	overrides: Partial<PostTransactionInput> = {},
): PostTransactionInput {
	return {
		source: "hyp_result",
		hypTransactionId: "HID-1",
		type: "hyp_direct",
		amount: 10000,
		currency: "ILS",
		direction: "in",
		reference: { type: "order", id: "order-1" },
		hyp: { masof: "12345", rawResponse: {} },
		companyId: "c1",
		storeId: "s1",
		...overrides,
	} as PostTransactionInput;
}

describe("postTransaction", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
		emitMock.mockClear();
		detectMock.mockClear();
	});

	describe("first write", () => {
		it("writes exactly one transaction doc at the deterministic path", async () => {
			const tx = await postTransaction(hypResultInput());
			expect(tx.id).toBe("hyp_HID-1");
			expect(fake.docs.get("c1/s1/transactions/hyp_HID-1")).toBeDefined();
			expect(fake.docs.size).toBe(1);
		});

		it("emits the transaction_posted event once inside the same transaction", async () => {
			await postTransaction(hypResultInput());
			expect(emitMock).toHaveBeenCalledTimes(1);
			const [, event] = emitMock.mock.calls[0];
			expect(event.type).toBe("ledger.transaction_posted");
			expect(event.payload.transactionId).toBe("hyp_HID-1");
			expect(event.payload.amount).toBe(10000);
		});
	});

	describe("idempotent replay (ALREADY_EXISTS)", () => {
		it("a duplicate hyp_result Id does NOT write a second doc", async () => {
			await postTransaction(hypResultInput());
			await postTransaction(hypResultInput());
			expect(fake.docs.size).toBe(1);
		});

		it("does NOT re-emit the event on the duplicate delivery", async () => {
			await postTransaction(hypResultInput());
			emitMock.mockClear();
			await postTransaction(hypResultInput());
			expect(emitMock).not.toHaveBeenCalled();
		});

		it("returns the existing stored doc on replay (idempotent no-op)", async () => {
			const first = await postTransaction(hypResultInput());
			const second = await postTransaction(
				hypResultInput({ amount: 99999 } as Partial<PostTransactionInput>),
			);
			// second call's amount is ignored — the stored (first) doc is returned
			expect(second.id).toBe(first.id);
			expect(second.amount).toBe(10000);
		});

		it("does not run duplicate-charge detection on a replay (only on first create)", async () => {
			await postTransaction(hypResultInput());
			detectMock.mockClear();
			await postTransaction(hypResultInput());
			expect(detectMock).not.toHaveBeenCalled();
		});
	});

	describe("dedup key per source", () => {
		it("api source writes to idem_{key}", async () => {
			await postTransaction({
				source: "api",
				idempotencyKey: "abc",
				actor: { type: "user", userId: "u1" },
				type: "manual",
				amount: 500,
				currency: "ILS",
				direction: "in",
				companyId: "c1",
				storeId: "s1",
			});
			expect(fake.docs.get("c1/s1/transactions/idem_abc")).toBeDefined();
		});
	});

	describe("duplicate-charge detection trigger", () => {
		it("runs detection for hyp_direct 'in' order transactions on first create", async () => {
			await postTransaction(hypResultInput());
			expect(detectMock).toHaveBeenCalledWith({
				companyId: "c1",
				storeId: "s1",
				orderId: "order-1",
			});
		});

		it("does NOT run detection for a manual transaction", async () => {
			await postTransaction({
				source: "api",
				idempotencyKey: "m1",
				actor: { type: "user", userId: "u1" },
				type: "manual",
				amount: 500,
				currency: "ILS",
				direction: "in",
				reference: { type: "order", id: "order-1" },
				companyId: "c1",
				storeId: "s1",
			});
			expect(detectMock).not.toHaveBeenCalled();
		});
	});

	describe("actor derivation", () => {
		it("hyp_result transactions are attributed to a customer actor", async () => {
			await postTransaction(hypResultInput());
			const stored = fake.docs.get("c1/s1/transactions/hyp_HID-1") as {
				actor: { type: string };
			};
			expect(stored.actor.type).toBe("customer");
		});
	});
});
