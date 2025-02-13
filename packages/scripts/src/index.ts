import { input, select } from "@inquirer/prompts";
import { admin } from "./admin";

const auth = admin.auth();

const stores = {
	tester: {
		company: "tester",
		store: "tester-store",
		tenantId: "tester-tenant-2vcku",
	},
} as const;
async function main() {
	const action = await select({
		message: "selection action",
		choices: [{ value: "createAdmin", name: "create admin" }],
	});

	if (action === "createAdmin") {
		const selectedStoreName = await select({
			message: "selection store",
			choices: Object.keys(stores).map((s) => ({ name: s, value: s })),
		});
		console.log("selectedStoreName", selectedStoreName);
		const email = await input({ message: "enter email" });
		const password = await input({ message: "enter password" });
		const name = await input({ message: "enter name" });

		const store = stores[selectedStoreName as keyof typeof stores];
		const auth = admin.auth().tenantManager().authForTenant(store.tenantId);
		const userRecord = await auth.createUser({
			displayName: name,
			email,
			password,
			emailVerified: true,
		});

		const token = {
			admin: true,
			tenantId: store.tenantId,
			storeId: store.store,
		};
		await auth.setCustomUserClaims(userRecord.uid, token);
		console.log("SUCCESS", action, selectedStoreName, email, password, name);
	}
}

main();
