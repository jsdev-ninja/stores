import { admin } from "./utils/app";

const storeId = "tester-store"; // "opal-market-store"
const testerTenantId = "tester-tenant-2vcku";
const tenantId = testerTenantId ?? "opal-market-tenant-ia9ux";

const user = {
	email: "david@example.com",
	emailVerified: true,
	password: "123123",
	displayName: "david",
	disabled: false,
};

// getClaims("z6TC8WEYpRN7GU7NmN7ezaBDbqo1");
async function getClaims(id: any) {
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
		tenantId: store?.tenantId,
		storeId: storeRef.id,
		companyId: store.companyId
	};
	console.log("store", store);

	const auth = admin.auth().tenantManager().authForTenant(store?.tenantId);
	const userRecord = await auth.createUser(user);
	await auth.setCustomUserClaims(userRecord.uid, token);
	const userRecord2 = await auth.getUser(userRecord.uid);

	// Access custom claims
	const customClaims = userRecord2.customClaims;
	console.log("customClaims", customClaims);
	console.log("getClaims", await getClaims(userRecord.uid));
}

// Set a user as admin
createAdmin();
