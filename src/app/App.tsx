import { useEffect } from "react";

import "./App.scss";

import { useTranslation } from "react-i18next";

import { Route } from "src/navigation";
import { ModalProvider } from "src/infra/modals";
import { AdminPage } from "src/pages";
import { HomePage } from "src/pages/store/HomePage";

function App() {
	const { i18n } = useTranslation();
	const dir = i18n.dir();
	useEffect(() => {
		document.body.dir = dir;
	}, [dir]);

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
