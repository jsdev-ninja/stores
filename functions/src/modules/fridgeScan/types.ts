import { z } from "genkit";

// ── Gemini detection output ──────────────────────────────────────────────────
// These schemas are backend-only; they are NOT shared with the client.
// The client-facing types (ReviewRow, etc.) live in @jsdev_ninja/core.

export const DetectedItemSchema = z.object({
	/** Hebrew product noun as seen on packaging */
	heName: z.string(),
	/** Israeli brand name in Hebrew, or null when not legible */
	heBrand: z.string().nullable(),
	/** Integer count of clearly visible distinct units */
	quantity: z.number().int().min(0),
	/** Coarse unit hint from the vision model */
	unitHint: z.enum(["unit", "kg", "gram", "liter", "ml", "unknown"]),
	/** Gemini's confidence in the detection, 0–1 */
	confidence: z.number().min(0).max(1),
	/** True when items are stacked/occluded and exact count is uncertain */
	countUncertain: z.boolean(),
});

export const DetectedItemArraySchema = z.array(DetectedItemSchema);

export type TDetectedItem = z.infer<typeof DetectedItemSchema>;

// ── Callable request schema ──────────────────────────────────────────────────
// Each image string is either:
//   - a base64 data URI:   data:image/jpeg;base64,...
//   - an https download URL: https://...
// companyId / storeId / userId are derived from auth.token — NEVER sent by client.

export const DetectFridgeProductsRequestSchema = z.object({
	images: z.array(z.string().min(1)).min(1).max(6),
});

export type TDetectFridgeProductsRequest = z.infer<
	typeof DetectFridgeProductsRequestSchema
>;
