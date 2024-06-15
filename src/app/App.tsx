import { useEffect } from "react";

import "./App.scss";

import { useTranslation } from "react-i18next";

import { Route } from "src/navigation";
import { ModalProvider } from "src/infra/modals";
import { AdminPage } from "src/pages";
import { HomePage } from "src/pages/store/HomePage";
import { CategoryService } from "src/domains/Category";
import { useStoreActions } from "src/infra";
import { AlgoliaService } from "src/services";
import { FirebaseApi } from "src/lib/firebase";

function App() {
	const { i18n } = useTranslation();
	const dir = i18n.dir();

	useEffect(() => {
		AlgoliaService.getProducts();
	}, []);

	const actions = useStoreActions();
	useEffect(() => {
		document.body.dir = dir;
	}, [dir]);

	useEffect(() => {
		FirebaseApi.auth.onUser((user) => {
			console.log("user", user);
			actions.dispatch(actions.user.setUser(user));
		});
		CategoryService.list().then((result) => {
			if (result.success) {
				actions.dispatch(actions.category.setCategories(result.data));
			}
		});
	}, [actions]);

	// get company details

	// get store details
	// get storeCategories
	// payment -> heshbonit vs kabala
	// order from history

	return (
		<>
			<ModalProvider />
			<Route name="store">
				<HomePage />
			</Route>
			<Route name="admin">
				<AdminPage />
			</Route>
		</>
	);
}

export default App;
