import { FirebaseAPI } from "@jsdev_ninja/core";
import admin from "firebase-admin";
import * as functions from "firebase-functions/v2";

export const onSupplierInvoiceCreate = functions.firestore.onDocumentCreated(
	FirebaseAPI.firestore.getPath({ collectionName: "supplierInvoices" }),
	async (snap, context) => {
		const supplierInvoice = snap.data() as TSupplierInvoice;
		console.log("supplier invoice create", supplierInvoice);
	}
);
