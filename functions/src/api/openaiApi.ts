import { defineSecret } from "firebase-functions/params";
import { logger } from "../core";
import { OpenAiService } from "../services/openai-service";
import * as functionsV2 from "firebase-functions/v2";

export const openAiAPi = functionsV2.https.onCall(
	{
		memory: "1GiB",
		timeoutSeconds: 540,
		invoker: "public",
	},
	async (request) => {
		try {
			const { data, auth } = request;

			logger.write({
				severity: "INFO",
				message: "openAiAPi request",
				data,
				auth,
			});

			const companyId = auth?.token.companyId;
			const storeId = auth?.token.storeId;
			const userId = auth?.uid;
			const isAdmin = auth?.token.admin;

			const { prompt, context } = data as { prompt: string; context: { cartId?: string } };

			const openAiService = new OpenAiService(defineSecret("OPENAI_API_KEY").value(), {
				companyId,
				storeId,
				userId,
				isAdmin,
				cartId: context?.cartId ?? "",
			});
			logger.write({
				severity: "INFO",
				message: "openAiAPi",
				data,
			});
			const response = await openAiService.generateText(prompt);
			logger.write({
				severity: "INFO",
				message: "openAiAPi response",
				response,
			});
			return response;
		} catch (error) {
			logger.write({
				severity: "ERROR",
				message: "openAiAPi error",
				error,
			});
			throw error;
		}
	},
);
