import { Route } from "src/navigation";
import { AppBar } from "src/widgets/AppBar";

import { CatalogPage, ProductPage } from "..";

import CheckoutPage from "./CheckoutPage/CheckoutPage";
import ProfilePage from "./ProfilePage/ProfilePage";
import { OrderSuccessPage } from "./OrderSuccessPage/OrderSuccessPage";
import { OrderErrorPage } from "./OrderErrorPage/OrderErrorPage";
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
import { ProductsWidget } from "src/widgets/Products";
import { ChatbotFeature } from "src/features/chatbot";
// import { UnPaidPendingOrder } from "src/widgets/UnPaidPendingOrder/UnPaidPendingOrder";
import { useProfile } from "src/domains/profile";

export default function StoreLayout() {
	const appApi = useAppApi();

	const user = useUser();
	const profile = useProfile();
	const actions = useStoreActions();

	const unPaidPendingOrder = useAppSelector(ordersSlice.selectors.selectUnPaidPendingOrder);

	useEffect(() => {
		// load profile organizations
		if (user?.uid) {
			appApi.user.getProfileOrganization().then((res) => {
				if (res?.success && Array.isArray(res.data)) {
					const orgs = res.data;
					actions.dispatch(actions.userOrganization.setOrganizations(orgs));
					if (orgs.length === 1) {
						actions.dispatch(actions.userOrganization.setActiveOrganization(orgs[0]));
					}
				}
			});
		}
	}, [profile?.id]);

	useEffect(() => {
		const unsubscribe = appApi.user.subscriptions.favoriteProductsSubscribe(
			(favoriteProducts) => {
				actions.dispatch(actions.favoriteProducts.setFavoriteProducts(favoriteProducts));
			}
		);
		return () => unsubscribe?.();
	}, [user]);

	if (unPaidPendingOrder && user?.uid === unPaidPendingOrder.userId) {
		// todo dont show when no needed
		// return (
		// 	<>
		// 		<AppBar />
		// 		<UnPaidPendingOrder />
		// 	</>
		// );
	}

	return (
		<ProductsWidget>
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

					<Route name="store.orderError">
						<OrderErrorPage />
					</Route>

					<Route name="store.profile">
						<ProfilePage />
					</Route>
					<Route name="store.favoritesProducts">
						<FavoritesProductsPage />
					</Route>
				</main>
				<ChatbotFeature />
			</div>
		</ProductsWidget>
	);
}
