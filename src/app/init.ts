import { TCompany } from "src/domains/Company";
import { TStore } from "src/domains/Store";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";

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

	actions.dispatch(actions.company.setCompany(data.company));
	actions.dispatch(actions.store.setStore(data.store));
	actions.dispatch(actions.ui.setAppReady(true));
}
