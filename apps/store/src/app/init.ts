import { TCompany } from "src/domains/Company";
import { TStore } from "src/domains/Store";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import DefaultLogoSrc from "../assets/default_logo.png";

type Data = {
	company: TCompany;
	store: TStore;
};

export async function useAppInit() {
	const actions = useStoreActions();
	const appReady = useAppSelector((state) => state.ui.appReady);

	if (appReady) return;

	const companyRequest = FirebaseApi.firestore.listV2<TCompany>({
		collection: "companies",
		where: [
			{ name: "websiteDomains", operator: "array-contains", value: window.location.origin },
		],
	});
	const storeRequest = FirebaseApi.firestore.listV2<TStore>({
		collection: "stores",
		where: [{ name: "urls", operator: "array-contains", value: window.location.origin }],
	});

	const [companyResponse, storeResponse] = await Promise.all([companyRequest, storeRequest]);

	const company = companyResponse?.data?.[0];
	const store = storeResponse?.data?.[0];

	if (!company || !store) {
		// todo
	}

	if (company && store) {
		// Function to change the favicon

		const link: any =
			document.querySelector("link[rel*='icon']") || document.createElement("link");
		link.type = "image/x-icon";
		link.rel = "shortcut icon";
		link.href = store.logoUrl ?? DefaultLogoSrc;
		document.getElementsByTagName("head")[0].appendChild(link);
		document.title = company.name;
	}

	!!store && FirebaseApi.auth.setTenantId(store.tenantId);
	!!company && actions.dispatch(actions.company.setCompany(company));
	!!store && actions.dispatch(actions.store.setStore(store));
	actions.dispatch(actions.ui.setAppReady(true));
}
