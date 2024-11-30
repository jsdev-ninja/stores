import { admin } from "../utils/app.js";

const storeId = "opal-market-store";
const tenantId = "opal-market-tenant-ia9ux";

const user = {
	email: "testet@example.com",
	emailVerified: true,
	password: "123123!",
	displayName: "David",
	disabled: false,
};

// getClaims("z6TC8WEYpRN7GU7NmN7ezaBDbqo1");
async function getClaims(id) {
	const auth = admin.auth().tenantManager().authForTenant(tenantId);

	const userRecord2 = await auth.getUser(id);

	// Access custom claims
	const customClaims = userRecord2.customClaims;
	console.log("customClaims", customClaims);
}

async function createAdmin() {
	const storeRef = await admin.firestore().collection("stores").doc(storeId).get();
	const store = storeRef.data();
	const token = {
		admin: true,
		tenantId: store.tenantId,
		storeId: storeRef.id,
	};
	console.log("store", store);

	const auth = admin.auth().tenantManager().authForTenant(store.tenantId);
	const userRecord = await auth.createUser(user);
	await auth.setCustomUserClaims(userRecord.uid, token);
	const userRecord2 = await auth.getUser(userRecord.uid);

	// Access custom claims
	const customClaims = userRecord2.customClaims;
	console.log("customClaims", customClaims);
}

// Set a user as admin
createAdmin();
