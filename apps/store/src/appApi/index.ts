import { useMemo, useState } from "react";
import { TCategory } from "@jsdev_ninja/core";
import { TCompany, useCompany } from "src/domains/Company";
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
import { calculateCartPrice } from "src/utils/calculateCartPrice";
import { productCreate } from "./admin";
import {
	ProductSchema,
	TFavoriteProduct,
	TNewProduct,
	TProduct,
	TProfile,
} from "@jsdev_ninja/core";
import { TCart } from "src/domains/cart";
import { CartService } from "src/domains/cart/CartService";
import { navigate } from "src/navigation";
import { TStoreStats } from "src/types";

// client -> login, logout, register
// client -> add product to cart, remove product from cart, add product to favorites
// client -> pay order
// client -> edit profile
// admin ->
// admin ->
// admin ->
// admin ->

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
					paymentStatus: "pending",
					companyId: store.companyId,
					storeId: store.id,
					cart: {
						items: cart.items,
						id: cart.id,
						cartTotal: calculateCartPrice(cart.items).finalCost,
						cartDiscount: calculateCartPrice(cart.items).discount,
						cartVat: calculateCartPrice(cart.items).vat,
					},
					client: {
						clientType: "user",
						companyId: "",
						email: "",
						displayName: "",
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
						createdDate: Date.now(),
						isAnonymous: true,
						lastActivityDate: Date.now(),
					},
					status: "pending",
					date: Date.now(),
				});
			},
		};

		const system = {
			getProductById: async ({ id }: { id: TProduct["id"] }) => {
				if (!isValid) return;

				return FirebaseApi.firestore.getV2<TProduct>({
					collection: "products",
					id,
				});
			},
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

			async getStoreCategories() {
				if (!isValid) return;

				const res = await FirebaseApi.firestore.getV2({
					collection: "categories",
					id: store.id,
				});
				console.log("res", res);
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
					await FirebaseApi.auth.logout();
					navigate({
						to: "store",
					});
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
			async onOrderPaid(payment: any) {
				if (!isValid) {
					console.warn("EEEE", isValid);
					return;
				}

				await FirebaseApi.firestore.update<TOrder>(
					payment.Order,
					{
						paymentStatus: "completed",
					},
					"orders"
				);
				const res = await FirebaseApi.firestore.createV2({
					collection: "payments",
					id: payment.Order,
					doc: {
						payment,
						date: Date.now(),
						storeId: store.id,
						companyId: company.id,
						userId: user.uid,
					},
				});
				// todo handle refresh
				console.log("res", res);
			},
		};

		const userApi = {
			permissions: {
				canCancelOrder({ order }: { order: TOrder }) {
					if (order.status === "pending") return true;
					return false;
				},
			},
			subscriptions: {
				favoriteProductsSubscribe: (
					callback: (favoriteProducts: TFavoriteProduct[]) => void
				) => {
					if (!user || !company || !store || user.isAnonymous) return;

					return FirebaseApi.firestore.subscribeList({
						callback,
						collection: "favorite-products",
						where: [
							{ name: "userId", operator: "==", value: user.uid },
							{ name: "storeId", operator: "==", value: store.id },
							{ name: "companyId", operator: "==", value: company.id },
						],
					});
				},
			},
			async addProductToFavorite({ product }: { product: TProduct }) {
				if (!product || !user || !company || !store || user.isAnonymous) return;

				return await FirebaseApi.firestore.setV2<any>({
					collection: "favorite-products",
					doc: {
						productId: product.id,
						userId: user.uid,
						storeId: store.id,
						companyId: company.id,
					},
				});
			},
			async removeProductToFavorite({ id }: { id: string }) {
				if (!id || !user || !company || !store || user.isAnonymous) return;
				console.log("remove", id);

				return await FirebaseApi.firestore.remove({
					collectionName: "favorite-products",
					id: id,
				});
			},
			async profileUpdate({ profile }: { profile: TProfile }) {
				if (!user || !store || !profile) return;

				const response = await FirebaseApi.firestore.update(profile.id, profile, "profiles");
				console.log("response", response);
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
			async createCartFromOrder({ order }: { order: TOrder }) {
				if (!user || !store || !order || !company) return;

				// mark currentCart as draft
				if (cart?.id) {
					await CartService.updateCart(cart.id, {
						status: "draft",
					});
				}
				await CartService.createCart({
					status: "active",
					items: order.cart.items,
					companyId: company.id,
					storeId: store.id,
					type: "Cart",
					userId: user.uid,
				});
				navigate({
					to: "store.catalog",
				});
			},

			async addItemToCart({ product }: { product: TProduct }) {
				if (!product || !user || !store || !company) return;

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
					storeId: store.id,
					storeName: store.name,
					companyId: company.id,
					companyName: company.name,
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

				console.log("newUser", newUser);

				const profile: TProfile = {
					id: user.uid,
					companyId: store.companyId,
					storeId: store.id,
					tenantId: store.tenantId,
					displayName: newUser.fullName,
					email: newUser.email,
					phoneNumber: { code: "+972", number: "" },
					isAnonymous: false,
					address: {
						apartmentEnterNumber: "",
						apartmentNumber: "",
						city: "",
						country: "",
						floor: "",
						street: "",
						streetNumber: "",
					},
					clientType: "user",
					createdDate: Date.now(),
					lastActivityDate: Date.now(),
					type: "Profile",
				};
				console.log("profile.profile", profile);

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
			async companyCreate(newCompany: TCompany) {
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
			async chargeOrder({ order }: { order: TOrder }) {
				// get transactionId
				console.log("chargeOrder", order);

				await FirebaseApi.api.chargeOrder({
					orderId: order.id,
				});
				return { success: true };
				// create token
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

		const superAdmin = {
			getAllStores: async () => {
				const res = await FirebaseApi.firestore.listV2({
					collection: "stores",
				});
				return res;
			},
		};

		return { orders, admin, system, user: userApi, superAdmin };
	}, [store, cart, user]);

	return api;
};
