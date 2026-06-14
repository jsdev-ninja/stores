// One-off READ-ONLY analysis of an exported orders NDJSON dump.
// Reads the dump produced by exportAllOrders.ts and prints COUNTS per problem
// bucket. No prod reads, no mutations — pure local-file analysis.
//
//   npx tsx src/_oneoff/classifyProblemOrders.ts            # newest output/orders-export-*.ndjson
//   npx tsx src/_oneoff/classifyProblemOrders.ts <file>     # a specific dump
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function newestDump(): string {
	const outDir = path.resolve(__dirname, "../../output");
	const files = fs
		.readdirSync(outDir)
		.filter((f) => f.startsWith("orders-export-") && f.endsWith(".ndjson"))
		.sort();
	if (!files.length) {
		throw new Error(`No orders-export-*.ndjson in ${outDir} — run exportAllOrders.ts first`);
	}
	return path.join(outDir, files[files.length - 1]);
}

const DAY = 86400000;
const now = Date.now();

// date is epoch millis by convention, but legacy docs may carry a Firestore
// Timestamp that serialized to { _seconds, _nanoseconds }. Normalise both.
function toMillis(d: any): number | null {
	if (typeof d === "number") return d;
	if (d && typeof d === "object" && typeof d._seconds === "number") return d._seconds * 1000;
	return null;
}
function ageDays(d: any): number | null {
	const ms = toMillis(d);
	return ms == null ? null : Math.floor((now - ms) / DAY);
}

const KNOWN_STATUS = new Set([
	"draft",
	"pending",
	"processing",
	"in_delivery",
	"delivered",
	"completed",
	"cancelled",
	"refunded",
]);

async function main() {
	const file = process.argv[2] ? path.resolve(process.argv[2]) : newestDump();
	console.log(`Analyzing: ${file}\n`);

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity,
	});

	let total = 0;
	let completed = 0;
	let completedNotPaid = 0;
	let paidNotProgressed = 0;
	let ezInvoiceFailed = 0;
	let ezDnFailed = 0;
	let completedMissingBoth = 0;

	const statusCanceledTypo: string[] = [];
	const statusMissing: string[] = [];
	const statusUnknown: string[] = [];

	const inflight: Record<string, number> = { pending: 0, processing: 0, in_delivery: 0, delivered: 0 };
	const inflightOldest: Record<string, number> = { pending: 0, processing: 0, in_delivery: 0, delivered: 0 };
	const missingInvoice: Record<string, number> = { external: 0, j5: 0, none: 0, other: 0 };
	const missingDN: Record<string, number> = { external: 0, j5: 0, none: 0, other: 0 };

	for await (const raw of rl) {
		const lineStr = raw.trim();
		if (!lineStr) continue;
		const o = JSON.parse(lineStr);
		total++;

		const ref = `${o._companyId}/${o._storeId}/${o._orderId}`;
		const status: unknown = o.status;
		const pt = o.paymentType ?? "none";
		const ptKey = pt === "external" || pt === "j5" || pt === "none" ? pt : "other";

		// anomalies
		if (status === "canceled") statusCanceledTypo.push(ref);
		if (status == null || status === "") statusMissing.push(ref);
		else if (typeof status === "string" && status !== "canceled" && !KNOWN_STATUS.has(status))
			statusUnknown.push(`${ref} (status=${status})`);

		// in-flight (post-draft, pre-terminal)
		if (status === "pending" || status === "processing" || status === "in_delivery" || status === "delivered") {
			inflight[status]++;
			const a = ageDays(o.date);
			if (a != null && a > inflightOldest[status]) inflightOldest[status] = a;
		}

		const hasInvoice = !!(o.invoice || o.ezInvoice);
		const hasDN = !!(o.deliveryNote || o.ezDeliveryNote);

		if (status === "completed") {
			completed++;
			if (!hasInvoice) missingInvoice[ptKey]++;
			if (!hasDN) missingDN[ptKey]++;
			if (!hasInvoice && !hasDN) completedMissingBoth++;
			// external = credit terms, legitimately unpaid; otherwise flag.
			if (o.paymentStatus !== "completed" && o.paymentStatus !== "external") completedNotPaid++;
		}

		// ezCount generation errors (independent of status)
		if (o.ezInvoice && o.ezInvoice.success === false) ezInvoiceFailed++;
		if (o.ezDeliveryNote && o.ezDeliveryNote.success === false) ezDnFailed++;

		// money captured but order never moved forward
		if (
			o.paymentStatus === "completed" &&
			!["completed", "delivered", "in_delivery", "refunded"].includes(status as string)
		) {
			paidNotProgressed++;
		}
	}

	const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
	const p = (s = "") => console.log(s);

	p(`Total orders analyzed: ${total}`);
	p();
	p("── DATA ANOMALIES ───────────────────────────────────");
	p(`status "canceled" (typo — should be "cancelled"): ${statusCanceledTypo.length}`);
	statusCanceledTypo.forEach((r) => p(`    ${r}`));
	p(`status missing/empty: ${statusMissing.length}`);
	statusMissing.forEach((r) => p(`    ${r}`));
	if (statusUnknown.length) {
		p(`status unknown value: ${statusUnknown.length}`);
		statusUnknown.forEach((r) => p(`    ${r}`));
	}
	p();
	p("── IN-FLIGHT / NOT COMPLETED (excl. draft/cancelled/refunded) ──");
	(["pending", "processing", "in_delivery", "delivered"] as const).forEach((s) =>
		p(`${s.padEnd(12)} ${String(inflight[s]).padStart(4)}   (oldest ${inflightOldest[s]}d)`),
	);
	p(`${"→ total".padEnd(12)} ${String(sum(inflight)).padStart(4)}`);
	p();
	p(`── COMPLETED ORDERS: ${completed} ──────────────────────`);
	p(
		`missing invoice (no invoice & no ezInvoice): ${sum(missingInvoice)}  ` +
			`[external ${missingInvoice.external} · j5 ${missingInvoice.j5} · none ${missingInvoice.none}` +
			`${missingInvoice.other ? ` · other ${missingInvoice.other}` : ""}]`,
	);
	p(
		`missing delivery note (no DN & no ezDN):     ${sum(missingDN)}  ` +
			`[external ${missingDN.external} · j5 ${missingDN.j5} · none ${missingDN.none}` +
			`${missingDN.other ? ` · other ${missingDN.other}` : ""}]`,
	);
	p(`missing BOTH docs:                            ${completedMissingBoth}`);
	p();
	p("── DOC-GEN FAILURES (ezCount success=false) ─────────");
	p(`ezInvoice failed:      ${ezInvoiceFailed}`);
	p(`ezDeliveryNote failed: ${ezDnFailed}`);
	p();
	p("── STATUS / PAYMENT MISMATCH ────────────────────────");
	p(`completed but paymentStatus not completed/external: ${completedNotPaid}`);
	p(`paymentStatus completed but order not progressed:   ${paidNotProgressed}`);

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
