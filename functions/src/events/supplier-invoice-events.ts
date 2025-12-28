import { FirebaseAPI, TSupplierInvoice } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v2";
import admin from "firebase-admin";

export const onSupplierInvoiceCreate = functions.firestore.onDocumentCreated(
	"{companyId}/{storeId}/supplier-invoices/{id}",
	async (event) => {
		if (!event.data) {
			console.error("No data in event");
			return;
		}
		const { companyId, storeId, id } = event.params;
		const supplierInvoice = event.data.data() as TSupplierInvoice;
		console.log("supplier invoice create", supplierInvoice, { companyId, storeId, id });

		const batch = admin.firestore().batch();

		for (const productToUpdate of supplierInvoice.productsToUpdate) {
			const productRef = admin
				.firestore()
				.collection(
					FirebaseAPI.firestore.getPath({ collectionName: "products", companyId, storeId })
				)
				.doc(productToUpdate.sku);
			batch.update(productRef, {
				purchasePrice: productToUpdate.newPurchasePrice,
				price: productToUpdate.newPrice,
				profitPercentage: productToUpdate.newProfitPercentage,
			});
		}
		await batch.commit();
	}
);
