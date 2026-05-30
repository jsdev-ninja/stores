import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Silence firebase logger; the function under test only uses logger.info/error.
vi.mock("firebase-functions/v2", () => ({
	logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { verifyHypSignature, HypVerifyCreds } from "./verifyHypSignature";

const creds: HypVerifyCreds = { KEY: "k", PassP: "p", masof: "12345" };
const baseParams = {
	Id: "777",
	CCode: "0",
	Amount: "100.00",
	Order: "ord-1",
	Masof: "12345",
};

function mockFetchText(text: string) {
	return vi.fn(async () => ({
		text: async () => text,
	})) as unknown as typeof fetch;
}

describe("verifyHypSignature", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("VERIFY gating", () => {
		it("returns valid:true when HYP responds CCode=0", async () => {
			vi.stubGlobal("fetch", mockFetchText("CCode=0&Id=777"));
			const r = await verifyHypSignature(baseParams, creds);
			expect(r.valid).toBe(true);
		});

		it("returns valid:false when HYP responds non-zero CCode (902)", async () => {
			vi.stubGlobal("fetch", mockFetchText("CCode=902"));
			const r = await verifyHypSignature(baseParams, creds);
			expect(r.valid).toBe(false);
			if (!r.valid) expect(r.reason).toContain("902");
		});

		it("fails closed (valid:false) when fetch throws a network error", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					throw new Error("boom");
				}) as unknown as typeof fetch,
			);
			const r = await verifyHypSignature(baseParams, creds);
			expect(r.valid).toBe(false);
			if (!r.valid) expect(r.reason).toBe("verify_network_error");
		});

		it("fails closed when the response has no CCode at all", async () => {
			vi.stubGlobal("fetch", mockFetchText("Id=777&foo=bar"));
			const r = await verifyHypSignature(baseParams, creds);
			expect(r.valid).toBe(false);
		});
	});

	describe("outbound request shape (what WE post to HYP)", () => {
		it("posts form-encoded VERIFY action with trimmed creds and forwarded params", async () => {
			const fetchMock = mockFetchText("CCode=0");
			vi.stubGlobal("fetch", fetchMock);

			await verifyHypSignature(
				{ ...baseParams, Sign: "sig", ACode: "ac" },
				{ KEY: "  k  ", PassP: "  p  ", masof: " 12345 " },
			);

			const [, opts] = (fetchMock as unknown as ReturnType<typeof vi.fn>)
				.mock.calls[0];
			expect((opts as RequestInit).method).toBe("POST");
			const body = new URLSearchParams((opts as RequestInit).body as string);
			expect(body.get("action")).toBe("APISign");
			expect(body.get("What")).toBe("VERIFY");
			// creds must be trimmed
			expect(body.get("KEY")).toBe("k");
			expect(body.get("PassP")).toBe("p");
			expect(body.get("Masof")).toBe("12345");
			// the HYP redirect params are forwarded back for verification
			expect(body.get("Id")).toBe("777");
			expect(body.get("Sign")).toBe("sig");
			expect(body.get("ACode")).toBe("ac");
		});

		it("omits undefined params from the forwarded body", async () => {
			const fetchMock = mockFetchText("CCode=0");
			vi.stubGlobal("fetch", fetchMock);

			// Sign / ACode left undefined
			await verifyHypSignature(baseParams, creds);

			const [, opts] = (fetchMock as unknown as ReturnType<typeof vi.fn>)
				.mock.calls[0];
			const body = new URLSearchParams((opts as RequestInit).body as string);
			expect(body.has("Sign")).toBe(false);
			expect(body.has("ACode")).toBe(false);
		});
	});
});
