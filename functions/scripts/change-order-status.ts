/**
 * Ops script — change an order's `status` by id.
 *
 * Lives OUTSIDE functions/src, so it is NOT part of the deployed build.
 *
 * Usage (from repo root or anywhere):
 *   GOOGLE_CLOUD_PROJECT=jsdev-stores-prod \
 *     functions/node_modules/.bin/tsx functions/scripts/change-order-status.ts \
 *     --order <orderId> [--company <companyId> --store <storeId>] [--status <status>] [--yes]
 *
 *   --order     (required) the order document id
 *   --company   (optional) companyId — pass together with --store to skip the lookup
 *   --store     (optional) storeId
 *   --status    (optional) target status; if omitted you pick it interactively
 *   --yes / -y  (optional) skip the confirmation prompt (use with care)
 *
 * If --company/--store are omitted, the order is located via a collection-group
 * query on its id. The current order is always printed, and unless --yes is
 * given you must type "yes" before anything is written.
 *
 * Requires Google ADC (`gcloud auth application-default login`).
 *
 * ⚠️ This MUTATES production order data. Double-check the order + target status.
 */
import admin from "firebase-admin";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { FirebaseAPI, OrderSchema, type TOrder } from "@jsdev_ninja/core";

// Source of truth for valid statuses — derived from the Order schema so this
// script can never drift from the entity definition.
const STATUSES = OrderSchema.shape.status.options as readonly string[];

type Args = {
	order?: string;
	company?: string;
	store?: string;
	status?: string;
	yes: boolean;
};

function parseArgs(argv: string[]): Args {
	const args: Args = { yes: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		switch (a) {
			case "--order":
				args.order = argv[++i];
				break;
			case "--company":
				args.company = argv[++i];
				break;
			case "--store":
				args.store = argv[++i];
				break;
			case "--status":
				args.status = argv[++i];
				break;
			case "--yes":
			case "-y":
				args.yes = true;
				break;
			default:
				console.error(`Unknown argument: ${a}`);
				process.exit(1);
		}
	}
	return args;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!args.order) {
		console.error("Missing --order <orderId>. See the header of this file for usage.");
		process.exit(1);
	}
	if (args.status && !STATUSES.includes(args.status)) {
		console.error(`Invalid --status "${args.status}". Valid: ${STATUSES.join(", ")}`);
		process.exit(1);
	}

	const projectId = process.env.GOOGLE_CLOUD_PROJECT;
	admin.initializeApp(projectId ? { projectId } : undefined);
	const db = admin.firestore();
	console.log(`Project: ${projectId ?? "(ADC default)"}`);

	// 1. Locate the order — explicit tenant path, or collection-group lookup by id.
	let ref: FirebaseFirestore.DocumentReference;
	if (args.company && args.store) {
		ref = db.doc(
			FirebaseAPI.firestore.getPath({
				companyId: args.company,
				storeId: args.store,
				collectionName: "orders",
				id: args.order,
			}),
		);
	} else {
		console.log(`Locating order "${args.order}" via collection-group lookup…`);
		const found = await db
			.collectionGroup("orders")
			.where("id", "==", args.order)
			.limit(1)
			.get();
		if (found.empty) {
			console.error(
				`Order not found: ${args.order}. If you know the tenant, pass --company <id> --store <id>.`,
			);
			process.exit(1);
		}
		ref = found.docs[0].ref;
	}

	const snap = await ref.get();
	if (!snap.exists) {
		console.error(`Order not found at ${ref.path}`);
		process.exit(1);
	}
	const order = snap.data() as TOrder;

	console.log("\nOrder found:");
	console.log(`  path:          ${ref.path}`);
	console.log(`  id:            ${order.id}`);
	console.log(`  status:        ${order.status}`);
	console.log(`  paymentStatus: ${order.paymentStatus ?? "(none)"}`);
	console.log(`  paymentType:   ${order.paymentType ?? "(none)"}`);

	// 2. Decide the target status (interactive select if not passed) + confirm.
	const rl = createInterface({ input, output });
	let target = args.status;
	let proceed = false;
	try {
		if (!target) {
			console.log("\nSelect the new status:");
			STATUSES.forEach((s, i) => {
				console.log(`  ${i + 1}) ${s}${s === order.status ? "   (current)" : ""}`);
			});
			const answer = (await rl.question("Enter number: ")).trim();
			const idx = Number(answer) - 1;
			if (!Number.isInteger(idx) || idx < 0 || idx >= STATUSES.length) {
				throw new Error(`Invalid selection: "${answer}"`);
			}
			target = STATUSES[idx];
		}

		if (target === order.status) {
			console.log(`\nStatus is already "${target}" — nothing to do.`);
		} else {
			console.log(`\nAbout to change status:  ${order.status}  →  ${target}`);
			console.log(`  on ${ref.path}`);
			if (args.yes) {
				proceed = true;
			} else {
				const confirm = (await rl.question('Type "yes" to confirm: ')).trim().toLowerCase();
				proceed = confirm === "yes";
				if (!proceed) console.log("Aborted. No changes written.");
			}
		}
	} finally {
		rl.close();
	}

	if (!proceed) process.exit(0);

	// 3. Write (merge so only `status` changes) + verify.
	await ref.set({ status: target }, { merge: true });
	const after = (await ref.get()).data() as TOrder;
	console.log(`\n✓ Updated ${ref.path}\n  status is now: ${after.status}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
