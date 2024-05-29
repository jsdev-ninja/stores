import { Route } from "src/navigation";
import { AppBar } from "src/widgets/AppBar";

import { CartPage, CatalogPage } from "..";
import { Home } from "./Home";

export function HomePage() {
	return (
		<div className="flex flex-col">
			<AppBar />

			<main className="page-with-header flex flex-col overflow-hidden">
			<Route name="store.home">
					<Home />
				</Route>
				<Route name="store.catalog">
					<CatalogPage />
				</Route>
				<Route name="store.cart">
					<CartPage />
				</Route>
			</main>
		</div>
	);
}
