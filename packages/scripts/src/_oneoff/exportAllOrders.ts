// One-off READ-ONLY export of the entire `orders` collection group.
// Streams EVERY order (all companies/stores, all time) to an NDJSON file —
// one order per line, with _path/_companyId/_storeId/_orderId added up front.
// Pure reads, no mutations.
//
//   npx tsx src/_oneoff/exportAllOrders.ts --count   # just print how many orders exist (cheap aggregate)
//   npx tsx src/_oneoff/exportAllOrders.ts           # full export → packages/scripts/output/
//
// Output dir is gitignored: the dump contains prod customer PII — do NOT commit or share it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { admin } from "../admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const countOnly = process.argv.includes("--count");

async function main() {
	const db = admin.firestore();

	// Cheap pre-flight: how many orders are we about to read?
	if (countOnly) {
		const snap = await db.collectionGroup("orders").count().get();
		console.log(`orders collectionGroup count: ${snap.data().count}`);
		process.exit(0);
	}

	const outDir = path.resolve(__dirname, "../../output");
	fs.mkdirSync(outDir, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const outPath = path.join(outDir, `orders-export-${stamp}.ndjson`);
	const out = fs.createWriteStream(outPath, { encoding: "utf8" });

	// Running aggregates so we get a lay-of-the-land the moment it finishes.
	let total = 0;
	let nonCanonical = 0;
	const byStore: Record<string, number> = {};
	const byStatus: Record<string, number> = {};
	const byPaymentType: Record<string, number> = {};

	console.log(`Streaming collectionGroup('orders') from PROD → ${outPath}`);

	await new Promise<void>((resolve, reject) => {
		const stream = db.collectionGroup("orders").stream();

		stream.on("data", (doc: any) => {
			const data = doc.data();

			// Canonical order path is `{companyId}/{storeId}/orders/{orderId}` (4 segments).
			// Anything else is flagged so it stands out instead of corrupting the tenant columns.
			const segs: string[] = doc.ref.path.split("/");
			const canonical = segs.length === 4 && segs[2] === "orders";
			if (!canonical) nonCanonical++;
			const companyId = canonical ? segs[0] : "(non-canonical)";
			const storeId = canonical ? segs[1] : "(non-canonical)";

			const record = {
				_path: doc.ref.path,
				_companyId: companyId,
				_storeId: storeId,
				_orderId: doc.id,
				...data,
			};

			// Honour backpressure so a slow disk can't blow up memory on a big export.
			const ok = out.write(JSON.stringify(record) + "\n");
			if (!ok) {
				stream.pause();
				out.once("drain", () => stream.resume());
			}

			total++;
			byStore[`${companyId}/${storeId}`] = (byStore[`${companyId}/${storeId}`] ?? 0) + 1;
			const st = String(data.status ?? "(none)");
			byStatus[st] = (byStatus[st] ?? 0) + 1;
			const pt = String(data.paymentType ?? "(none)");
			byPaymentType[pt] = (byPaymentType[pt] ?? 0) + 1;

			if (total % 500 === 0) console.log(`… ${total} orders`);
		});

		stream.on("end", () => resolve());
		stream.on("error", reject);
	});

	await new Promise<void>((res) => out.end(res));

	const summary = {
		exportedAt: new Date().toISOString(),
		outPath,
		total,
		nonCanonicalPaths: nonCanonical,
		stores: Object.keys(byStore).length,
		byStatus,
		byPaymentType,
		byStore,
	};
	const summaryPath = path.join(outDir, `orders-export-${stamp}.summary.json`);
	fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

	console.log("\n=== EXPORT COMPLETE ===");
	console.log(`Total orders:   ${total}`);
	console.log(`Stores:         ${summary.stores}`);
	if (nonCanonical) console.log(`Non-canonical paths: ${nonCanonical}`);
	console.log("By status:      ", byStatus);
	console.log("By paymentType: ", byPaymentType);
	console.log(`\nNDJSON:  ${outPath}`);
	console.log(`Summary: ${summaryPath}`);

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
