// One-off WRITE script — marks one or more orders as status "cancelled".
//
// Equivalent to the admin "Cancel order" action: it writes ONLY
// { status: "cancelled", updatedBy, updatedAt }. The deployed onOrderUpdate
// trigger fires the same `order.cancelled` event, so backend behaviour matches
// the admin path.
//
// SAFETY (read before running):
//  - DRY-RUN by default. Prints what it WOULD do and writes NOTHING.
//    Writes only when you pass --commit.
//  - Resolves each order through its real Firestore document ref (via
//    collectionGroup) — no hand-built paths, no chance of hitting the wrong doc.
//  - Skips orders already "cancelled" (idempotent no-op).
//  - Refuses to cancel "completed" / "refunded" orders unless you pass --force.
//  - Only the order ids you list are touched. There is no "cancel a whole group"
//    mode — smallest possible blast radius.
//
//   npx tsx src/_oneoff/cancelOrder.ts <orderId> [orderId...]            # dry-run (safe)
//   npx tsx src/_oneoff/cancelOrder.ts <orderId> [orderId...] --commit   # actually writes
//   ...add --force to also allow cancelling completed/refunded orders
//
// NOTE: cancelling does NOT auto-release a J5 hold or reverse the ledger — there
// are currently no active subscribers to `order.cancelled`. Same as the admin UI.
// Do not use this to "refund" a paid order.
import { admin } from "../admin";

const CANCELLED = "cancelled"; // canonical enum value — NOT the "canceled" typo
const TERMINAL_BLOCK = new Set(["completed", "refunded"]);
const UPDATED_BY = "ops-script:cancelOrder";

async function main() {
	const args = process.argv.slice(2);
	const commit = args.includes("--commit");
	const force = args.includes("--force");
	const ids = args.filter((a) => !a.startsWith("--"));

	if (!ids.length) {
		console.error(
			"Usage: npx tsx src/_oneoff/cancelOrder.ts <orderId> [orderId...] [--commit] [--force]",
		);
		process.exit(1);
	}

	const db = admin.firestore();
	console.log(
		`Resolving ${ids.length} order id(s) from PROD…  mode=${commit ? "COMMIT — WILL WRITE" : "DRY-RUN (no writes)"}\n`,
	);

	// Resolve each order by its real document ref so we never guess a path.
	const snap = await db.collectionGroup("orders").get();
	const byId = new Map<string, any[]>();
	for (const d of snap.docs) {
		const arr = byId.get(d.id) ?? [];
		arr.push(d);
		byId.set(d.id, arr);
	}

	const toWrite: { ref: any; path: string; from: string }[] = [];
	for (const id of ids) {
		const matches = byId.get(id) ?? [];
		if (matches.length === 0) {
			console.log(`✗ ${id} — NOT FOUND, skipping`);
			continue;
		}
		if (matches.length > 1) {
			console.log(`✗ ${id} — ${matches.length} docs share this id (ambiguous), skipping`);
			continue;
		}
		const doc = matches[0];
		const o: any = doc.data();
		const cur = String(o.status ?? "(none)");
		if (cur === CANCELLED) {
			console.log(`• ${doc.ref.path} — already cancelled, skip`);
			continue;
		}
		if (TERMINAL_BLOCK.has(cur) && !force) {
			console.log(`⚠ ${doc.ref.path} — status="${cur}" is terminal; refusing without --force, skip`);
			continue;
		}
		console.log(
			`→ ${doc.ref.path}\n    "${cur}" → "cancelled"   ` +
				`(paymentStatus=${o.paymentStatus ?? "?"}, paymentType=${o.paymentType ?? "?"}, total=${o.cart?.cartTotal ?? "?"})`,
		);
		toWrite.push({ ref: doc.ref, path: doc.ref.path, from: cur });
	}

	console.log(`\n${toWrite.length} order(s) eligible to cancel.`);
	if (!commit) {
		console.log("DRY-RUN — nothing was written. Re-run with --commit to apply.");
		process.exit(0);
	}
	if (!toWrite.length) {
		console.log("Nothing to write.");
		process.exit(0);
	}

	const now = Date.now();
	for (const w of toWrite) {
		await w.ref.update({ status: CANCELLED, updatedBy: UPDATED_BY, updatedAt: now });
		console.log(`✓ cancelled ${w.path}  (was "${w.from}")`);
	}
	console.log(`\nDone. Wrote ${toWrite.length} order(s).`);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
