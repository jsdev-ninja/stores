import * as crypto from "crypto";
import { logger } from "firebase-functions/v2";
import { hypPaymentService } from "../../../services/hypPaymentService";
import { writePaymentLink } from "../internal/paymentLinksStore";
import { TPaymentLinkRequest } from "../../../schema";

const LINK_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export type CreatePaymentLinkParams = {
	companyId: string;
	storeId: string;
	orderId: string;
	/** Integer agorot */
	amountAgorot: number;
	/** Base origin for the returned public URL, e.g. https://storebrix.com */
	origin: string;
	hypParams: TPaymentLinkRequest;
};

export type CreatePaymentLinkResult =
	| { success: true; url: string; token: string }
	| { success: false; error: string };

/**
 * Create a HYP signed payment link, persist it to paymentLinks, and
 * return the public /pay/{token} URL.
 */
export async function createPaymentLink(
	params: CreatePaymentLinkParams,
): Promise<CreatePaymentLinkResult> {
	const { companyId, storeId, orderId, amountAgorot, origin, hypParams } =
		params;

	const res = await hypPaymentService.createPaymentLink(hypParams);

	if (!res.success || !res.formAction || !res.formFields) {
		logger.error("ledger.createPaymentLink.hypFailed", {
			companyId,
			storeId,
			orderId,
			errMessage: res.errMessage,
		});
		return {
			success: false,
			error: res.errMessage ?? "Failed to create HYP payment link",
		};
	}

	// 16 base64url chars (12 random bytes → 16 base64url chars)
	const token = crypto.randomBytes(12).toString("base64url");
	const now = Date.now();

	await writePaymentLink({
		token,
		formAction: res.formAction,
		formFields: res.formFields,
		reference: { type: "order", id: orderId },
		amount: amountAgorot,
		currency: "ILS",
		createdAt: now,
		expiresAt: now + LINK_TTL_MS,
		usedAt: null,
		companyId,
		storeId,
	});

	const baseOrigin =
		origin && isValidHttpUrl(origin) ? origin : "https://storebrix.com";
	const url = `${baseOrigin}/pay/${token}`;

	logger.info("ledger.createPaymentLink.success", {
		companyId,
		storeId,
		orderId,
		token,
	});

	return { success: true, url, token };
}
