// One-off READ-ONLY: balasistore problem-group breakdown.
// For balasistore orders only, flags three (overlapping) groups:
//   G1: status !== "completed"
//   G2: paymentStatus !== "completed"
//   G3: missing invoice and/or delivery note
// One order can be in several groups. Prints group sizes, the overlap matrix,
// and what's inside each group; writes a CSV of every order in >=1 group.
// No prod reads, no mutations — reads the local NDJSON dump.
//
//   npx tsx src/_oneoff/balasiProblemGroups.ts
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_ID = "balasistore_store";

function newestDump(): string {
	const outDir = path.resolve(__dirname, "../../output");
	const files = fs
		.readdirSync(outDir)
		.filter((f) => f.startsWith("orders-export-") && f.endsWith(".ndjson"))
		.sort();
	if (!files.length) throw new Error(`No orders-export-*.ndjson in ${outDir}`);
	return path.join(outDir, files[files.length - 1]);
}

const DAY = 86400000;
const now = Date.now();
function toMillis(d: any): number | null {
	if (typeof d === "number") return d;
	if (d && typeof d === "object" && typeof d._seconds === "number") return d._seconds * 1000;
	return null;
}
function ageDays(d: any): number | "" {
	const ms = toMillis(d);
	return ms == null ? "" : Math.floor((now - ms) / DAY);
}

async function main() {
	const file = process.argv[2] ? path.resolve(process.argv[2]) : newestDump();
	const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });

	let storeTotal = 0;
	let g1 = 0;
	let g2 = 0;
	let g3 = 0;
	let inAny = 0;
	let g3InvoiceOnly = 0;
	let g3DnOnly = 0;
	let g3Both = 0;

	const g1ByStatus: Record<string, number> = {};
	const g2ByPayment: Record<string, number> = {};
	const combo: Record<string, number> = {};
	const rows: string[][] = [];

	// Grouped output: one bucket per group. An order is pushed into every bucket
	// it qualifies for, and each entry carries a `groups` list so its full
	// membership is visible from inside any single bucket.
	const groupStatusNotCompleted: any[] = [];
	const groupPaymentNotCompleted: any[] = [];
	const groupMissingDocs: any[] = [];

	for await (const raw of rl) {
		const lineStr = raw.trim();
		if (!lineStr) continue;
		const o = JSON.parse(lineStr);
		if (o._storeId !== STORE_ID) continue;
		storeTotal++;

		const G1 = o.status !== "completed";
		const G2 = o.paymentStatus !== "completed";
		const hasInvoice = !!(o.invoice || o.ezInvoice);
		const hasDN = !!(o.deliveryNote || o.ezDeliveryNote);
		const G3 = !hasInvoice || !hasDN;

		if (G1) {
			g1++;
			const k = String(o.status ?? "(none)");
			g1ByStatus[k] = (g1ByStatus[k] ?? 0) + 1;
		}
		if (G2) {
			g2++;
			const k = String(o.paymentStatus ?? "(none)");
			g2ByPayment[k] = (g2ByPayment[k] ?? 0) + 1;
		}
		if (G3) {
			g3++;
			if (!hasInvoice && !hasDN) g3Both++;
			else if (!hasInvoice) g3InvoiceOnly++;
			else g3DnOnly++;
		}

		if (G1 || G2 || G3) {
			inAny++;
			const tags = [G1 ? "G1" : "", G2 ? "G2" : "", G3 ? "G3" : ""].filter(Boolean);
			const key = tags.join("+");
			combo[key] = (combo[key] ?? 0) + 1;
			rows.push([
				o._orderId,
				(() => {
					const ms = toMillis(o.date);
					return ms == null ? "" : new Date(ms).toISOString().slice(0, 10);
				})(),
				String(ageDays(o.date)),
				String(o.status ?? ""),
				String(o.paymentStatus ?? ""),
				String(o.paymentType ?? ""),
				String(o.cart?.cartTotal ?? ""),
				String(hasInvoice),
				String(hasDN),
				String(G1),
				String(G2),
				String(G3),
				key,
			]);

			const ms = toMillis(o.date);
			const groups = [
				G1 ? "statusNotCompleted" : "",
				G2 ? "paymentNotCompleted" : "",
				G3 ? "missingDocs" : "",
			].filter(Boolean);
			const entry = {
				orderId: o._orderId,
				path: o._path,
				date: ms == null ? null : new Date(ms).toISOString(),
				ageDays: ms == null ? null : Math.floor((now - ms) / DAY),
				status: o.status ?? null,
				paymentStatus: o.paymentStatus ?? null,
				paymentType: o.paymentType ?? null,
				cartTotal: o.cart?.cartTotal ?? null,
				customer: o.nameOnInvoice ?? o.client?.displayName ?? o.client?.email ?? null,
				hasInvoice,
				hasDeliveryNote: hasDN,
				invoiceNumber: o.ezInvoice?.doc_number ?? o.invoice?.number ?? null,
				deliveryNoteNumber: o.ezDeliveryNote?.doc_number ?? o.deliveryNote?.number ?? null,
				groups,
			};
			if (G1) groupStatusNotCompleted.push(entry);
			if (G2) groupPaymentNotCompleted.push(entry);
			if (G3) groupMissingDocs.push(entry);
		}
	}

	const p = (s = "") => console.log(s);
	const fmt = (o: Record<string, number>) =>
		Object.entries(o)
			.sort((a, b) => b[1] - a[1])
			.map(([k, v]) => `${k}: ${v}`)
			.join(" · ");

	p(`=== balasistore — problem groups ===`);
	p(`Store orders: ${storeTotal}\n`);
	p(`Group sizes (an order can be in several):`);
	p(`  G1  status ≠ completed:         ${g1}`);
	p(`  G2  paymentStatus ≠ completed:  ${g2}`);
	p(`  G3  missing invoice and/or DN:  ${g3}`);
	p(`  In at least one group:          ${inAny}  (of ${storeTotal})\n`);
	p(`Overlap (each order counted once):`);
	for (const k of ["G1", "G2", "G3", "G1+G2", "G1+G3", "G2+G3", "G1+G2+G3"]) {
		p(`  ${k.padEnd(9)} ${combo[k] ?? 0}`);
	}
	p();
	p(`G1 — status ≠ completed, by status:`);
	p(`  ${fmt(g1ByStatus)}`);
	p(`G2 — paymentStatus ≠ completed, by paymentStatus:`);
	p(`  ${fmt(g2ByPayment)}`);
	p(`G3 — missing docs:`);
	p(`  missing invoice only: ${g3InvoiceOnly} · missing delivery note only: ${g3DnOnly} · missing both: ${g3Both}`);

	const header = [
		"orderId",
		"date",
		"ageDays",
		"status",
		"paymentStatus",
		"paymentType",
		"cartTotal",
		"hasInvoice",
		"hasDeliveryNote",
		"G1_statusNotCompleted",
		"G2_paymentNotCompleted",
		"G3_missingDocs",
		"groups",
	];
	const outCsv = path.resolve(__dirname, "../../output", "balasi-problem-groups.csv");
	fs.writeFileSync(outCsv, [header.join(","), ...rows.map((r) => r.join(","))].join("\n"));
	p(`\nCSV: ${outCsv}  (${rows.length} rows)`);

	const grouped = {
		store: STORE_ID,
		generatedAt: new Date().toISOString(),
		sourceDump: path.basename(file),
		totals: {
			storeOrders: storeTotal,
			statusNotCompleted: g1,
			paymentNotCompleted: g2,
			missingDocs: g3,
			inAnyGroup: inAny,
			clean: storeTotal - inAny,
		},
		groups: {
			statusNotCompleted: groupStatusNotCompleted,
			paymentNotCompleted: groupPaymentNotCompleted,
			missingDocs: groupMissingDocs,
		},
	};
	const outJson = path.resolve(__dirname, "../../output", "balasi-grouped.json");
	fs.writeFileSync(outJson, JSON.stringify(grouped, null, 2));
	p(
		`JSON: ${outJson}  ` +
			`(statusNotCompleted ${g1} · paymentNotCompleted ${g2} · missingDocs ${g3})`,
	);

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
