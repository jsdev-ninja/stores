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
import { useAppSelector, useStoreActions } from "src/infra";
import FavoritesProductsPage from "./FavoritesProductsPage/FavoritesProductsPage";
import HomePage from "./HomePage/HomePage";
import { ordersSlice } from "src/domains/Order";
import TermsPage from "./TermsPage/TermsPage";
import DiscountsPage from "./DiscountsPage/DiscountsPage";
import ClientOrderPage from "./ClientOrderPage";
import { UnPaidPendingOrder } from "src/widgets/UnPaidPendingOrder/UnPaidPendingOrder";

export default function StoreLayout() {
	const appApi = useAppApi();

	const user = useUser();

	const actions = useStoreActions();

	const unPaidPendingOrder = useAppSelector(ordersSlice.selectors.selectUnPaidPendingOrder);
	console.log("unPaidPendingOrder", unPaidPendingOrder);

	useEffect(() => {
		const unsubscribe = appApi.user.subscriptions.favoriteProductsSubscribe(
			(favoriteProducts) => {
				actions.dispatch(actions.favoriteProducts.setFavoriteProducts(favoriteProducts));
			}
		);
		return () => unsubscribe?.();
	}, [user]);

	if (unPaidPendingOrder && user?.uid === unPaidPendingOrder.userId) {
		return (
			<>
				<AppBar />
				<UnPaidPendingOrder />
			</>
		);
	}

	return (
		<div className="flex flex-col">
			<AppBar />
			<main className="page-with-header flex flex-col">
				<Route name="store" index>
					<HomePage />
				</Route>
				<Route name="store.terms">
					<TermsPage />
				</Route>
				<Route name="store.catalog">
					<CatalogPage />
				</Route>
				<Route name="store.discounts">
					<DiscountsPage />
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
				<Route name="store.orderPage">
					<ClientOrderPage />
				</Route>

				<Route name="store.orderSuccess">
					<OrderSuccessPage />
				</Route>

				<Route name="store.profile">
					<ProfilePage />
				</Route>
				<Route name="store.favoritesProducts">
					<FavoritesProductsPage />
				</Route>
			</main>
		</div>
	);
}
