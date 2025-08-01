import { useCallback, useEffect, useState } from "react";
import { FirebaseAPI, getCartCost, TCategory, TDiscount } from "@jsdev_ninja/core";
import { TCompany } from "src/domains/Company";
import { TOrder } from "@jsdev_ninja/core";
import { useStoreActions } from "src/infra";
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
import { navigate } from "src/navigation";
import { TStoreStats } from "src/types";
import { LogPayload } from "src/lib/firebase/api";
import { useApiState } from "./useApiState";
import { modalApi } from "src/infra/modals";
import diff from "microdiff";

function productInCart(cart: TCart | null, product: TProduct) {
	return !!cart?.items?.find((item) => item.product.id === product.id);
}

export const useAppApi = () => {
	const { appReady, cart, company, store, user } = useApiState();
	const actions = useStoreActions();

	const cartId = cart?.id ?? FirebaseApi.firestore.generateDocId("cart");

	const storeId = store?.id;
	const tenantId = store?.tenantId;
	const companyId = store?.companyId;
	const userId = user?.uid;

	const [loading, setLoading] = useState<
		Partial<Record<SubNestedKeys<Omit<typeof api, "loading">>, boolean | undefined>>
	>({});

	function updateLoading(
		update: Partial<Record<SubNestedKeys<Omit<typeof api, "loading">>, boolean | undefined>>
	) {
		setLoading({ ...loading, ...update });
	}

	const isValidStoreData = companyId && storeId && tenantId;
	const isValidUser = !!user && userId && isValidStoreData;

	const isValid = !!company?.id && store?.id && !!user?.uid;
	const isValidAdmin = !!companyId && !!storeId && !!user?.uid && !!user.admin;

	const allowAnonymousClients = !!store?.allowAnonymousClients;

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

	const api = {
		orders: {
			list: async () => {
				if (!isValidStoreData) return;
				const res = await FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						storeId,
						companyId,
					}),
					sort: [{ name: "date", value: "desc" }],
					where: [{ name: "storeId", operator: "==", value: store.id }],
				});

				return res;
			},
			order: async ({ order }: { order: TOrder }) => {
				if (!isValidUser) return;

				return await FirebaseApi.firestore.createV2({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					doc: order,
				});
			},
		},
		admin: {
			deleteDiscount: async (id: string) => {
				if (!isValidAdmin) return;

				return await FirebaseApi.firestore.remove({
					id,
					collectionName: FirebaseAPI.firestore.getPath({
						collectionName: "discounts",
						companyId,
						storeId,
					}),
				});
			},
			createDiscount: async (discount: TDiscount) => {
				if (!isValidAdmin) return;

				const res = await FirebaseApi.firestore.createV2<TDiscount>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "discounts",
						companyId,
						storeId,
					}),
					doc: discount,
				});

				logger({
					message: "create discount",
					severity: res.success ? "INFO" : "ERROR",
					res,
					discount,
				});

				return;
			},
			subscribeToDiscounts: (callback: (discounts: TDiscount[]) => void) => {
				if (!isValidAdmin) return () => {};

				return FirebaseApi.firestore.subscribeList<TDiscount>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "discounts",
						companyId,
						storeId,
					}),
					callback,
				});
			},
			getOrder: async (id: string) => {
				if (!isValidAdmin) return;

				return FirebaseApi.firestore.getV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					id,
				});
			},
			getStoreOrders: async () => {
				if (!isValidAdmin) return;

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					where: [
						{
							name: "storeId",
							operator: "==",
							value: store.id,
						},
						{
							name: "companyId",
							operator: "==",
							value: companyId,
						},
					],
					sort: [{ name: "date", value: "desc" }],
				});
			},
			removeProductImage: async ({ product }: { product: TProduct }) => {
				if (!isValidAdmin) return;

				// remove product images
				if (product.images?.[0]) {
					await FirebaseApi.storage.remove(product.images?.[0].url);
				}

				const newProduct = { ...product };
				newProduct.images = [];

				return await FirebaseApi.firestore.setV2({
					doc: newProduct,
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "products",
						companyId,
						storeId,
					}),
				});
			},
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
			getClient: async (clientId: string) => {
				if (!isValidAdmin) return;
				return FirebaseApi.firestore.getV2<TProfile>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						storeId,
						companyId,
					}),
					id: clientId,
				});
			},
			getStoreClients: async () => {
				if (!isValidAdmin) return;
				return FirebaseApi.firestore.listV2<TProfile>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						storeId,
						companyId,
					}),
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
						return res;
					}
				} catch (error) {
					console.error(error);
					SentryApi.captureException(error);
					return { user: null, success: false, error };
				}
			},
			async updateOrder({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				// mixPanelApi.track("", {
				// 	order,
				// });

				const cartCost = getCartCost({
					cart: order.cart.items ?? [],
					discounts: [],
					store: store,
				});

				const newOrder: TOrder = {
					...order,
					cart: {
						...order.cart,
						items: cartCost.items,
						cartDiscount: cartCost.discount,
						cartTotal: cartCost.finalCost,
						cartVat: cartCost.vat,
					},
				};

				return FirebaseApi.firestore.setV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					}),
					doc: newOrder,
				});
			},
			async chargeOrder({ order }: { order: TOrder }) {
				// get transactionId

				await FirebaseApi.api.chargeOrder({
					order: order,
				});
				return { success: true };
				// create token
			},
			async endOrder({ order }: { order: TOrder }) {
				// get transactionId
				if (!isValidAdmin) return;

				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "completed",
						paymentStatus: "completed",
					},
					FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					})
				);
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
					FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					})
				);
			},
			orderInDelivery({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				mixPanelApi.track("ADMIN_ORDER_DELIVERED", {
					order,
				});
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "in_delivery",
					},
					FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					})
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
					FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					})
				);
			},
			orderAccept({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				mixPanelApi.track("ADMIN_ORDER_ACCEPT", {
					order,
				});
				console.log("update", order.id);
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "processing",
					},
					FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					})
				);
			},

			category: {
				create: async (category: TCategory) => {
					if (!isValidAdmin) return;

					logger({
						message: `admin try create category`,
						severity: "INFO",
						category,
					});
					updateLoading({
						"admin.category.create": true,
					});

					const res = await FirebaseApi.firestore.setV2({
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

					logger({
						message: `admin ${res.success ? "success" : "fail"}  create category`,
						severity: res.success ? "INFO" : "ALERT",
						data: category ?? {},
					});

					updateLoading({
						"admin.category.create": false,
					});

					return res;
				},
				update: async (categories: TCategory[], currentCategories: TCategory[]) => {
					if (!isValidAdmin) return;

					const changes = diff(currentCategories, categories);

					logger({
						message: `admin try update category`,
						severity: "INFO",
						categories,
						changes,
					});
					updateLoading({
						"admin.category.update": true,
					});

					const res = await FirebaseApi.firestore.setV2({
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

					logger({
						message: `admin ${res.success ? "success" : "fail"}  update category`,
						severity: res.success ? "INFO" : "ALERT",
						data: categories ?? {},
						changes,
					});

					updateLoading({
						"admin.category.update": false,
					});
				},
			},
		},
		system: {
			getDiscounts: async () => {
				if (!isValidUser) return { success: false, data: [], error: new Error("invalid user") };

				const response = await FirebaseApi.firestore.listV2<TDiscount>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "discounts",
						companyId,
						storeId,
					}),
				});

				logger({ message: "fetch discounts", severity: "DEBUG", response });

				return response;
			},
			getProductById: async ({ id }: { id: TProduct["id"] }) => {
				if (!isValid) return;

				const response = await FirebaseApi.firestore.getV2<TProduct>({
					collection: FirebaseAPI.firestore.getPath({
						companyId: company.id,
						storeId: store.id,
						collectionName: "products",
					}),
					id,
				});

				logger({ message: "system.getProductById", severity: "DEBUG", response });

				return response;
			},
			getUserOrders: async () => {
				if (!isValidStoreData || !isValidUser) return;

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					}),
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
					actions.dispatch(actions.cart.setCart({ cart: null, isReady: false }));
					actions.dispatch(actions.orders.setOrders([]));
					actions.dispatch(actions.favoriteProducts.setFavoriteProducts([]));
					actions.dispatch(actions.profile.setProfile(null));
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

				// todo handle duplicate payment and page refresh

				await FirebaseApi.firestore.setV2<Partial<TOrder>>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					doc: {
						id: payment.Order,
						paymentStatus: store?.paymentType === "external" ? "external" : "pending_j5",
						status: "pending",
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
			},
		},
		user: {
			permissions: {
				canCancelOrder({ order }: { order: TOrder }) {
					if (order.status === "pending") return true;
					return false;
				},
			},
			subscriptions: {
				profileSubscribe: () => {
					if (!isValidUser || user?.isAnonymous === true) return;

					const unsubscribe = FirebaseApi.firestore.subscribeDocV2<TProfile>({
						collection: FirebaseAPI.firestore.getPath({
							collectionName: "profiles",
							storeId,
							companyId,
						}),
						id: user.uid,
						callback(profile) {
							actions.dispatch(actions.profile.setProfile(profile));
						},
					});
					return unsubscribe;
				},
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
			getOrder: async ({ id }: { id: string }) => {
				if (!isValidUser)
					return { success: false, data: null, error: new Error("invalid user") };

				return FirebaseApi.firestore.getV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					id: id,
				});
			},

			async addProductToFavorite({ product }: { product: TProduct }) {
				if (!product || !user || !company || !store || user.isAnonymous) return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}
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
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}
				return await FirebaseApi.firestore.remove({
					collectionName: "favorite-products",
					id: id,
				});
			},
			async profileUpdate({ profile }: { profile: TProfile }) {
				if (!user || !store || !profile) return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}

				if (!isValidStoreData) return;

				await FirebaseApi.firestore.update(
					profile.id,
					profile,
					FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						storeId,
						companyId,
					})
				);
			},
			async createPaymentLink({ order }: { order: TOrder }) {
				if (!user || !store || !order) return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}

				const payment: any = await FirebaseApi.api.createPayment({ order: order });
				logger({
					message: "client create payment link",
					severity: "INFO",
					payment,
					userId: user.uid,
				});
				return payment;
			},
			async cancelOrder({ order }: { order: TOrder }) {
				if (!isValidUser) return;
				// mixPanelApi.track("ADMIN_ORDER_ACCEPT", {
				// 	order,
				// });
				return FirebaseApi.firestore.update<TOrder>(
					order.id,
					{
						status: "cancelled",
					},
					FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "orders",
					})
				);
			},
			async createCartFromOrder({ order }: { order: TOrder }) {
				if (!isValidUser) return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}

				// mark currentCart as draft
				if (cart?.id) {
					await FirebaseApi.firestore.setV2<TCart>({
						collection: FirebaseAPI.firestore.getPath({
							companyId,
							storeId,
							collectionName: "cart",
						}),
						doc: { ...cart, status: "draft" },
					});
				}

				await FirebaseApi.firestore.setV2({
					collection: FirebaseAPI.firestore.getPath({
						companyId,
						storeId,
						collectionName: "cart",
					}),
					doc: {
						id: FirebaseApi.firestore.generateDocId("cart"),
						status: "active",
						items: order.cart.items,
						companyId: company?.id,
						storeId: store.id,
						type: "Cart",
						userId: user.uid,
					},
				});

				logger({ severity: "INFO", message: "user create cart from order", order });

				navigate({
					to: "store.catalog",
				});
			},

			async addItemToCart({ product }: { product: TProduct }) {
				if (!isValidUser) {
					return;
				}

				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
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
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
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
			async updateCartItemAmount({ product, amount }: { product: TProduct; amount: number }) {
				if (!isValidUser) {
					return;
				}

				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}

				logger({
					message: "user update cart item amount",
					severity: "INFO",
				});

				const cartItems = cart?.items ?? [];

				const productIndex = cartItems.findIndex(
					(cartItem) => cartItem.product.id === product.id
				);
				const productInCart = productIndex !== -1;
				if (!productInCart) return;

				const items = structuredClone(cartItems);

				if (amount <= 0) {
					// Remove item if amount is 0 or negative
					items.splice(productIndex, 1);
				} else {
					// Update amount
					items[productIndex].amount = amount;
				}

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

				// Update local state
				actions.dispatch(actions.cart.updateItemAmount({ product, amount }));

				mixPanelApi.track("USER_UPDATE_CART_ITEM_AMOUNT", {
					productId: product.id,
					productName: product.name[0].value,
					amount,
				});
			},
		},
		superAdmin: {
			getAllStores: async () => {
				const res = await FirebaseApi.firestore.listV2({
					collection: "stores",
				});
				return res;
			},
		},
		auth: {
			signup: async (newUser: {
				email: string;
				password: string;
				fullName: string;
				companyName?: string;
			}) => {
				if (!isValidStoreData) return;

				mixPanelApi.track("AUTH_USER_SIGNUP", {
					storeId: store.id,
					companyId: companyId,
					userEmail: newUser.email,
					tenantId: store.tenantId,
				});

				const profile: TProfile = {
					id: "",
					companyId: store.companyId,
					storeId: store.id,
					tenantId: store.tenantId,
					displayName: newUser.fullName,
					companyName: newUser.companyName,
					email: newUser.email,
					isAnonymous: false,
					phoneNumber: "",
					address: {
						apartmentEnterNumber: "",
						apartmentNumber: "",
						city: "",
						country: "",
						floor: "",
						street: "",
						streetNumber: "",
					},
					clientType: newUser.companyName ? "company" : "user",
					createdDate: Date.now(),
					lastActivityDate: Date.now(),
					type: "Profile",
					paymentType: "default",
				};

				const res = await FirebaseApi.auth.createUser(newUser.email, newUser.password);
				if (!res.success) {
					logger({ severity: "CRITICAL", message: `fail sign up`, ...res });
					return res;
				}

				profile.id = res.user?.uid ?? "";

				const newProfile = await FirebaseApi.firestore.setV2<Partial<TProfile>>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						companyId,
						storeId,
					}),
					doc: profile,
				});

				logger({
					severity: "INFO",
					message: "new user sign up",
					user,
					profile,
				});

				return { user: res.user, profile: newProfile, success: true };
			},
			login: async (data: { email: string; password: string }) => {
				if (!isValidStoreData) return;

				mixPanelApi.track("AUTH_USER_LOGIN", {
					storeId: store.id,
					companyId: companyId,
					userEmail: data.email,
					tenantId: store.tenantId,
				});
				return await FirebaseApi.auth.login(data.email, data.password);
			},

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
				actions.dispatch(actions.cart.setCart({ cart: null, isReady: false }));
				actions.dispatch(actions.orders.setOrders([]));
				actions.dispatch(actions.favoriteProducts.setFavoriteProducts([]));
				actions.dispatch(actions.profile.setProfile(null));
			},
		},
	};

	return { ...api, loading };
};
