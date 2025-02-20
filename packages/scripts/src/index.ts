import { input, select } from "@inquirer/prompts";
import { admin } from "./admin";
import { TCompany, TStore } from "@jsdev_ninja/core";

const stores = {
	tester: {
		company: "tester",
		store: "tester-store",
		tenantId: "tester-tenant-2vcku",
	},
	balasi: {
		company: "balasistore_company",
		store: "balasistore_store",
		tenantId: "balasistore-tenant-p1lml",
	},
} as const;
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

	if (action === "createStore") {
		const store: TStore = {
			id: "",
			companyId: "",
			hypData: {
				isJ5: "True",
				KEY: "81057eb786ffc379de89d860031e8fea0e4d28f2",
				masof: "0010302921",
				password: "hyp1234",
			},
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

		store.id = id;
		store.name = name;
		store.companyId = companyId;
		store.tenantId = tenantId;
		store.urls.push(url);

		await admin.firestore().collection("stores").doc(id).set(store);

		console.log("store", store);
	}

	if (action === "createCompany") {
		const company: TCompany = {
			id: "",
			name: "",
			websiteDomains: [],
			owner: {
				emails: { mainEmail: "" },
				name: "",
			},
		};

		const id = await input({ message: "enter company id" });
		const name = await input({ message: "enter company name" });
		const ownerName = await input({ message: "enter  owner name" });
		const ownerEmil = await input({ message: "enter owner email" });

		company.id = id;
		company.name = name;
		company.owner.name = ownerName;
		company.owner.emails.mainEmail = ownerEmil;

		await admin.firestore().collection("companies").doc(id).set(company);

		console.log("company", company);
	}
}

main();
