import { admin } from "./utils/app";
// Get the TenantAwareAuth instance for the specific tenant

const testerTenantId = "tester-tenant-2vcku";
const davidTenantId = "opal-market-tenant-ia9ux";

const tenantId = davidTenantId;
const tenantAuth = admin.auth().tenantManager().authForTenant(tenantId);

async function deleteAllUsers(nextPageToken: any) {
	// List users with a specified page token, if available
	const listUsersResult = await tenantAuth.listUsers(1000);
	const uids = listUsersResult.users.map((user: any) => user.uid);

	// Delete users in the current batch
	await tenantAuth.deleteUsers(uids);
	console.log(`Deleted ${uids.length} users`);

	// If there are more users to delete, continue with the next page
	if (listUsersResult.pageToken) {
		await deleteAllUsers(listUsersResult.pageToken);
	}
}

// Start the deletion process
// deleteAllUsers("").catch((error) => {
// 	console.error("Error deleting users:", error);
// });
