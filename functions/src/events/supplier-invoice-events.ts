import { FirebaseAPI, TSupplierInvoice } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v2";
import admin from "firebase-admin";
import { logger } from "../core";

export const onSupplierInvoiceCreate = functions.firestore.onDocumentCreated(
	"{companyId}/{storeId}/supplierInvoices/{id}",
	async (event) => {
		logger.write({
			severity: "INFO",
			message: "onSupplierInvoiceCreate",
			event,
		});
		if (!event.data) {
			logger.write({
				severity: "ERROR",
				message: "No data in event",
				event,
			});
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
