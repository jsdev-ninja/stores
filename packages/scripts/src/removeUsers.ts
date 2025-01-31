import { admin } from "./utils/app";

// Tenant ID
const TENANT_ID = "tester-tenant-2vcku";

// Function to delete all users in a tenant
async function deleteAllUsersInTenant() {
	try {
		const tenantAuth = admin.auth().tenantManager().authForTenant(TENANT_ID);
		let nextPageToken = undefined;

		do {
			// List users in batches of 1000
			const listUsersResult = await tenantAuth.listUsers(1000, nextPageToken);
			const uids = listUsersResult.users.map((user) => user.uid);

			if (uids.length > 0) {
				await tenantAuth.deleteUsers(uids);
				console.log(`Deleted ${uids.length} users.`);
			}

			nextPageToken = listUsersResult.pageToken;
		} while (nextPageToken);

		console.log("All users deleted successfully.");
	} catch (error) {
		console.error("Error deleting users:", error);
	}
}

// Run the function
deleteAllUsersInTenant();
