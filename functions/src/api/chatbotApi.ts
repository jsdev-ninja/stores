import { defineSecret } from "firebase-functions/params";
import { logger } from "../core";
import { GenkitChatService, ChatHistoryItem } from "../services/genkit-service";
import * as functionsV2 from "firebase-functions/v2";

const googleAiApiKey = defineSecret("GOOGLE_GENAI_API_KEY");

export const chatbotApi = functionsV2.https.onCall(
	{
		memory: "1GiB",
		timeoutSeconds: 540,
		invoker: "public",
		secrets: [googleAiApiKey],
	},
	async (request) => {
		try {
			const { data, auth } = request;

			logger.write({
				severity: "INFO",
				message: "chatbotApi request",
				data,
			});

			const userId = auth?.uid;
			const isAdmin = auth?.token.admin;

			const { prompt, history, context } = data as {
				prompt: string;
				history?: ChatHistoryItem[];
				context: { cartId?: string; storeId?: string; companyId?: string };
			};

			const companyId = auth?.token.companyId ?? context?.companyId;
			const storeId = auth?.token.storeId ?? context?.storeId;

			if (!companyId || !storeId) {
				logger.write({
					severity: "WARNING",
					message: "chatbotApi missing store/company context",
					authCompanyId: auth?.token.companyId,
					authStoreId: auth?.token.storeId,
					requestCompanyId: context?.companyId,
					requestStoreId: context?.storeId,
				});
				return { content: "Missing store context. Please refresh and try again." };
			}

			const service = new GenkitChatService(googleAiApiKey.value(), {
				companyId,
				storeId,
				userId,
				isAdmin,
				cartId: context?.cartId ?? "",
			});

			logger.write({
				severity: "INFO",
				message: "chatbotApi calling GenkitChatService",
				companyId,
				storeId,
				userId,
				cartId: context?.cartId ?? "",
				historyLength: history?.length ?? 0,
			});

			const response = await service.generateText(prompt, history ?? []);

			logger.write({
				severity: "INFO",
				message: "chatbotApi response",
				contentLength: response.content?.length ?? 0,
			});

			return response;
		} catch (error) {
			logger.write({
				severity: "ERROR",
				message: "chatbotApi error",
				error,
			});
			throw error;
		}
	},
);
