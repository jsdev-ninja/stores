import { logger } from "firebase-functions/v2";

const HYP_BASE_URL = "https://pay.hyp.co.il/p/";

/** Minimal HYP creds needed for VERIFY */
export type HypVerifyCreds = {
	KEY: string;
	PassP: string;
	masof: string;
};

/**
 * Fields that HYP requires back in the VERIFY call.
 * These are the params the customer browser received from HYP and now relays to us.
 */
export type HypVerifyParams = {
	Id: string;
	CCode: string;
	Amount: string;
	Order: string;
	ACode?: string;
	Sign?: string;
	Masof?: string;
	[key: string]: string | undefined;
};

export type HypVerifyResult =
	| { valid: true }
	| { valid: false; reason: string };

/**
 * Call HYP VERIFY (action=APISign&What=VERIFY) to confirm that a set of
 * redirect/response params genuinely came from HYP and were not tampered with.
 *
 * HYP returns CCode=0  → signature is valid.
 * HYP returns CCode=902 → signature is invalid.
 *
 * Pattern mirrors hypPaymentService — POST with form-encoded body, parse the
 * query-string response.
 */
export async function verifyHypSignature(
	params: HypVerifyParams,
	creds: HypVerifyCreds,
): Promise<HypVerifyResult> {
	try {
		// Build the body: all params HYP returned + store credentials + VERIFY action
		const body = new URLSearchParams({
			action: "APISign",
			What: "VERIFY",
			KEY: creds.KEY.trim(),
			PassP: creds.PassP.trim(),
			Masof: creds.masof.trim(),
			// Forward every param from the HYP redirect back to VERIFY
			...Object.fromEntries(
				Object.entries(params).filter(
					([, v]) => v !== undefined,
				) as [string, string][],
			),
		}).toString();

		logger.info("ledger.verifyHypSignature.request", {
			Id: params.Id,
			Order: params.Order,
			Masof: params.Masof,
		});

		const response = await fetch(HYP_BASE_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});

		const rawText = (await response.text()).trim();

		// Parse query-string response e.g. "CCode=0&Id=..."
		const result: Record<string, string> = rawText
			.split("&")
			.reduce(
				(acc, pair) => {
					const idx = pair.indexOf("=");
					if (idx > 0) {
						acc[pair.slice(0, idx)] = decodeURIComponent(
							pair.slice(idx + 1),
						);
					}
					return acc;
				},
				{} as Record<string, string>,
			);

		const ccode = result["CCode"];

		logger.info("ledger.verifyHypSignature.response", {
			Id: params.Id,
			CCode: ccode,
		});

		if (ccode === "0") {
			return { valid: true };
		}

		return {
			valid: false,
			reason: `HYP VERIFY returned CCode=${ccode ?? "unknown"}`,
		};
	} catch (err: unknown) {
		logger.error("ledger.verifyHypSignature.error", { err, Id: params.Id });
		return { valid: false, reason: "verify_network_error" };
	}
}
