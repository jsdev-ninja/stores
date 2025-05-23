import { TCompany } from "src/domains/Company";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import DefaultLogoSrc from "../assets/default_logo.png";
import { FirebaseAPI, TStore } from "@jsdev_ninja/core";

export async function useAppInit() {
	const actions = useStoreActions();
	const appReady = useAppSelector((state) => state.ui.appReady);

	if (appReady) return;

	const companyRequest = FirebaseApi.firestore.listV2<TCompany>({
		collection: FirebaseAPI.firestore.systemCollections.companies,
		where: [
			{ name: "websiteDomains", operator: "array-contains", value: window.location.origin },
		],
	});
	const storeRequest = FirebaseApi.firestore.listV2<TStore>({
		collection: FirebaseAPI.firestore.systemCollections.stores,
		where: [{ name: "urls", operator: "array-contains", value: window.location.origin }],
	});

	const [companyResponse, storeResponse] = await Promise.all([companyRequest, storeRequest]);

	const company = companyResponse?.data?.[0];
	const store = storeResponse?.data?.[0];

	FirebaseApi.api.uiLogs({
		message: "App init",
		severity: "INFO",
		company,
		store,
		companyId: company?.id,
		storeId: store?.id,
		tenantId: store?.tenantId,
		url: window.location.href,
	});

	if (!company || !store) {
		actions.dispatch(actions.ui.setAppReady(true));

		FirebaseApi.api.uiLogs({
			message: "App init error",
			severity: "ERROR",
			company,
			store,
			companyId: company?.id,
			storeId: store?.id,
			tenantId: store?.tenantId,
			url: window.location.href,
		});
		return;
	}

	if (company && store) {
		const link: any =
			document.querySelector("link[rel*='icon']") || document.createElement("link");
		link.type = "image/x-icon";
		link.rel = "shortcut icon";
		link.href = store.logoUrl ?? DefaultLogoSrc;
		document.getElementsByTagName("head")[0].appendChild(link);
		document.title = company.name;

		// apply store theme
	}

	!!store && FirebaseApi.auth.setTenantId(store.tenantId);
	!!company && actions.dispatch(actions.company.setCompany(company));
	!!store && actions.dispatch(actions.store.setStore(store));
	actions.dispatch(actions.ui.setAppReady(true));
}
