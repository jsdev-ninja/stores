import { useCallback, useEffect, useState } from "react";
import {
	FirebaseAPI,
	getCartCost,
	NewOrganizationSchema,
	TCategory,
	TDiscount,
	TOrganization,
	TOrganizationGroup,
	TNewOrganizationGroup,
	NewOrganizationGroupSchema,
	TSupplier,
	TNewSupplier,
	NewSupplierSchema,
	SupplierSchema,
	TSupplierInvoice,
} from "@jsdev_ninja/core";
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
	TNewOrganization,
	TAddress,
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
	const { appReady, cart, company, store, user, profile } = useApiState();
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
		logger,
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
			uploadSupplierInvoice: async (invoice: TSupplierInvoice) => {
				if (!isValidAdmin) return;

				return await FirebaseApi.firestore.createV2({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "supplierInvoices",
						companyId,
						storeId,
					}),
					doc: invoice,
					id: invoice.id,
				});
			},
			listSupplierInvoices: async () => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.listSupplierInvoices": true });
				const result = await FirebaseApi.firestore.listV2<TSupplierInvoice>({
					collection: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "supplierInvoices",
					}),
					sort: [{ name: "date", value: "desc" }],
				});
				updateLoading({ "admin.listSupplierInvoices": false });

				return result;
			},
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
			getOrdersForInvoice: async ({
				organizationId,
				billingAccount,
				fromDate,
				toDate,
			}: {
				organizationId: string;
				billingAccount?: string;
				fromDate: number;
				toDate: number;
			}) => {
				if (!isValidAdmin) return;

				const whereClauses = [
					{
						name: "storeId" as const,
						operator: "==" as const,
						value: store.id,
					},
					{
						name: "companyId" as const,
						operator: "==" as const,
						value: companyId,
					},
					{
						name: "organizationId" as const,
						operator: "==" as const,
						value: organizationId,
					},
					{
						name: "ezDeliveryNote.success" as const,
						operator: "==" as const,
						value: true,
					},
					{
						name: "date" as const,
						operator: ">=" as const,
						value: fromDate,
					},
					{
						name: "date" as const,
						operator: "<=" as const,
						value: toDate,
					},
				];

				if (billingAccount) {
					whereClauses.push({
						name: "billingAccount.number" as any,
						operator: "==" as const,
						value: billingAccount,
					});
				}

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					where: whereClauses,
					sort: [{ name: "date", value: "desc" }],
				});
			},
			getOrdersForDeliveryNote: async ({
				fromDate,
				toDate,
			}: {
				fromDate: number;
				toDate: number;
			}) => {
				if (!isValidAdmin) return;

				const whereClauses = [
					{
						name: "storeId" as const,
						operator: "==" as const,
						value: store.id,
					},
					{
						name: "companyId" as const,
						operator: "==" as const,
						value: companyId,
					},

					{
						name: "date" as const,
						operator: ">=" as const,
						value: fromDate,
					},
					{
						name: "date" as const,
						operator: "<=" as const,
						value: toDate,
					},
				];

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					where: whereClauses,
					sort: [{ name: "date", value: "desc" }],
				});
			},
			getOrganizationOrders: async (organizationId: string) => {
				if (!isValidAdmin) return;

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					where: [
						{
							name: "storeId" as const,
							operator: "==" as const,
							value: store.id,
						},
						{
							name: "companyId" as const,
							operator: "==" as const,
							value: companyId,
						},
						{
							name: "organizationId" as const,
							operator: "==" as const,
							value: organizationId,
						},
					],
					sort: [{ name: "date", value: "desc" }],
				});
			},
			getOrganizationInvoices: async (organizationId: string) => {
				if (!isValidAdmin) return;

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					where: [
						{
							name: "storeId" as const,
							operator: "==" as const,
							value: store.id,
						},
						{
							name: "companyId" as const,
							operator: "==" as const,
							value: companyId,
						},
						{
							name: "organizationId" as const,
							operator: "==" as const,
							value: organizationId,
						},
						{
							name: "invoice" as const,
							operator: "!=" as const,
							value: null,
						},
					],
					sort: [{ name: "date", value: "desc" }],
				});
			},
			getDeliveryNotes: async ({ fromDate, toDate }: { fromDate: number; toDate: number }) => {
				if (!isValidAdmin) return;

				return FirebaseApi.firestore.listV2<TOrder>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId,
						storeId,
					}),
					where: [
						{
							name: "storeId" as const,
							operator: "==" as const,
							value: store.id,
						},
						{
							name: "companyId" as const,
							operator: "==" as const,
							value: companyId,
						},
						{
							name: "ezDeliveryNote.success" as const,
							operator: "==" as const,
							value: true,
						},
						{
							name: "date" as const,
							operator: ">=" as const,
							value: fromDate,
						},
						{
							name: "date" as const,
							operator: "<=" as const,
							value: toDate,
						},
					],
					sort: [{ name: "date", value: "desc" }],
				});
			},
			createDeliveryNote: async (
				order: TOrder,
				options?: { date?: number; sendEmailToClient?: boolean; nameOnInvoice?: string }
			) => {
				if (!isValidAdmin) return;

				const { api } = await import("src/lib/firebase/api");
				return await api.createDeliveryNote({ order, options });
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
			updateClient: async (client: TProfile) => {
				if (!isValidAdmin) return;

				const result = await FirebaseApi.firestore.update<TProfile>(
					client.id,
					client,
					FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						storeId,
						companyId,
					})
				);

				logger({
					message: "update client profile",
					severity: result.success ? "INFO" : "ERROR",
					result,
					client,
				});

				return result;
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
			findClientByEmail: async (email: string) => {
				if (!isValidAdmin) return;

				const trimmedEmail = email.trim().toLowerCase();
				if (!trimmedEmail) {
					return { success: false, data: null };
				}

				const result = await FirebaseApi.firestore.listV2<TProfile>({
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

				if (!result?.success || !result.data) {
					return { success: false, data: null };
				}

				const match = result.data.find(
					(client) => client.email?.trim().toLowerCase() === trimmedEmail
				);

				return { success: true, data: match ?? null };
			},
			listOrganizationClients: async (organizationId: string) => {
				if (!isValidAdmin || !organizationId) return;

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
						{
							name: "organizationId",
							operator: "==",
							value: organizationId,
						},
					],
					sort: [{ name: "displayName", value: "asc" }],
				});
			},
			createOrganizationClient: async (payload: {
				displayName: string;
				email: string;
				clientType: TProfile["clientType"];
				paymentType: TProfile["paymentType"];
				phoneNumber?: string;
				companyName?: string;
				organizationId: string;
			}) => {
				if (!isValidAdmin || !tenantId) return;

				const profilesPath = FirebaseAPI.firestore.getPath({
					collectionName: "profiles",
					companyId,
					storeId,
				});

				const profileId = FirebaseApi.firestore.generateDocId(profilesPath);
				const now = Date.now();

				const newProfile: TProfile = {
					id: profileId,
					type: "Profile",
					companyId,
					storeId,
					tenantId,
					clientType: payload.clientType,
					displayName: payload.displayName,
					email: payload.email,
					isAnonymous: false,
					createdDate: now,
					lastActivityDate: now,
					paymentType: payload.paymentType,
					phoneNumber: payload.phoneNumber,
					companyName: payload.companyName,
					address: undefined,
					organizationId: payload.organizationId,
				};

				const result = await FirebaseApi.firestore.createV2<TProfile>({
					collection: profilesPath,
					doc: newProfile,
				});

				logger({
					message: "create organization client",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organizationId: payload.organizationId,
					profileId,
				});

				return result;
			},
			assignClientToOrganization: async ({
				clientId,
				organizationId,
			}: {
				clientId: string;
				organizationId: string;
			}) => {
				if (!isValidAdmin) return;

				const result = await FirebaseApi.firestore.update<TProfile>(
					clientId,
					{
						organizationId,
						lastActivityDate: Date.now(),
					},
					FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						storeId,
						companyId,
					})
				);

				logger({
					message: "assign client to organization",
					severity: result.success ? "INFO" : "ERROR",
					result,
					clientId,
					organizationId,
				});

				return result;
			},
			removeClientFromOrganization: async (clientId: string) => {
				if (!isValidAdmin) return;

				const result = await FirebaseApi.firestore.setV2<Partial<TProfile>>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "profiles",
						storeId,
						companyId,
					}),
					doc: {
						id: clientId,
						organizationId: null as unknown as TProfile["organizationId"],
						lastActivityDate: Date.now(),
					},
				});

				logger({
					message: "remove client from organization",
					severity: result.success ? "INFO" : "ERROR",
					result,
					clientId,
				});

				return result;
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
			updateStoreSettings: async (settings: {
				deliveryPrice?: number | null;
				freeDeliveryPrice?: number | null;
				minimumOrder?: number | null;
				isVatIncludedInPrice?: boolean;
				address?: TAddress | null;
			}) => {
				if (!isValidAdmin) return;

				try {
					// Remove null values to unset fields
					const cleanSettings = Object.fromEntries(
						Object.entries(settings).filter(([, value]) => value !== null)
					);

					const result = await FirebaseApi.firestore.setV2({
						collection: FirebaseAPI.firestore.systemCollections.stores,
						doc: {
							id: storeId,
							...cleanSettings,
						},
					});

					logger({
						message: "update store settings",
						severity: result.success ? "INFO" : "ERROR",
						settings,
						result,
					});

					return result;
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
					deliveryPrice: order.storeOptions?.deliveryPrice ?? 0,
					freeDeliveryPrice: order.storeOptions?.freeDeliveryPrice ?? 0,
					isVatIncludedInPrice: order.storeOptions?.isVatIncludedInPrice ?? false,
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
			cancelOrder({ order }: { order: TOrder }) {
				if (!isValidAdmin) return;
				mixPanelApi.track("ADMIN_ORDER_CANCEL", {
					order,
				});
				console.log("update", order.id);
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
			// Organization management
			createOrganization: async (organization: TNewOrganization) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.createOrganization": true });

				const validation = NewOrganizationSchema.safeParse(organization);
				if (!validation.success) {
					logger({
						message: "create organization",
						severity: "ERROR",
						error: validation.error,
						organization,
					});
					return { success: false, error: validation.error };
				}

				const doc = validation.data;

				const result = await FirebaseApi.firestore.createV2<TNewOrganization & { id?: string }>(
					{
						collection: FirebaseAPI.firestore.getPath({
							storeId,
							companyId,
							collectionName: "organizations",
						}),
						doc: doc,
					}
				);
				updateLoading({ "admin.createOrganization": false });

				logger({
					message: "create organization",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organization,
				});

				return { success: true, data: { ...organization, id: result.docId } };
			},
			updateOrganization: async (organization: TOrganization) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				const result = await FirebaseApi.firestore.update<TOrganization>(
					organization.id,
					organization,
					FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizations",
					})
				);
				logger({
					message: "update organization",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organization,
				});

				return result;
			},
			deleteOrganization: async (organizationId: string) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.deleteOrganization": true });
				const result = await FirebaseApi.firestore.remove({
					id: organizationId,
					collectionName: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizations",
					}),
				});
				updateLoading({ "admin.deleteOrganization": false });

				logger({
					message: "delete organization",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organizationId,
				});

				return result;
			},
			listOrganizations: async () => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.listOrganizations": true });
				const result = await FirebaseApi.firestore.listV2<TOrganization>({
					collection: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizations",
					}),
					sort: [{ name: "name", value: "asc" }],
				});
				updateLoading({ "admin.listOrganizations": false });

				return result;
			},
			// Organization Group management
			createOrganizationGroup: async (organizationGroup: TNewOrganizationGroup) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.createOrganizationGroup": true });

				const validation = NewOrganizationGroupSchema.safeParse(organizationGroup);
				if (!validation.success) {
					logger({
						message: "create organization group",
						severity: "ERROR",
						error: validation.error,
						organizationGroup,
					});
					return { success: false, error: validation.error };
				}

				const doc = validation.data;

				const result = await FirebaseApi.firestore.createV2<
					TNewOrganizationGroup & { id?: string }
				>({
					collection: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizationGroups",
					}),
					doc: doc,
				});
				updateLoading({ "admin.createOrganizationGroup": false });

				logger({
					message: "create organization group",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organizationGroup,
				});

				return result;
			},
			updateOrganizationGroup: async (organizationGroup: TOrganizationGroup) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				const result = await FirebaseApi.firestore.update<TOrganizationGroup>(
					organizationGroup.id,
					organizationGroup,
					FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizationGroups",
					})
				);
				logger({
					message: "update organization group",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organizationGroup,
				});

				return result;
			},
			deleteOrganizationGroup: async (organizationGroupId: string) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.deleteOrganizationGroup": true });
				const result = await FirebaseApi.firestore.remove({
					id: organizationGroupId,
					collectionName: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizationGroups",
					}),
				});
				updateLoading({ "admin.deleteOrganizationGroup": false });

				logger({
					message: "delete organization group",
					severity: result.success ? "INFO" : "ERROR",
					result,
					organizationGroupId,
				});

				return result;
			},
			listOrganizationGroups: async () => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.listOrganizationGroups": true });
				const result = await FirebaseApi.firestore.listV2<TOrganizationGroup>({
					collection: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "organizationGroups",
					}),
					sort: [{ name: "name", value: "asc" }],
				});
				updateLoading({ "admin.listOrganizationGroups": false });

				return result;
			},
			// Supplier management
			createSupplier: async (supplier: TNewSupplier) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.createSupplier": true });

				const validation = NewSupplierSchema.safeParse(supplier);
				if (!validation.success) {
					logger({
						message: "create supplier",
						severity: "ERROR",
						error: validation.error,
						supplier,
					});
					return { success: false, error: validation.error };
				}

				const doc = validation.data;

				const result = await FirebaseApi.firestore.createV2<TNewSupplier & { id?: string }>({
					collection: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "suppliers",
					}),
					doc: doc,
				});
				updateLoading({ "admin.createSupplier": false });

				logger({
					message: "create supplier",
					severity: result.success ? "INFO" : "ERROR",
					result,
					supplier,
				});

				return result;
			},
			updateSupplier: async (supplier: TSupplier) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.updateSupplier": true });

				const validation = SupplierSchema.safeParse(supplier);
				if (!validation.success) {
					logger({
						message: "update supplier",
						severity: "ERROR",
						error: validation.error,
						supplier,
					});
					updateLoading({ "admin.updateSupplier": false });
					return { success: false, error: validation.error };
				}

				const result = await FirebaseApi.firestore.update<TSupplier>(
					supplier.id,
					supplier,
					FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "suppliers",
					})
				);
				updateLoading({ "admin.updateSupplier": false });

				logger({
					message: "update supplier",
					severity: result.success ? "INFO" : "ERROR",
					result,
					supplier,
				});

				return result;
			},
			deleteSupplier: async (supplierId: string) => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.deleteSupplier": true });
				const result = await FirebaseApi.firestore.remove({
					id: supplierId,
					collectionName: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "suppliers",
					}),
				});
				updateLoading({ "admin.deleteSupplier": false });

				logger({
					message: "delete supplier",
					severity: result.success ? "INFO" : "ERROR",
					result,
					supplierId,
				});

				return result;
			},
			listSuppliers: async () => {
				if (!isValidAdmin || !companyId || !storeId) return;

				updateLoading({ "admin.listSuppliers": true });
				const result = await FirebaseApi.firestore.listV2<TSupplier>({
					collection: FirebaseAPI.firestore.getPath({
						storeId,
						companyId,
						collectionName: "suppliers",
					}),
					sort: [{ name: "name", value: "asc" }],
				});
				updateLoading({ "admin.listSuppliers": false });

				return result;
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

				console.log("res", res);

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
						originalAmount: payment.Amount,
						actualAmount: payment.Amount,
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
					if (!user || !company || !store || user.isAnonymous || !companyId || !storeId)
						return;

					return FirebaseApi.firestore.subscribeList({
						callback,
						collection: FirebaseAPI.firestore.getPath({
							collectionName: "favorite-products",
							companyId,
							storeId,
						}),
						where: [
							{ name: "userId", operator: "==", value: user.uid },
							{ name: "storeId", operator: "==", value: store.id },
							{ name: "companyId", operator: "==", value: company.id },
						],
					});
				},
			},
			getProfileOrganization: async () => {
				console.log("AAAAAAAAAAAAAAA2", profile, isValidUser, profile?.organizationId);
				if (!isValidUser || !profile?.organizationId) return;

				const res = await FirebaseApi.firestore.getV2<TOrganization>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "organizations",
						storeId,
						companyId,
					}),
					id: profile.organizationId,
				});
				console.log("AAAAAAAAAAAAAAA3", res);
				return res;
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
				if (
					!product ||
					!user ||
					!company ||
					!store ||
					user.isAnonymous ||
					!companyId ||
					!storeId
				)
					return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}
				return await FirebaseApi.firestore.setV2<any>({
					collection: FirebaseAPI.firestore.getPath({
						collectionName: "favorite-products",
						companyId,
						storeId,
					}),
					doc: {
						productId: product.id,
						userId: user.uid,
						storeId: store.id,
						companyId: company.id,
					},
				});
			},
			async removeProductToFavorite({ id }: { id: string }) {
				if (!id || !user || !company || !store || user.isAnonymous || !companyId || !storeId)
					return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}
				return await FirebaseApi.firestore.remove({
					collectionName: FirebaseAPI.firestore.getPath({
						collectionName: "favorite-products",
						companyId,
						storeId,
					}),
					id: id,
				});
			},
			async profileUpdate({ newProfile }: { newProfile: TProfile }) {
				try {
					if (!user || !store || !profile) return;
					if (user.isAnonymous && !allowAnonymousClients) {
						modalApi.openModal("authModal");
						return;
					}

					if (!isValidStoreData) return;

					await FirebaseApi.firestore.update(
						user.uid,
						newProfile,
						FirebaseAPI.firestore.getPath({
							collectionName: "profiles",
							storeId,
							companyId,
						})
					);
					logger({
						message: "profile updated",
						severity: "INFO",
						profile,
						newProfile,
					});
					return { success: true, data: profile };
				} catch (error) {
					return { success: false, error };
				}
			},
			async createPaymentLink({ order }: { order: TOrder }) {
				if (!user || !store || !order) return;
				if (user.isAnonymous && !allowAnonymousClients) {
					modalApi.openModal("authModal");
					return;
				}

				const payment: any = await FirebaseApi.api.createPayment({
					order: { ...order, client: undefined },
				});
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
					companyName: newUser.companyName ?? "",
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
					paymentType: "j5",
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
					userId: res.user?.uid,
					userEmail: newUser.email,
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
