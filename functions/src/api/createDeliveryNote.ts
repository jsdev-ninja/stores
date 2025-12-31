import * as functionsV2 from "firebase-functions/v2";
import { createAppApi } from "../appApi";
import { TOrder } from "@jsdev_ninja/core";

type TData = {
	order: TOrder;
	options?: { date?: number; sendEmailToClient?: boolean; nameOnInvoice?: string };
};

export const createDeliveryNote = functionsV2.https.onCall<TData, void>(
	{
		memory: "1GiB",
		timeoutSeconds: 540,
		invoker: "public",
	},
	async (request) => {
		const { data, auth } = request;
		const { order, options } = data;

		functionsV2.logger.write({
			severity: "INFO",
			message: "createDeliveryNote",
			orderId: order.id,
			options,
		});

		const companyId = auth?.token.companyId;
		const storeId = auth?.token.storeId;

		if (!companyId || !storeId) {
			throw new functionsV2.https.HttpsError(
				"failed-precondition",
				"Missing companyId or storeId in auth token"
			);
		}

		const appApi = createAppApi({ storeId, companyId });

		const result = await appApi.documents.createDeliveryNote(order, options);

		if (!result.success) {
			throw new functionsV2.https.HttpsError(
				"internal",
				result.error?.message || "Failed to create delivery note"
			);
		}

		return {
			success: true,
		};
	}
);
