import { Route } from "src/navigation";
import { AppBar } from "src/widgets/AppBar";

import { CartPage, CatalogPage, ProductPage } from "..";
import { StorePage } from "./StorePage";

export function HomePage() {
	return (
		<div className="flex flex-col">
			<AppBar />
			<main className="page-with-header flex flex-col">
				<Route name="store.home">
					<StorePage />
				</Route>
				<Route name="store.category">
					<CatalogPage />
				</Route>

				<Route name="store.cart">
					<CartPage />
				</Route>
				<Route name="store.product">
					<ProductPage />
				</Route>
			</main>
		</div>
	);
}
