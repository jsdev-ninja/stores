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

	const response = await FirebaseApi.api.init();

	const data = response.data as Data;

	if (data.company && data.store) {
		// Function to change the favicon

		const link: any =
			document.querySelector("link[rel*='icon']") || document.createElement("link");
		link.type = "image/x-icon";
		link.rel = "shortcut icon";
		link.href = data.store.logoUrl ?? DefaultLogoSrc;
		document.getElementsByTagName("head")[0].appendChild(link);
		document.title = data.company.name;
	}

	FirebaseApi.auth.setTenantId(data.store.tenantId);
	actions.dispatch(actions.company.setCompany(data.company));
	actions.dispatch(actions.store.setStore(data.store));
	actions.dispatch(actions.ui.setAppReady(true));
}
