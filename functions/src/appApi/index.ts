import admin from "firebase-admin";
import { logger } from "../core";
import { FirebaseAPI } from "@jsdev_ninja/core";

type TContext = {
	storeId: string;
	companyId: string;
};

export function createAppApi(context: TContext) {
	const { storeId, companyId } = context;

	return {
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
