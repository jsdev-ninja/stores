import { Route } from "src/navigation";
import { AppBar } from "src/widgets/AppBar";

import { CatalogPage, ProductPage } from "..";

import CheckoutPage from "./CheckoutPage/CheckoutPage";
import ProfilePage from "./ProfilePage/ProfilePage";
import { ProductsWidget } from "src/widgets/Products";
import { OrderSuccessPage } from "./OrderSuccessPage/OrderSuccessPage";
import UserOrdersPage from "./UserOrdersPage";
import CartPage from "./CartPage/CartPage";

export function StoreLayout() {
	return (
		<ProductsWidget>
			<div className="flex flex-col">
				<AppBar />
				<main className="page-with-header flex flex-col">
					<Route name="store" index>
						<CatalogPage />
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

					<Route name="store.orders">
						<UserOrdersPage />
					</Route>

					<Route name="store.orderSuccess">
						<OrderSuccessPage />
					</Route>

					<Route name="store.profile">
						<ProfilePage />
					</Route>
				</main>
			</div>
		</ProductsWidget>
	);
}
