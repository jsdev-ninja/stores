import { input, select } from "@inquirer/prompts";
import { admin } from "./admin";
import { CompanySchema, FirebaseAPI, TCompany, TStore } from "@jsdev_ninja/core";

async function main() {
	const action = await select({
		message: "selection action",
		choices: [
			{ value: "createSuperAdmin", name: "create super admin" },
			{ value: "createAdmin", name: "create admin" },
			{ value: "createCompany", name: "create company" },
			{ value: "createStore", name: "create store" },
		],
	});

	if (action === "createAdmin") {
		const storesRes = await admin
			.firestore()
			.collection(FirebaseAPI.firestore.systemCollections.stores)
			.get();

		const stores: TStore[] = [];
		storesRes.forEach((doc) => {
			if (doc.exists) {
				stores.push(doc.data() as TStore);
			}
		});

		const selectedStore = await select({
			message: "selection store",
			choices: stores.map((s) => ({ name: s.name, value: s })),
		});
		console.log("selectedStore", selectedStore);

		const email = await input({ message: "enter email" });
		const password = await input({ message: "enter password" });
		const name = await input({ message: "enter name" });

		const auth = admin.auth().tenantManager().authForTenant(selectedStore.tenantId);
		const userRecord = await auth.createUser({
			displayName: name,
			email,
			password,
			emailVerified: true,
		});

		const token = {
			admin: true,
			tenantId: selectedStore.tenantId,
			storeId: selectedStore.id,
			companyId: selectedStore.companyId,
		};
		await auth.setCustomUserClaims(userRecord.uid, token);
		const userRecord2 = await auth.getUser(userRecord.uid);

		// Access custom claims
		const customClaims = userRecord2.customClaims;
		console.log("customClaims", customClaims);
	}

	if (action === "createSuperAdmin") {
		// The super-admin is a PROJECT-LEVEL user — NOT tenant-scoped. The
		// super-admin console signs in at the project level (no tenant), and the
		// `superAdmin` claim grants god-mode read across every store/company.
		// Every backend callable re-verifies the claim server-side, so this grant
		// is the single bootstrap that makes the console usable (architecture A1).
		// Use admin.auth() directly (NOT tenantManager) so the user lives at the
		// project level, matching how the console authenticates.
		const auth = admin.auth();

		const mode = await select({
			message: "grant superAdmin to an existing user, or create a new one?",
			choices: [
				{ value: "existing", name: "grant superAdmin to an existing user (by email)" },
				{ value: "new", name: "create a new super-admin user (email + password)" },
			],
		});

		let uid: string;
		if (mode === "new") {
			const email = await input({ message: "enter email" });
			const password = await input({ message: "enter password" });
			const name = await input({ message: "enter name" });
			const userRecord = await auth.createUser({
				displayName: name,
				email,
				password,
				emailVerified: true,
			});
			uid = userRecord.uid;
		} else {
			const email = await input({ message: "enter existing user email" });
			const userRecord = await auth.getUserByEmail(email);
			uid = userRecord.uid;
		}

		// Preserve any existing claims; only add superAdmin:true so we never clobber
		// an existing admin/storeId/companyId grant.
		const existingClaims = (await auth.getUser(uid)).customClaims ?? {};
		console.log("uid", uid);
		console.log("existing claims", existingClaims);

		const confirm = await select({
			message: `set superAdmin:true on ${uid}? this grants god-mode across ALL stores.`,
			choices: [
				{ value: "no", name: "no — cancel, change nothing" },
				{ value: "yes", name: "yes — grant superAdmin" },
			],
		});
		if (confirm !== "yes") {
			console.log("cancelled — no claims changed");
			return;
		}

		await auth.setCustomUserClaims(uid, { ...existingClaims, superAdmin: true });
		const updated = (await auth.getUser(uid)).customClaims;
		console.log("updated claims", updated);
		console.log(
			"done — the user must sign out and back in (or force-refresh the ID token) to pick up the claim.",
		);
	}

	if (action === "createStore") {
		const store: TStore = {
			id: "",
			companyId: "",
			name: "",
			logoUrl: "",
			tenantId: "",
			urls: [],
		};

		const id = await input({ message: "enter store id" });
		const name = await input({ message: "enter store name" });
		const companyId = await input({ message: "enter  store  companyId" });
		const tenantId = await input({ message: "enter store tenantId" });
		const url = await input({ message: "enter store url" });
		const email = await input({ message: "enter store email" });

		store.id = id;
		store.name = name;
		store.companyId = companyId;
		store.tenantId = tenantId;
		store.urls.push(url);

		await admin
			.firestore()
			.collection(FirebaseAPI.firestore.systemCollections.stores)
			.doc(id)
			.set(store);
		await admin
			.firestore()
			.collection(FirebaseAPI.firestore.systemCollections.stores)
			.doc(id)
			.collection("private")
			.doc("data")
			.set({
				hypData: {
					isJ5: "True",
					KEY: "81057eb786ffc379de89d860031e8fea0e4d28f2",
					masof: "0010302921",
					password: "hyp1234",
				},
				storeEmail: email,
			});

		console.log("store", store);
	}

	if (action === "createCompany") {
		const company: TCompany = {
			id: "",
			name: "",
			websiteDomains: [],
		};

		const id = await input({ message: "enter company id" });
		const name = await input({ message: "enter company name" });
		const ownerName = await input({ message: "enter  owner name" });
		const ownerEmil = await input({ message: "enter owner email" });

		company.id = id;
		company.name = name;

		const validation = CompanySchema.safeParse(company);

		if (!validation.success) return;

		await admin
			.firestore()
			.collection(FirebaseAPI.firestore.systemCollections.companies)
			.doc(id)
			.set(company);
		await admin
			.firestore()
			.collection(FirebaseAPI.firestore.systemCollections.companies)
			.doc(id)
			.collection("private")
			.doc("data")
			.set({
				emails: { mainEmail: ownerEmil },
				name: ownerName,
			});

		console.log("company", company);
	}
}

main();
