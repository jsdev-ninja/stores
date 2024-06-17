import { Route } from "src/navigation";
import { AppBar } from "src/widgets/AppBar";

import { CartPage, CatalogPage, ProductPage } from "..";
import { StorePage } from "./StorePage";

import CheckoutPage from "./CheckoutPage/CheckoutPage";
export function StoreLayout() {
	return (
		<div className="flex flex-col">
			<AppBar />
			<main className="page-with-header flex flex-col">
				<Route name="store" index>
					<StorePage />
				</Route>
				<Route name="store.category">
					<CatalogPage />
				</Route>

				<Route name="store.product">
					<ProductPage />
				</Route>

				<Route name="store.cart">
					<CartPage />
				</Route>

				<Route name="store.checkout">
					<CheckoutPage />
				</Route>
			</main>
		</div>
	);
}
