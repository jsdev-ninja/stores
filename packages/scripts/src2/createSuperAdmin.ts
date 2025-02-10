import { admin } from "./utils/app";

const storeId = "tester-store"; // "opal-market-store"
const testerTenantId = "tester-tenant-2vcku";
const tenantId = testerTenantId ?? "opal-market-tenant-ia9ux";

const user = {
	email: "philipbrodovsky@gmail.com",
	emailVerified: true,
	password: "Master324!",
	displayName: "david",
	disabled: false,
};

// getClaims("z6TC8WEYpRN7GU7NmN7ezaBDbqo1");
async function getClaims(id: any) {
	const auth = admin.auth();

	const userRecord2 = await auth.getUser(id);

	// Access custom claims
	const customClaims = userRecord2.customClaims;
	console.log("customClaims", customClaims);
}

async function createSuperAdmin() {
	const token = {
		superAdmin: true,
	};

	const auth = admin.auth();
	const userRecord = await auth.createUser(user);
	await auth.setCustomUserClaims(userRecord.uid, token);
	const userRecord2 = await auth.getUser(userRecord.uid);

	// Access custom claims
	const customClaims = userRecord2.customClaims;
	console.log("customClaims", customClaims);
	console.log("getClaims", await getClaims(userRecord.uid));
}

// Set a user as admin
createSuperAdmin();
