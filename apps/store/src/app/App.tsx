import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Route, useLocation } from "src/navigation";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { useAppInit } from "./init";
import { mixPanelApi } from "src/lib/mixpanel";
import { ProtectedRoute } from "src/features/auth";
import { TCart } from "src/domains/cart";
import { useStore } from "src/domains/Store";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { ModalProvider } from "src/widgets";
import { useProfile } from "src/domains/profile";
import { NextUIProvider } from "@nextui-org/react";
import { useAppApi } from "src/appApi";

const SuperAdminLayout = lazy(() => import("src/pages/superAdmin"));
const StoreLayout = lazy(() => import("src/pages/store/StoreLayout"));
const AdminLayout = lazy(() => import("src/pages/admin/AdminLayout/AdminLayout"));

function App() {
	const { i18n } = useTranslation();
	const dir = i18n.dir();

	const actions = useStoreActions();

	const profile = useProfile();

	const [location] = useLocation();

	const appApi = useAppApi();

	const store = useStore();
	const user = useAppSelector((state) => state.user.user);

	const appReady = useAppSelector((state) => state.ui.appReady);

	const storeId = store?.id ?? "";
	const companyId = store?.companyId ?? "";

	useAppInit();

	useEffect(() => {
		if (!location.pathname || !store) return;
		mixPanelApi.pageView({
			pathname: location.pathname,
			pageType: location.pathname.startsWith("/admin") ? "admin" : "store", //store | admin
			storeId: store.id,
			companyId: store.companyId,
			tenantId: store.tenantId,
			profile: profile ?? undefined,
		});
	}, [location.pathname, store, profile]);

	useEffect(() => {
		document.body.dir = dir;
	}, [dir]);

	useEffect(() => {
		if (user && store) {
			mixPanelApi.identify(user, { store, profile });
		}
	}, [user, profile, store]);

	useEffect(() => {
		if (user?.uid && !user.isAnonymous) {
			const unsubscribe = appApi.user.subscriptions.profileSubscribe();
			return unsubscribe;
		}
		if (user?.isAnonymous) {
			actions.dispatch(actions.profile.setProfile(null));
		}
	}, [user, actions]);

	useEffect(() => {
		// subscribe to orders
		if (!user || !storeId) return;

		const unsubscribe = FirebaseApi.firestore.subscribeList<TOrder>({
			collection: FirebaseAPI.firestore.getPath({
				collectionName: "orders",
				companyId,
				storeId,
			}),
			where: [
				{ name: "storeId", value: storeId, operator: "==" },
				{ name: "userId", operator: "==", value: user.uid },
			],
			callback: (orders) => {
				actions.dispatch(actions.dispatch(actions.orders.setOrders(orders ?? [])));
			},
		});

		return () => unsubscribe();
	}, [user, actions, companyId, storeId]);

	useEffect(() => {
		if (!user || !store) return;

		const unsubscribe = FirebaseApi.firestore.subscribeDocV2<TCart>({
			collection: FirebaseAPI.firestore.getPath({
				collectionName: "cart",
				companyId,
				storeId,
			}),
			where: [
				{ name: "storeId", value: store.id, operator: "==" },
				{ name: "userId", operator: "==", value: user.uid },
				{ name: "status", operator: "==", value: "active" },
			],
			callback: (cart) => {
				actions.dispatch(actions.cart.setCart(cart ?? null));
			},
		});

		return () => unsubscribe();
	}, [store, user, actions]);

	useEffect(() => {
		if (!appReady) return;
		if (!store?.id) return;

		FirebaseApi.auth.onUser((user) => {
			if (!user) {
				FirebaseApi.auth.signInAnonymously();
				return;
			}

			actions.dispatch(actions.user.setUser(user));
		});

		appApi.system.getStoreCategories().then((result) => {
			actions.dispatch(actions.category.setCategories(result?.data?.categories ?? []));
		});

		return () => {};
	}, [actions, appReady, store?.id, user?.uid]);

	if (!appReady || !user) {
		return (
			<div className="w-screen h-screen flex justify-center items-center">
				<svg
					aria-hidden="true"
					className="w-20 h-20 text-gray-200 animate-spin dark:text-gray-600 fill-red-600"
					viewBox="0 0 100 101"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
						fill="currentColor"
					/>
					<path
						d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
						fill="currentFill"
					/>
				</svg>
			</div>
		);
	}

	return (
		<NextUIProvider>
			{/* todo fix fallback */}
			<Suspense fallback="loading">
				<ModalProvider />
				<Route name="store">
					<StoreLayout />
				</Route>
				<Route name="admin">
					<ProtectedRoute
						access={{
							admin: true,
						}}
					>
						<AdminLayout />
					</ProtectedRoute>
				</Route>
				<Route name="superAdmin">
					<ProtectedRoute access={{ superAdmin: true }}>
						<SuperAdminLayout />
					</ProtectedRoute>
				</Route>
			</Suspense>
		</NextUIProvider>
	);
}

export default App;
