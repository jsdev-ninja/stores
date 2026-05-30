import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StoredEvent } from "../../../platform/eventBus/types";
import { FakeFirestore } from "../../ledger/__tests__/fakeFirestore";
import type { TransactionPostedPayload } from "../../ledger/events";

// One shared fake Firestore instance per test, swapped in beforeEach.
let fake: FakeFirestore;

vi.mock("firebase-admin", () => ({
	default: { firestore: () => fake },
}));

vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Capture the raw handler passed to subscribe() so we can drive the business
// logic directly, bypassing the Cloud Function / eventBus retry wrapper.
type RawHandler = (
	event: StoredEvent<TransactionPostedPayload>,
	ctx: { companyId: string; storeId: string; eventId: string },
) => Promise<void>;

// vi.hoisted runs before any hoisted import/mock, so the holder is guaranteed
// to exist when the mocked subscribe() executes at SUT import time.
const handlerHolder = vi.hoisted(
	() => ({ current: undefined }) as { current?: RawHandler },
);

vi.mock("../../../platform/eventBus", () => ({
	subscribe: (_options: unknown, handler: RawHandler) => {
		handlerHolder.current = handler;
		return vi.fn(); // stand-in for the returned Cloud Function
	},
}));

const capturedHandler: RawHandler = (event, c) =>
	handlerHolder.current!(event, c);

// Importing the module registers the subscriber and captures the handler.
import "./markOrderPaidOnTransactionPosted";

const COMPANY_ID = "c1";
const STORE_ID = "s1";
const ORDER_ID = "order-1";
const ORDER_PATH = `${COMPANY_ID}/${STORE_ID}/orders/${ORDER_ID}`;

function makeEvent(
	payload: Partial<TransactionPostedPayload> = {},
): StoredEvent<TransactionPostedPayload> {
	return {
		payload: {
			transactionId: "TX-1",
			type: "hyp_j5_auth",
			amount: 10000,
			direction: "in",
			reference: { type: "order", id: ORDER_ID },
			...payload,
		} as TransactionPostedPayload,
	} as StoredEvent<TransactionPostedPayload>;
}

const ctx = {
	companyId: COMPANY_ID,
	storeId: STORE_ID,
	eventId: "evt-1",
};

function seedOrder(paymentStatus?: string): void {
	fake.docs.set(ORDER_PATH, paymentStatus ? { paymentStatus } : {});
}

describe("onTransactionPostedMarkOrderPaid", () => {
	beforeEach(() => {
		fake = new FakeFirestore();
	});

	describe("guards that skip without touching Firestore", () => {
		it("does not write when reference type is not 'order'", async () => {
			seedOrder("pending");
			await capturedHandler(
				makeEvent({ reference: { type: "refund", id: ORDER_ID } }),
				ctx,
			);
			expect(fake.setCalls).toHaveLength(0);
			expect(fake.docs.get(ORDER_PATH)).toEqual({ paymentStatus: "pending" });
		});

		it("does not write when reference is undefined", async () => {
			seedOrder("pending");
			await capturedHandler(makeEvent({ reference: undefined }), ctx);
			expect(fake.setCalls).toHaveLength(0);
		});

		it("does not write when direction is 'out'", async () => {
			seedOrder("pending");
			await capturedHandler(makeEvent({ direction: "out" }), ctx);
			expect(fake.setCalls).toHaveLength(0);
			expect(fake.docs.get(ORDER_PATH)).toEqual({ paymentStatus: "pending" });
		});
	});

	describe("type → paymentStatus mapping", () => {
		it("maps hyp_j5_auth to pending_j5 and records lastPaymentTransactionId", async () => {
			seedOrder("pending");
			await capturedHandler(
				makeEvent({ type: "hyp_j5_auth", transactionId: "TX-J5" }),
				ctx,
			);
			expect(fake.setCalls).toHaveLength(1);
			expect(fake.docs.get(ORDER_PATH)).toMatchObject({
				paymentStatus: "pending_j5",
				lastPaymentTransactionId: "TX-J5",
			});
		});

		it("maps hyp_capture to completed", async () => {
			seedOrder("pending_j5");
			await capturedHandler(makeEvent({ type: "hyp_capture" }), ctx);
			expect(fake.docs.get(ORDER_PATH)).toMatchObject({
				paymentStatus: "completed",
			});
		});

		it("maps hyp_direct to completed", async () => {
			seedOrder("pending");
			await capturedHandler(makeEvent({ type: "hyp_direct" }), ctx);
			expect(fake.docs.get(ORDER_PATH)).toMatchObject({
				paymentStatus: "completed",
			});
		});

		it("maps manual to completed", async () => {
			seedOrder("pending");
			await capturedHandler(makeEvent({ type: "manual" }), ctx);
			expect(fake.docs.get(ORDER_PATH)).toMatchObject({
				paymentStatus: "completed",
			});
		});
	});

	describe("downgrade guard", () => {
		it("does not overwrite a 'completed' order with an incoming hyp_j5_auth", async () => {
			seedOrder("completed");
			await capturedHandler(makeEvent({ type: "hyp_j5_auth" }), ctx);
			expect(fake.setCalls).toHaveLength(0);
			expect(fake.docs.get(ORDER_PATH)).toEqual({ paymentStatus: "completed" });
		});

		it("does not overwrite a 'refunded' order", async () => {
			seedOrder("refunded");
			await capturedHandler(makeEvent({ type: "hyp_capture" }), ctx);
			expect(fake.setCalls).toHaveLength(0);
			expect(fake.docs.get(ORDER_PATH)).toEqual({ paymentStatus: "refunded" });
		});
	});

	describe("idempotency", () => {
		it("is a no-op when the order is already at the target status", async () => {
			seedOrder("pending_j5");
			await capturedHandler(makeEvent({ type: "hyp_j5_auth" }), ctx);
			expect(fake.setCalls).toHaveLength(0);
			expect(fake.docs.get(ORDER_PATH)).toEqual({ paymentStatus: "pending_j5" });
		});
	});

	describe("missing order", () => {
		it("throws (to trigger eventBus retry) when the order does not exist", async () => {
			// no seedOrder — the doc is absent
			await expect(
				capturedHandler(makeEvent({ type: "hyp_capture" }), ctx),
			).rejects.toThrow(/Order not found/);
			expect(fake.setCalls).toHaveLength(0);
		});
	});

	// Case 8 (unknown transaction type → no write) is NOT testable here:
	// TransactionPostedPayload.type is a Zod enum of exactly
	// ["manual","hyp_direct","hyp_j5_auth","hyp_capture"], all of which map to a
	// known paymentStatus. The unknown-type guard is unreachable through the real
	// schema, so it is intentionally omitted.
});
