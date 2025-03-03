import { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseAPI, TCategory } from "@jsdev_ninja/core";
import { TCompany, useCompany } from "src/domains/Company";
import { TOrder } from "src/domains/Order";
import { useStore } from "src/domains/Store";
import { signup } from "src/features/auth/signup";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { mixPanelApi } from "src/lib/mixpanel";
import { SentryApi } from "src/lib/sentry";
import { SubNestedKeys } from "src/shared/types";
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
import { LogPayload } from "src/lib/firebase/api";

// todo move to folder
function productInCart(cart: TCart | null, product: TProduct) {
	return !!cart?.items?.find((item) => item.product.id === product.id);
}

export const useAppApi = () => {
	const appReady = useAppSelector((state) => state.ui.appReady);
	const company = useCompany();
	const store = useStore();
	const user = useAppSelector((state) => state.user.user);
	const cart = useAppSelector((state) => state.cart.currentCart);
	const cartId = cart?.id ?? FirebaseApi.firestore.generateDocId("cart");

	const storeId = store?.id;
	const tenantId = store?.tenantId;
	const companyId = store?.companyId;
	const userId = user?.uid;

	const [loading, setLoading] = useState<
		Partial<Record<SubNestedKeys<typeof api>, boolean | undefined>>
	>({});

	const isValidStoreData = companyId && storeId && tenantId;
	const isValidUser = userId && isValidStoreData;

	const isValid = !!company?.id && store?.id && !!user?.uid;
	const isValidAdmin = !!companyId && !!storeId && !!user?.uid && !!user.admin;

	const actualCart: TCart = cart ?? {
		id: cartId,
		companyId: store?.companyId ?? "",
		storeId: store?.id ?? "",
		userId: user?.uid ?? "",
		items: [],
		type: "Cart",
		status: "active",
	};

	const logger = useCallback(
		(
			payload: { message: LogPayload["message"]; severity: LogPayload["severity"] } & {
				[key: string]: any;
			}
		) => {
			FirebaseApi.api.uiLogs({
				companyId,
				storeId,
				tenantId,
				userId,
				...payload,
			});
		},
		[companyId, storeId, tenantId, userId]
	);
	useEffect(() => {
		if (appReady && !isValidStoreData) {
			logger({
				message: "invalid store data",
				severity: "ALERT",
			});
		}
	}, [appReady, isValidStoreData, logger]);

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
			order: async ({ order }: { order: TOrder }) => {
				if (!isValidUser) return;

				console.log("order", order.id);

				return await FirebaseApi.firestore.createV2({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					doc: order,
				});
			},
		};

		const system = {
			getProductById: async ({ id }: { id: TProduct["id"] }) => {
				if (!isValid) return;

				return FirebaseApi.firestore.getV2<TProduct>({
					collection: FirebaseAPI.firestore.getPath({
						companyId: company.id,
						storeId: store.id,
						collectionName: "products",
					}),
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

				const res = await FirebaseApi.firestore.getV2<{ categories: TCategory[] }>({
					collection: FirebaseAPI.firestore.getPath({
						companyId: company.id,
						storeId: store.id,
						collectionName: "categories",
					}),
					id: "categories",
				});

				return res;
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
				if (!isValidUser) {
					return;
				}

				console.log("onOrderPaid", payment.Order);

				await FirebaseApi.firestore.setV2<Partial<TOrder>>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					doc: {
						id: payment.Order,
						paymentStatus: "completed",
					},
				});
				await FirebaseApi.firestore.createV2({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "payments",
						companyId,
						storeId,
					}),
					doc: {
						id: payment.Order,
						payment,
						date: Date.now(),
						storeId: store.id,
						companyId: companyId,
						userId: user.uid,
					},
				});
				// todo handle refresh
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

				return await FirebaseApi.firestore.remove({
					collectionName: "favorite-products",
					id: id,
				});
			},
			async profileUpdate({ profile }: { profile: TProfile }) {
				if (!user || !store || !profile) return;

				await FirebaseApi.firestore.update(profile.id, profile, "profiles");
			},
			async createPaymentLink({ order }: { order: TOrder }) {
				if (!user || !store || !order) return;

				console.log("createPaymentLink", order.id);

				const payment: any = await FirebaseApi.api.createPayment({ order: order });
				return payment;
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
				if (!isValidUser) {
					return;
				}

				logger({
					message: "user add item to cart",
					severity: "INFO",
				});

				const cartItems = cart?.items ?? [];

				const validation = ProductSchema.safeParse(product);
				if (!validation.success) {
					logger({
						message: `add item to cart - invalid product data`,
						severity: "ERROR",
						product,
						error: validation.error,
					});
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
					FirebaseApi.firestore.setV2<TCart>({
						collection: FirebaseAPI.firestore.getPath({
							companyId,
							storeId,
							collectionName: "cart",
						}),
						doc: {
							...actualCart,
							items,
						},
					});
				} else {
					const items = [
						...cartItems,
						{
							amount: 1,
							product: safeProduct,
						},
					];

					FirebaseApi.firestore.setV2<TCart>({
						collection: FirebaseAPI.firestore.getPath({
							companyId,
							storeId,
							collectionName: "cart",
						}),
						doc: {
							...actualCart,
							items,
						},
					});
				}
				mixPanelApi.track("USER_ADD_ITEM_TO_CART", {
					productId: product.id,
					productName: product.name[0].value, //todo get correct lang
					storeId: store.id,
					storeName: store.name,
					companyId: companyId,
					companyName: company?.name,
				});
			},
			async removeItemFromCart({ product }: { product: TProduct }) {
				if (!isValidUser) {
					return;
				}

				logger({
					message: "user remove item from cart",
					severity: "INFO",
				});

				const cartItems = cart?.items ?? [];

				const productIndex = cartItems.findIndex(
					(cartItem) => cartItem.product.id === product.id
				);
				const productInCart = productIndex !== -1;
				if (!productInCart) return;

				const items = structuredClone(cartItems);

				if (items[productIndex].amount > 1) {
					items[productIndex].amount -= 1;
					FirebaseApi.firestore.setV2<TCart>({
						collection: FirebaseAPI.firestore.getPath({
							companyId,
							storeId,
							collectionName: "cart",
						}),
						doc: {
							...actualCart,
							items,
						},
					});
					mixPanelApi.track("USER_REMOVE_ITEM_FROM_CART", {
						productId: product.id,
						productName: product.name[0].value, //todo get correct lang
					});

					return;
				}
				items.splice(productIndex, 1);

				FirebaseApi.firestore.setV2<TCart>({
					collection: FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "cart",
					}),
					doc: {
						...actualCart,
						items,
					},
				});
				mixPanelApi.track("USER_REMOVE_ITEM_FROM_CART", {
					productId: product.id,
					productName: product.name[0].value, //todo get correct lang
				});
			},
			signup: async (newUser: { email: string; password: string; fullName: string }) => {
				if (!isValid) return;

				const profile: TProfile = {
					id: user.uid,
					companyId: store.companyId,
					storeId: store.id,
					tenantId: store.tenantId,
					displayName: newUser.fullName,
					email: newUser.email,
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
			productDelete: async ({ product }: { product: TProduct }) => {
				if (!isValidAdmin) return;

				// remove product images
				if (product.images?.[0]) {
					await FirebaseApi.storage.remove(product.images?.[0].url);
				}

				return await FirebaseApi.firestore.remove({
					id: product.id,
					collectionName: FirebaseAPI.firestore.getPath({
						collectionName: "products",
						companyId,
						storeId,
					}),
				});
			},
			saveProduct: async (newProduct: TNewProduct) => {
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
				try {
					const path = `${companyId}/${storeId}/logo`;
					const fileRef = await FirebaseApi.storage.upload(path, logo);
					const newLogo = { id: path, url: fileRef.url };
					await FirebaseApi.firestore.setV2({
						collection: FirebaseAPI.firestore.systemCollections.stores,
						doc: {
							id: storeId,
							logoUrl: newLogo.url,
						},
					});
					return { success: true, data: newLogo };
				} catch (error) {
					SentryApi.captureException(error);
					return { success: false };
				}
			},
			async companyCreate(newCompany: TCompany) {
				if (!isValidAdmin) return;

				try {
					const res = await FirebaseApi.api.createCompanyClient(newCompany);

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

			category: {
				create: async (category: TCategory) => {
					if (!isValidAdmin) return;

					return await FirebaseApi.firestore.setV2({
						collection: FirebaseAPI.firestore.getPath({
							companyId,
							storeId,
							collectionName: "categories",
						}),
						doc: {
							id: "categories",
							categories: FirebaseApi.firestore.arrayUnion(category),
						},
					});
				},
				update: async (categories: TCategory[]) => {
					if (!isValidAdmin) return;

					return await FirebaseApi.firestore.setV2({
						collection: FirebaseAPI.firestore.getPath({
							companyId,
							storeId,
							collectionName: "categories",
						}),
						doc: {
							id: "categories",
							categories: categories,
						},
					});
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
