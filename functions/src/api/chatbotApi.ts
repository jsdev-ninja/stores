import { logger } from "../core";
import { GenkitChatService, ChatHistoryItem } from "../services/genkit-service";
import * as functionsV2 from "firebase-functions/v2";

export const chatbotApi = functionsV2.https.onCall(
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

			const service = new GenkitChatService({
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
			const isQuotaError =
				error instanceof Error &&
				(error.message.includes("429") ||
					error.message.includes("Too Many Requests") ||
					error.message.includes("quota"));

			logger.write({
				severity: isQuotaError ? "WARNING" : "ERROR",
				message: isQuotaError ? "chatbotApi quota exceeded" : "chatbotApi error",
				error,
			});

			if (isQuotaError) {
				return { content: "The assistant is temporarily unavailable. Please try again in a moment." };
			}

			throw error;
		}
	},
);
