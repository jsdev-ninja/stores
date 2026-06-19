import { logger } from "../../../core";
import * as functionsV2 from "firebase-functions/v2";
import { DetectFridgeProductsRequestSchema } from "../types";
import { detectProductsFromImages } from "../services/detectProductsFromImages";

/**
 * detectFridgeProducts — THIN callable.
 *
 * Auth: requires a signed-in, non-anonymous Firebase user.
 * Input: { images: string[] } — 1–6 entries; each is an https URL or base64 data URI.
 * Output: { products: TDetectedItem[] }
 *
 * This callable is the first vertical slice / vision spike for the
 * "Build My Order From Fridge Photos" feature. It performs detection only —
 * no Algolia matching, no inventory template, no diff engine, no cart writes.
 */
export const detectFridgeProducts = functionsV2.https.onCall(
	{
		memory: "1GiB",
		timeoutSeconds: 540,
		invoker: "public",
	},
	async (request) => {
		try {
			const { data, auth } = request;

			// Auth guard: reject unauthenticated and anonymous users.
			if (!auth) {
				logger.write({
					severity: "WARNING",
					message: "detectFridgeProducts unauthenticated request rejected",
				});
				throw new functionsV2.https.HttpsError(
					"unauthenticated",
					"Authentication required.",
				);
			}
			if (auth.token.firebase?.sign_in_provider === "anonymous") {
				logger.write({
					severity: "WARNING",
					message: "detectFridgeProducts anonymous request rejected",
					uid: auth.uid,
				});
				throw new functionsV2.https.HttpsError(
					"permission-denied",
					"Anonymous users cannot use fridge scan.",
				);
			}

			// Input validation — parse and validate at the boundary.
			const parseResult = DetectFridgeProductsRequestSchema.safeParse(data);
			if (!parseResult.success) {
				logger.write({
					severity: "WARNING",
					message: "detectFridgeProducts invalid request",
					uid: auth.uid,
					error: parseResult.error.message,
				});
				throw new functionsV2.https.HttpsError(
					"invalid-argument",
					`Invalid request: ${parseResult.error.message}`,
				);
			}

			const { images } = parseResult.data;

			logger.write({
				severity: "INFO",
				message: "detectFridgeProducts start",
				uid: auth.uid,
				imageCount: images.length,
				// NEVER log image bytes, URLs, base64, or any secret
			});

			const result = await detectProductsFromImages({ images });

			logger.write({
				severity: "INFO",
				message: "detectFridgeProducts done",
				uid: auth.uid,
				imageCount: images.length,
				productCount: result.products.length,
				model: result.usage?.model ?? "gemini-2.5-flash",
			});

			return { products: result.products };
		} catch (error) {
			// Re-throw HttpsErrors directly — they are already user-safe.
			if (error instanceof functionsV2.https.HttpsError) {
				throw error;
			}

			// Quota / rate-limit errors from Vertex AI → friendly message.
			const isQuotaError =
				error instanceof Error &&
				(error.message.includes("429") ||
					error.message.includes("Too Many Requests") ||
					error.message.includes("quota"));

			logger.write({
				severity: isQuotaError ? "WARNING" : "ERROR",
				message: isQuotaError
					? "detectFridgeProducts quota exceeded"
					: "detectFridgeProducts error",
				error: error instanceof Error ? error.message : String(error),
			});

			if (isQuotaError) {
				throw new functionsV2.https.HttpsError(
					"resource-exhausted",
					"The vision service is temporarily unavailable. Please try again in a moment.",
				);
			}

			throw new functionsV2.https.HttpsError(
				"internal",
				"An unexpected error occurred. Please try again.",
			);
		}
	},
);
