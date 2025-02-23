import { input, select } from "@inquirer/prompts";
import { admin } from "./admin";
import { CompanySchema, FirebaseAPI, TCompany, TStore } from "@jsdev_ninja/core";

async function main() {
	const action = await select({
		message: "selection action",
		choices: [
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
		};
		await auth.setCustomUserClaims(userRecord.uid, token);
		console.log("SUCCESS");
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
