import admin from "firebase-admin";
import { logger } from "../core";
import { FirebaseAPI, TOrder, TStore } from "@jsdev_ninja/core";
import { ezCountService } from "src/services/ezCountService";
import { TStorePrivate } from "src/schema";
import { documentsService } from "src/services/documents";
import { renderDeliveryNoteToHTML } from "src/services/documents/renderToHTML";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

type TContext = {
	storeId: string;
	companyId: string;
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
	const { storeId, companyId } = context;

	return {
		documents: {
			createDeliveryNote: async (order: TOrder) => {
				try {
					const date = new Date();

					const store = await getStoreData(storeId);
					const storePrivateData = await getStorePrivateData(storeId);

					const res = await ezCountService.createDeliveryNote(order, {
						ezcount_key: storePrivateData.ezcount_key,
						clientName: order.nameOnInvoice ?? "",
						clientEmail: order.client.email,
						ezcount_api: storePrivateData.ezcount_api,
						date: formatDateDDMMYYYY(date.toLocaleDateString()),
					});
					if (res.data?.success) {
						const html = renderDeliveryNoteToHTML({
							order,
							store,
							deliveryNoteNumber: res.data?.doc_number,
							deliveryNoteDate: formatDateDDMMYYYY(date.toLocaleDateString()),
						});

						const pdf = await documentsService.createDocumentPdf({ html });
						const path = `${companyId}/${storeId}/deliveryNotes/${res.data.doc_number}`;
						const storage = getStorage();
						const storageRef = ref(storage, path);

						// 'file' comes from the Blob or File API
						const snapshot = await uploadBytes(storageRef, pdf, {
							contentType: "application/pdf",
						});
						console.log("Uploaded a blob or file!", snapshot);
						const url = await getDownloadURL(snapshot.ref);

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
								})
							)
							.doc(order.id)
							.update(newOrder);
						console.log("order updated with delivery note", order.id);
						return { success: true, error: null };
					} else {
						logger.write({
							severity: "ERROR",
							message:
								"error creating delivery note (failed to create delivery note in ezcount)",
							orderId: order.id,
							storeId: storeId,
							companyId: companyId,
							error: res.error,
						});
						return { success: false, error: res.error as Error };
					}
				} catch (error) {
					logger.write({
						severity: "ERROR",
						message: "error creating delivery note",
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
							FirebaseAPI.firestore.getPath({ collectionName: "cart", companyId, storeId })
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
