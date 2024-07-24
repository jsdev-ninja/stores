import { useEffect } from "react";

import "./App.scss";

import { useTranslation } from "react-i18next";

import { Route } from "src/navigation";
import { ModalProvider } from "src/infra/modals";
import { AdminPage } from "src/pages";
import { StoreLayout } from "src/pages/store/StoreLayout";
import { CategoryService } from "src/domains/Category";
import { useAppSelector, useFullID, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { TProduct } from "src/domains";
import { AlgoliaService } from "src/services";
import { useAppInit } from "./init";

AlgoliaService.init();

function App() {
	const { i18n } = useTranslation();
	const dir = i18n.dir();
	const fullID = useFullID();

	const actions = useStoreActions();

	const appReady = useAppSelector((state) => state.ui.appReady);

	useAppInit();

	useEffect(() => {
		document.body.dir = dir;
	}, [dir]);

	useEffect(() => {
		if (!fullID) return;

		// todo: fix
		const unsubscribe = FirebaseApi.firestore.subscribeDoc(
			"cart",
			fullID,
			(cart: { items: Array<TProduct> }) => {
				actions.dispatch(actions.cart.setCart(cart.items ?? []));
			}
		);

		return () => unsubscribe();
	}, [fullID, actions]);

	useEffect(() => {
		if (!appReady) return;
		FirebaseApi.auth.onUser((user) => {
			console.log("FirebaseApi.auth", FirebaseApi.auth.auth.tenantId);

			console.log("user", user, user?.isAnonymous);

			if (!user) {
				console.log("not login");
				FirebaseApi.auth.signInAnonymously();
				return;
			}

			actions.dispatch(actions.user.setUser(user));
		});

		CategoryService.list().then((result) => {
			actions.dispatch(actions.category.setCategories(result));
		});

		return () => {};
	}, [actions, appReady]);

	// get company details

	// get store details
	// get storeCategories
	// payment -> heshbonit vs kabala
	// order from history

	if (!appReady) {
		return "loading..";
	}

	return (
		<>
			<ModalProvider />
			<Route name="store">
				<StoreLayout />
			</Route>
			<Route name="admin">
				<AdminPage />
			</Route>
		</>
	);
}

export default App;
