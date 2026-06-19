/**
 * THROWAWAY spike runner — calls detectProductsFromImages directly on local
 * fridge photo(s) and prints what Gemini detected.
 *
 * Lives OUTSIDE functions/src, so it is not part of the deployed build.
 * Delete after the vision-accuracy spike.
 *
 * Usage (from repo root or anywhere):
 *   GOOGLE_CLOUD_PROJECT=<gcp-project-with-vertex> \
 *     functions/node_modules/.bin/tsx functions/scripts/spike-fridge-detect.ts \
 *     /path/to/fridge1.jpg [/path/to/fridge2.jpg ...]
 *
 * Requires Google ADC (`gcloud auth application-default login`) and a project
 * with Vertex AI enabled (the chatbot already runs Gemini in jsdev-stores-prod).
 */
import { readFileSync } from "node:fs";
import { extname, basename } from "node:path";
import { detectProductsFromImages } from "../src/modules/fridgeScan/services/detectProductsFromImages";

const MIME: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
};

function toDataUri(path: string): string {
	const ext = extname(path).toLowerCase();
	const mime = MIME[ext];
	if (!mime) {
		throw new Error(`Unsupported extension "${ext}" for ${path} (use jpg/png/webp)`);
	}
	const b64 = readFileSync(path).toString("base64");
	return `data:${mime};base64,${b64}`;
}

async function main() {
	const paths = process.argv.slice(2);
	if (paths.length === 0) {
		console.error("Usage: tsx scripts/spike-fridge-detect.ts <image1> [image2 ...]");
		process.exit(1);
	}
	if (paths.length > 6) {
		console.error(`Got ${paths.length} images; the detector caps at 6.`);
		process.exit(1);
	}

	console.log(`Project: ${process.env.GOOGLE_CLOUD_PROJECT ?? "(ADC default)"}`);
	console.log(`Images:  ${paths.map((p) => basename(p)).join(", ")}`);
	console.log("Calling Gemini…\n");

	const images = paths.map(toDataUri);
	const started = Date.now();
	try {
		const result = await detectProductsFromImages({ images });
		const ms = Date.now() - started;
		console.log(`✓ ${result.products.length} product(s) in ${ms}ms`);
		console.log(`Usage: ${JSON.stringify(result.usage)}\n`);
		console.log(JSON.stringify(result.products, null, 2));
	} catch (err) {
		const ms = Date.now() - started;
		console.error(`✗ failed after ${ms}ms`);
		console.error(err);
		process.exit(1);
	}
}

main();
