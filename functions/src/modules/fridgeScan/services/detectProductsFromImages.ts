import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { logger } from "../../../core";
import { DetectedItemArraySchema, TDetectedItem } from "../types";

// One module-level ai instance — avoids cold-start cost on warm instances.
// Mirrors the pattern in functions/src/services/genkit-service/index.ts.
const ai = genkit({
	plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
	model: googleAI.model("gemini-2.5-flash"),
});

const DETECTION_PROMPT = `You are a grocery-inventory vision assistant for an Israeli supermarket. \
Identify each distinct food or household product visible across the provided images.

Return the product name and brand in HEBREW (use on-package Hebrew text when legible). \
Anchor brands to Israeli brands such as: תנובה, טרה, אסם, שטראוס, עלית, תלמה, יטבתה \
(Tnuva, Tara, Osem, Strauss, Elite, Telma, Yotvata).

For each item return:
- heName: Hebrew product noun (e.g. חלב 3%)
- heBrand: Israeli brand name in Hebrew, or null if not legible
- quantity: integer count of clearly visible distinct units
- unitHint: one of unit / kg / gram / liter / ml / unknown
- confidence: your confidence in the identification, 0 to 1
- countUncertain: true if items are stacked or occluded and you cannot count exactly; \
  in that case set quantity to your best minimum

Do not invent products you cannot see. Omit anything you are unsure exists.`;

export type DetectProductsResult = {
	products: TDetectedItem[];
	usage?: {
		inputTokens?: number;
		outputTokens?: number;
		model: string;
	};
};

/**
 * Calls Gemini vision to identify grocery products across the supplied images.
 *
 * @param args.images - Array of image strings: each is either an https URL or a
 *   base64 data URI (data:image/...;base64,...). Max 6 enforced by the caller.
 */
export async function detectProductsFromImages(args: {
	images: string[];
}): Promise<DetectProductsResult> {
	const { images } = args;

	logger.info("fridgeScan.detectProductsFromImages.start", {
		imageCount: images.length,
	});

	// Build the prompt content: system text + one media part per image.
	// MediaPart shape per @genkit-ai/ai: { media: { url: string, contentType?: string } }
	const promptParts = images.map((imageUrl) => ({
		media: { url: imageUrl },
	}));

	const response = await ai.generate({
		system: DETECTION_PROMPT,
		prompt: promptParts,
		output: { schema: DetectedItemArraySchema },
	});

	// output.parsed is the validated, schema-typed array
	const rawOutput = response.output;

	// Validate the model output against our schema at runtime.
	// ai.generate with output.schema should already parse, but we re-validate
	// defensively to guard against any model hallucination that bypasses the SDK.
	const parseResult = DetectedItemArraySchema.safeParse(rawOutput);
	const products: TDetectedItem[] = parseResult.success ? parseResult.data : [];

	if (!parseResult.success) {
		logger.warn("fridgeScan.detectProductsFromImages.parseError", {
			error: parseResult.error.message,
		});
	}

	// Extract token usage if available in the response
	const usage = response.usage
		? {
			inputTokens: response.usage.inputTokens,
			outputTokens: response.usage.outputTokens,
			model: "gemini-2.5-flash",
		}
		: { model: "gemini-2.5-flash" };

	logger.info("fridgeScan.detectProductsFromImages.done", {
		productCount: products.length,
		inputTokens: usage.inputTokens,
		outputTokens: usage.outputTokens,
		model: usage.model,
	});

	return { products, usage };
}
