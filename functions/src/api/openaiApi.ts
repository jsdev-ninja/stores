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
		const { data } = request;

		const openAiService = new OpenAiService(defineSecret("OPENAI_API_KEY").value());
		logger.write({
			severity: "INFO",
			message: "openAiAPi",
			data,
		});
		const { prompt } = data;
		const response = await openAiService.generateText(prompt);
		logger.write({
			severity: "INFO",
			message: "openAiAPi response",
			response,
		});
		return response;
	},
);
