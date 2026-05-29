// One-off READ-ONLY script.
// 1) Looks up the user's profile via collection group `profiles` (uid as doc id).
// 2) Uses their companyId/storeId to query that store's `orders` by userId.
// Pure reads, no mutations.
import { admin } from "../admin";

const USER_ID = process.argv[2] || "HGa5howSQ6bSgeTuN9x368P8M6d2";

async function main() {
	const db = admin.firestore();

	// Profiles use the auth uid as their doc id. Use a collection-group lookup
	// by document id (this uses the auto __name__ index, no custom index needed).
	const profileSnap = await db.collectionGroup("profiles").get();
	const matches = profileSnap.docs.filter((d) => d.id === USER_ID);

	console.log(`Found ${matches.length} profile doc(s) for uid=${USER_ID}\n`);
	for (const doc of matches) {
		const p: any = doc.data();
		console.log("PROFILE PATH:", doc.ref.path);
		console.log({
			id: p.id,
			displayName: p.displayName,
			email: p.email,
			clientType: p.clientType,
			companyName: p.companyName,
			companyId: p.companyId,
			storeId: p.storeId,
			paymentType: p.paymentType,
			organizationId: p.organizationId,
			isAnonymous: p.isAnonymous,
			createdDate: p.createdDate ? new Date(p.createdDate).toISOString() : null,
		});
	}

	console.log("\n=== ORDERS ===\n");
	for (const profileDoc of matches) {
		const p: any = profileDoc.data();
		if (!p.companyId || !p.storeId) {
			console.log(`Skip profile ${profileDoc.ref.path} — missing companyId/storeId`);
			continue;
		}
		const ordersSnap = await db
			.collection(`${p.companyId}/${p.storeId}/orders`)
			.where("userId", "==", USER_ID)
			.get();

		console.log(`Store ${p.companyId}/${p.storeId}: ${ordersSnap.size} order(s)`);
		const rows = ordersSnap.docs.map((d) => {
			const o: any = d.data();
			return {
				path: d.ref.path,
				id: o.id,
				status: o.status,
				paymentStatus: o.paymentStatus,
				paymentType: o.paymentType,
				cartTotal: o.cart?.cartTotal,
				cartId: o.cart?.id,
				date: o.date ? new Date(o.date).toISOString() : null,
				nameOnInvoice: o.nameOnInvoice,
				createdBy: o.createdBy,
				ezDeliveryNote: !!(o as any).ezDeliveryNote,
				ezInvoice: !!(o as any).ezInvoice,
			};
		});
		rows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
		console.log(JSON.stringify(rows, null, 2));
	}

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
