import { FirebaseAPI, TSupplierInvoice } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v2";
import admin from "firebase-admin";
import { logger } from "../../../core";

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

		// Drafts are work-in-progress and must NOT touch product prices. Prices are
		// only applied once the invoice is finalized (status "completed" / legacy
		// invoices with no status keep the original behavior).
		if (supplierInvoice.status === "draft") {
			logger.write({
				severity: "INFO",
				message: "onSupplierInvoiceCreate: skipping draft, no product price update",
				event,
			});
			return;
		}

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
