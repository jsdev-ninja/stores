import { useMemo, useState } from "react";
import { TCategory } from "src/domains/Category";
import { useCompany } from "src/domains/Company";
import { OrderApi, TOrder } from "src/domains/Order";
import { useStore } from "src/domains/Store";
import { productDelete } from "src/features/admin/productDelete";
import { uploadLogo } from "src/features/admin/uploadLogo";
import { signup } from "src/features/auth/signup";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { mixPanelApi } from "src/lib/mixpanel";
import { SentryApi } from "src/lib/sentry";
import { SubNestedKeys } from "src/shared/types";
import { TProfile, TNewCompany, TStoreStats } from "src/types";
import { calculateCartPrice } from "src/utils/calculateCartPrice";
import { productCreate } from "./admin";
import { ProductSchema, TNewProduct, TProduct } from "@jsdev_ninja/core";
import { TCart } from "src/domains/cart";
import { CartService } from "src/domains/cart/CartService";

// should be ready before use
// store
// firebase

// todo move to folder
function productInCart(cart: TCart | null, product: TProduct) {
	return !!cart?.items?.find((item) => item.product.id === product.id);
}

export const useAppApi = () => {
	const company = useCompany();
	const store = useStore();
	const user = useAppSelector((state) => state.user.user);
	const cart = useAppSelector((state) => state.cart.currentCart);
	const cartId = cart?.id ?? FirebaseApi.firestore.generateDocId("cart");

	const [loading, setLoading] = useState<
		Partial<Record<SubNestedKeys<typeof api>, boolean | undefined>>
	>({});

	const isValid = !!company?.id && store?.id && !!user?.uid;
	const isValidAdmin = !!company?.id && store?.id && !!user?.uid && !!user.admin;

	const api = useMemo(() => {
		const orders = {
			list: async () => {
				if (!isValid) return;
				const res = await FirebaseApi.firestore.listV2<TOrder>({
					collection: "orders",
					sort: [{ name: "date", value: "desc" }],
					where: [{ name: "storeId", operator: "==", value: store.id }],
				});
				return res;
			},
			order: async () => {
				if (!isValid || !cart) return;

				return await OrderApi.createOrder({
					type: "Order",
					userId: user.uid,
					companyId: store.companyId,
					storeId: store.id,
					cart: {
						items: cart.items,
						id: cart.id,
						cartTotal: calculateCartPrice(cart.items).finalCost,
						cartDiscount: calculateCartPrice(cart.items).discount,
						cartVat: calculateCartPrice(cart.items).vat,
					},
					address: {
						apartmentEnterNumber: "",
						apartmentNumber: "",
						city: "",
						country: "",
						floor: "",
						street: "",
						streetNumber: "",
					},
					client: {
						clientType: "user",
						companyId: "",
						email: "",
						fullName: "",
						id: "",
						phoneNumber: { code: "", number: "" },
						storeId: "",
						tenantId: "",
						type: "Profile",
						address: {
							apartmentEnterNumber: "",
							apartmentNumber: "",
							city: "",
							country: "",
							floor: "",
							street: "",
							streetNumber: "",
						},
					},
					status: "pending",
					date: Date.now(),
				});
			},
		};

		const system = {
			getUserOrders: async () => {
				if (!isValid) return;

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: "orders",
					where: [
						{
							name: "storeId",
							operator: "==",
							value: store.id,
						},
						{
							name: "userId",
							operator: "==",
							value: user.uid,
						},
					],
				});
			},

			auth: {
				logout: async () => {
					if (!isValid) return;

					mixPanelApi.track("AUTH_USER_LOGOUT", {
						storeId: store.id,
						companyId: company.id,
						userId: user.uid,
						userEmail: user.email,
						tenantId: store.tenantId,
					});
					return await FirebaseApi.auth.logout();
					// todo: navigate to store
					// todo: clear state
				},
			},
			categories: {
				get: async () => {
					if (!isValid) return [];
					const res = await FirebaseApi.firestore.get<{ categories: TCategory[] }>(
						store.id,
						"categories"
					);

					return res?.data?.categories ?? [];
				},
			},
		};

		const userApi = {
			permissions: {
				canCancelOrder({ order }: { order: TOrder }) {
					if (order.status === "pending") return true;
					return false;
				},
			},
			async cancelOrder({ order }: { order: TOrder }) {
				if (!user || !store || !order) return;
				// mixPanelApi.track("ADMIN_ORDER_ACCEPT", {
				// 	order,
				// });
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "canceled",
					},
					"orders"
				);
			},
			async addItemToCart({ product }: { product: TProduct }) {
				if (!product || !user || !store) return;

				const actualCart: Omit<TCart, "id"> = cart ?? {
					companyId: store.companyId ?? "",
					storeId: store.id,
					userId: user.uid,
					items: [],
					type: "Cart",
					status: "active",
				};

				const cartItems = cart?.items ?? [];

				const validation = ProductSchema.safeParse(product);
				if (!validation.success) {
					// todo handle schema error
					console.log(validation.error);
					return;
				}
				const safeProduct = validation.data;

				const isProductInCart = productInCart(cart, safeProduct);

				if (isProductInCart) {
					const items = structuredClone(cartItems ?? []);
					const productIndex = (cartItems ?? []).findIndex(
						(cartItem) => cartItem.product.id === product?.id
					);
					items[productIndex].amount += 1;
					CartService.updateCart(cartId, {
						...actualCart,
						items,
					});
				} else {
					const items = [
						...cartItems,
						{
							amount: 1,
							product: safeProduct,
						},
					];

					CartService.updateCart(cartId, {
						...actualCart,
						items,
					});
				}
				mixPanelApi.track("USER_ADD_ITEM_TO_CART", {
					productId: product.id,
					productName: product.name[0].value, //todo get correct lang
				});
			},
			async removeItemFromCart({ product }: { product: TProduct }) {
				if (!product || !user || !store || !cart) return;
				const cartItems = cart?.items ?? [];

				const productIndex = cartItems.findIndex(
					(cartItem) => cartItem.product.id === product.id
				);
				const productInCart = productIndex !== -1;
				if (!productInCart) return;

				const items = structuredClone(cartItems);

				if (items[productIndex].amount > 1) {
					items[productIndex].amount -= 1;
					CartService.updateCart(cartId, {
						...cart,
						items,
					});

					return;
				}
				items.splice(productIndex, 1);

				CartService.updateCart(cartId, {
					...cart,
					items,
				});
				mixPanelApi.track("USER_REMOVE_ITEM_FROM_CART", {
					productId: product.id,
					productName: product.name[0].value, //todo get correct lang
				});
			},
			signup: async (newUser: { email: string; password: string; fullName: string }) => {
				if (!isValid) return;

				const profile: TProfile = {
					type: "Profile",
					id: user.uid,
					companyId: store.companyId,
					storeId: store.id,
					tenantId: store.tenantId,
					clientType: "user",
					fullName: newUser.fullName,
					email: newUser.email,
					phoneNumber: { code: "", number: "" },
					address: {
						country: "",
						city: "",
						street: "",
						streetNumber: "",
						floor: "",
						apartmentEnterNumber: "",
						apartmentNumber: "",
					},
				};

				return await signup({ newUser, newProfile: profile });
			},
		};

		const admin = {
			productCreate: async (newProduct: TNewProduct) => {
				setLoading({ ...loading, "admin.productCreate": true });

				const res = await productCreate(newProduct);
				setLoading({ ...loading, "admin.productCreate": false });
				return res;
			},

			getStoreStats: async () => {
				if (!isValidAdmin) return;
				return FirebaseApi.firestore.getV2<TStoreStats>({
					collection: "store-stats",
					id: store.id,
				});
			},
			getStoreClients: async () => {
				if (!isValidAdmin) return;
				return FirebaseApi.firestore.listV2<TProfile>({
					collection: "profiles",
					where: [
						{
							name: "storeId",
							operator: "==",
							value: store.id,
						},
					],
				});
			},
			uploadLogo: async ({ logo }: { logo: File }) => {
				if (!isValidAdmin) return;

				return await uploadLogo({
					storeId: store.id,
					logo,
				});
			},
			async companyCreate(newCompany: TNewCompany) {
				if (!isValidAdmin) return;

				try {
					const res = await FirebaseApi.api.createCompanyClient(newCompany);
					console.log("res", res);

					if (!res.success) {
						// todo: handle
						return res;
					}
				} catch (error) {
					console.error(error);
					SentryApi.captureException(error);
					return { user: null, success: false, error };
				}
			},
			orderPaid({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				mixPanelApi.track("ADMIN_ORDER_PAID", {
					order,
				});
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "completed",
					},
					"orders"
				);
			},
			orderDelivered({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				mixPanelApi.track("ADMIN_ORDER_DELIVERED", {
					order,
				});
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "delivered",
					},
					"orders"
				);
			},
			orderAccept({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				mixPanelApi.track("ADMIN_ORDER_ACCEPT", {
					order,
				});
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "processing",
					},
					"orders"
				);
			},
			productDelete: async ({ product }: { product: TProduct }) => {
				if (!isValidAdmin) return;

				return productDelete({ product });
			},
			category: {
				create: async (category: TCategory) => {
					if (!isValidAdmin) return;

					return await FirebaseApi.firestore.update(
						store.id,
						{
							categories: FirebaseApi.firestore.arrayUnion(category),
						},
						"categories"
					);
				},
				update: async (categories: TCategory[]) => {
					if (!isValidAdmin) return;

					return await FirebaseApi.firestore.update(
						store.id,
						{
							categories: categories,
						},
						"categories"
					);
				},
			},
		};

		return { orders, admin, system, user: userApi };
	}, [store, cart, user]);

	return api;
};
