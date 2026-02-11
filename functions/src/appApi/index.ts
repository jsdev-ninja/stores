import admin from "firebase-admin";
import { logger } from "../core";
import { FirebaseAPI, TCart, TOrder, TOrganization, TProduct, TStore } from "@jsdev_ninja/core";
import { ezCountService } from "../services/ezCountService";
import { TStorePrivate } from "src/schema";
import { documentsService } from "../services/documents";
import { renderDeliveryNoteToHTML } from "../services/documents/renderToHTML";

type TContext = {
	storeId: string;
	companyId: string;
	userId?: string;
	isAdmin?: boolean;
	cartId?: string;
};

function formatDateDDMMYYYY(input: string) {
	const d = new Date(input);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
}
async function getStorePrivateData(storeId: string) {
	return (
		await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
	).data() as TStorePrivate;
}

async function getStoreData(storeId: string) {
	return (await admin.firestore().collection(`STORES`).doc(storeId).get()).data() as TStore;
}

export function createAppApi(context: TContext) {
	const { storeId, companyId, userId, isAdmin } = context;

	return {
		payments: {
			trackPaymentCompleted: async (order: TOrder) => {
				try {
					logger.write({
						severity: "INFO",
						message: "track payment completed",
						orderId: order.id,
						storeId: storeId,
						companyId: companyId,
						order,
					});
					// save revenue
				} catch (error: any) {
					logger.write({
						severity: "ERROR",
						message: "error tracking payment completed",
						orderId: order.id,
						storeId: storeId,
						companyId: companyId,
						order,
						error,
					});
				}
			},
		},
		documents: {
			createDeliveryNote: async (
				order: TOrder,
				options?: { date?: number; sendEmailToClient?: boolean; nameOnInvoice?: string },
			) => {
				try {
					const date = options?.date ? new Date(options.date) : new Date();
					const sendEmailToClient = options?.sendEmailToClient ?? true;
					const store = await getStoreData(storeId);
					const storePrivateData = await getStorePrivateData(storeId);

					let organization: TOrganization | null = null;
					if (order.organizationId) {
						const organizationSnapshot = await admin
							.firestore()
							.collection(
								FirebaseAPI.firestore.getPath({
									collectionName: "organizations",
									companyId,
									storeId,
								}),
							)
							.doc(order.organizationId)
							.get();
						organization = organizationSnapshot.data() as TOrganization;
					}

					logger.write({
						severity: "INFO",
						message: "organization",
						organization,
						storePrivateData,
						store,
						order,
					});

					const res = await ezCountService.createDeliveryNote(order, {
						ezcount_key: storePrivateData.ezcount_key,
						ezcount_api: storePrivateData.ezcount_api,
						clientName: options?.nameOnInvoice ?? order.nameOnInvoice ?? "",
						clientEmail: order.client?.email ?? "",
						date: formatDateDDMMYYYY(date.toLocaleDateString()),
						isVatIncludedInPrice:
							order.storeOptions?.isVatIncludedInPrice ?? store.isVatIncludedInPrice,
						sendEmailToClient,
					});

					logger.write({
						severity: "INFO",
						message: "createDeliveryNote result",
						result: res,
					});
					if (res.data?.success && res.data?.doc_number) {
						const html = renderDeliveryNoteToHTML({
							order,
							organization,
							store,
							deliveryNoteNumber: res.data?.doc_number,
							deliveryNoteDate: formatDateDDMMYYYY(date.toLocaleDateString()),
						});

						logger.write({
							severity: "INFO",
							message: "createDeliveryNote html",
							html,
						});

						const pdf = await documentsService.createDocumentPdf({ html });

						logger.write({
							severity: "INFO",
							message: "createDeliveryNote pdf",
							pdf,
						});

						const path = `${companyId}/${storeId}/deliveryNotes/${res.data.doc_number}`;
						const bucket = admin.storage().bucket();
						const file = bucket.file(path);

						// Upload the PDF buffer to Firebase Storage
						await file.save(pdf, {
							metadata: {
								contentType: "application/pdf",
							},
							contentType: "application/pdf",
							predefinedAcl: "publicRead",
						});

						logger.write({
							severity: "INFO",
							message: "createDeliveryNote path",
							path,
						});

						// Make the file publicly accessible (if not already)
						await file.makePublic();

						// Get public URL (never expires since file is public)
						const url = file.publicUrl();

						const newOrder: TOrder = {
							...order,
							ezDeliveryNote: { ...res.data, date: date.getTime() },
							deliveryNote: {
								createdAt: date.getTime(),
								date: date.getTime(),
								id: res.data.doc_number,
								number: res.data.doc_number,
								status: "pending",
								link: url,
								// clientDetails: {
								// 	name: order.nameOnInvoice ?? "",
								// 	address: order.client.address?.street ?? "",
								// 	phone: order.client.phoneNumber ?? "",
								// 	email: order.client.email ?? "",

								// },
								// companyDetails: {
								// 	name: store.name,
								// 	address: store.address?.street ?? "",
								// 	phone: store.phoneNumber		 ?? "",
								// 	email: store.email ?? "",
								// },
								items: order.cart.items.map((item) => ({
									name: item.product.name[0].value,
									price: item.product.price,
									quantity: item.amount,
									total: item.product.price * item.amount,
								})),
								total: order.cart.cartTotal,
								vat: order.cart.cartVat,
							},
						};
						// update order details with delivery
						await admin
							.firestore()
							.collection(
								FirebaseAPI.firestore.getPath({
									collectionName: "orders",
									companyId,
									storeId,
								}),
							)
							.doc(order.id)
							.update(newOrder);
						console.log("order updated with delivery note", order.id);
						return { success: true, error: null };
					} else {
						logger.write({
							severity: "ERROR",
							message: `error creating delivery note (failed to create delivery note in ezcount (error: ${res.error?.message}))`,
							orderId: order.id,
							storeId: storeId,
							companyId: companyId,
							error: (res.error as any)?.message,
							res,
						});
						return {
							success: false,
							error: res.error,
						};
					}
				} catch (error: any) {
					logger.write({
						severity: "ERROR",
						message: `error creating delivery note: ${error?.message}`,
						orderId: order.id,
						storeId: storeId,
						companyId: companyId,
						error,
					});
					return { success: false, error: error as Error };
				}
			},
		},
		cart: {
			async addItem({ product, cartId }: { product: TProduct; cartId: string }) {
				try {
					logger.write({
						severity: "INFO",
						message: "add item to cart",
						product,
						storeId: storeId,
						companyId: companyId,
					});
					const cart = await admin
						.firestore()
						.collection(
							FirebaseAPI.firestore.getPath({ collectionName: "cart", companyId, storeId }),
						)
						.doc(cartId)
						.get();
					if (!cart.exists) {
						return { success: false, error: "Cart not found" };
					}
					const cartData = cart.data() as TCart;
					const cartItems = cartData.items;
					const productIndex = cartItems.findIndex((item) => item.product.id === product.id);
					if (productIndex !== -1) {
						cartItems[productIndex].amount += 1;
					} else {
						cartItems.push({
							product,
							amount: 1,
						});
					}
					await admin
						.firestore()
						.collection(
							FirebaseAPI.firestore.getPath({ collectionName: "cart", companyId, storeId }),
						)
						.doc(cartId)
						.update({
							items: cartItems,
						});
					return { success: true, error: null };
				} catch (error: any) {
					logger.write({
						severity: "ERROR",
						message: "error adding item to cart error: " + error?.message,
						product,
						storeId: storeId,
						companyId: companyId,
					});
					return { success: false, error: error as Error };
				}
			},
			close: async (cartId: string) => {
				try {
					logger.write({
						severity: "INFO",
						message: "mark cart as completed",
						cartId,
						storeId: storeId,
						companyId: companyId,
					});
					await admin
						.firestore()
						.collection(
							FirebaseAPI.firestore.getPath({ collectionName: "cart", companyId, storeId }),
						)
						.doc(cartId)
						.update({
							status: "completed",
						});
					return { success: true, error: null };
				} catch (error) {
					logger.write({
						severity: "ERROR",
						message: "error marking cart as completed",
						cartId,
						storeId: storeId,
						companyId: companyId,
						error,
					});
					return { success: false, error: error as Error };
				}
			},
		},
	};
}
