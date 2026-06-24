/**
 * THROWAWAY spike — depth/occlusion-aware detection experiment.
 *
 * Standalone googleAI call (does NOT import the module) so we can iterate on the
 * prompt + schema without touching prod code. Goal: also count units partially
 * hidden BEHIND the front row (front-row count vs depth-aware total estimate).
 *
 * Usage:
 *   GOOGLE_GENAI_API_KEY="$(cat /tmp/gk_spike)" \
 *     functions/node_modules/.bin/tsx functions/scripts/spike-fridge-detect.ts img [img...]
 */
import { readFileSync } from "node:fs";
import { extname, basename } from "node:path";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
	console.error("set GOOGLE_GENAI_API_KEY");
	process.exit(1);
}

const ai = genkit({
	plugins: [googleAI({ apiKey })],
	model: googleAI.model("gemini-2.5-flash"),
});

const ItemSchema = z.object({
	name: z.string().describe("short product name, Hebrew when legible"),
	visibleCount: z.number().int().min(0).describe("units clearly visible in the FRONT row"),
	estimatedTotal: z
		.number()
		.int()
		.min(0)
		.describe("best estimate of TRUE total incl. partially-hidden units behind (>= visibleCount)"),
	depthUncertain: z.boolean().describe("true if more units appear to be behind but cannot be counted exactly"),
	confidence: z.number().min(0).max(1),
});
const Schema = z.array(ItemSchema);

const PROMPT = `You are a grocery-inventory vision assistant for a fridge. Identify each distinct product visible.

CRITICAL: items in a fridge are stored MULTIPLE ROWS DEEP. Do NOT count only the front row.
For each product:
- visibleCount = units you can clearly see in front.
- Then look carefully for the SAME product partially hidden BEHIND the front units — a cap, shoulder, top, or edge peeking out between or behind them. Bottles and cartons are usually lined up several deep.
- estimatedTotal = your best estimate of the TRUE total including those partially-hidden units. estimatedTotal must be >= visibleCount.
- depthUncertain = true if you can tell more are behind but cannot count them exactly (still give a reasonable estimate).
Return: name (Hebrew when legible), visibleCount, estimatedTotal, depthUncertain, confidence (0-1).
Do not invent products you cannot see at all.`;

const MIME: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
};

function toDataUri(path: string): string {
	const ext = extname(path).toLowerCase();
	const mime = MIME[ext];
	if (!mime) throw new Error(`Unsupported extension "${ext}" for ${path}`);
	return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}

async function main() {
	const paths = process.argv.slice(2);
	if (paths.length === 0) {
		console.error("Usage: tsx scripts/spike-fridge-detect.ts <image1> [image2 ...]");
		process.exit(1);
	}
	console.log(`Images: ${paths.map((p) => basename(p)).join(", ")}`);
	console.log("Calling Gemini (depth-aware prompt)…\n");

	const parts = paths.map((p) => ({ media: { url: toDataUri(p) } }));
	const res = await ai.generate({ system: PROMPT, prompt: parts, output: { schema: Schema } });
	const items = res.output ?? [];

	console.log(`${items.length} products  (visible → estimated total)\n`);
	for (const it of items) {
		const flag = it.depthUncertain ? "  ⚠ depth?" : "";
		console.log(`  ${it.visibleCount} → ${it.estimatedTotal}${flag}   [conf ${it.confidence}]  ${it.name}`);
	}
	console.log("\n" + JSON.stringify(items, null, 2));
}

main();
