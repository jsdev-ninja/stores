import { describe, it, expect, vi } from "vitest";

// docIds only touches admin.firestore() in the "system" branch (auto id).
// Mock firebase-admin so the auto-id branch is deterministic and offline.
vi.mock("firebase-admin", () => {
	let n = 0;
	return {
		default: {
			firestore: () => ({
				collection: () => ({
					doc: () => ({ id: `auto-id-${++n}` }),
				}),
			}),
		},
	};
});

import { transactionDocId } from "./docIds";

describe("transactionDocId", () => {
	describe("deterministic dedup keys by source", () => {
		it("subscriber → evt_{subscriberName}_{eventId}, docId === dedupKey", () => {
			const r = transactionDocId({
				source: "subscriber",
				subscriberName: "orderPaid",
				eventId: "evt-123",
			});
			expect(r.dedupKey).toBe("evt_orderPaid_evt-123");
			expect(r.docId).toBe("evt_orderPaid_evt-123");
		});

		it("api → idem_{idempotencyKey}, docId === dedupKey", () => {
			const r = transactionDocId({
				source: "api",
				idempotencyKey: "key-abc",
			});
			expect(r.dedupKey).toBe("idem_key-abc");
			expect(r.docId).toBe("idem_key-abc");
		});

		it("hyp_result → hyp_{hypTransactionId}, docId === dedupKey", () => {
			const r = transactionDocId({
				source: "hyp_result",
				hypTransactionId: "9988",
			});
			expect(r.dedupKey).toBe("hyp_9988");
			expect(r.docId).toBe("hyp_9988");
		});
	});

	describe("system source", () => {
		it("uses an auto-generated id where docId === dedupKey (no prefix)", () => {
			const r = transactionDocId({ source: "system" });
			expect(r.docId).toBe(r.dedupKey);
			expect(r.docId).toMatch(/^auto-id-\d+$/);
		});

		it("produces a distinct id on each call", () => {
			const a = transactionDocId({ source: "system" });
			const b = transactionDocId({ source: "system" });
			expect(a.docId).not.toBe(b.docId);
		});
	});

	describe("dedup determinism", () => {
		it("the same hyp_result Id maps to the same docId every time (one tx per HYP Id)", () => {
			const a = transactionDocId({ source: "hyp_result", hypTransactionId: "X" });
			const b = transactionDocId({ source: "hyp_result", hypTransactionId: "X" });
			expect(a.docId).toBe(b.docId);
		});

		it("the same subscriber event maps to the same docId every time", () => {
			const a = transactionDocId({
				source: "subscriber",
				subscriberName: "s",
				eventId: "e",
			});
			const b = transactionDocId({
				source: "subscriber",
				subscriberName: "s",
				eventId: "e",
			});
			expect(a.docId).toBe(b.docId);
		});
	});
});
