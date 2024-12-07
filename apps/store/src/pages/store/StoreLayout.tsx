import { Route } from "src/navigation";
import { AppBar } from "src/widgets/AppBar";

import { CatalogPage, ProductPage } from "..";

import CheckoutPage from "./CheckoutPage/CheckoutPage";
import ProfilePage from "./ProfilePage/ProfilePage";
import { OrderSuccessPage } from "./OrderSuccessPage/OrderSuccessPage";
import UserOrdersPage from "./UserOrdersPage";
import CartPage from "./CartPage/CartPage";
import { useEffect } from "react";
import { useAppApi } from "src/appApi";
import { useUser } from "src/domains/user";
import { useStoreActions } from "src/infra";

export function StoreLayout() {
	const appApi = useAppApi();

	const user = useUser();

	const actions = useStoreActions();

	useEffect(() => {
		const unsubscribe = appApi.user.subscriptions.favoriteProductsSubscribe(
			(favoriteProducts) => {
				actions.dispatch(actions.favoriteProducts.setFavoriteProducts(favoriteProducts));
			}
		);
		return () => unsubscribe?.();
	}, [user]);

	return (
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
	);
}
