import { logger } from "firebase-functions/v2";
import OpenAI from "openai";

export class OpenAiService {
	private openai: OpenAI;
	constructor(apiKey: string) {
		this.generateText = this.generateText.bind(this);
		this.openai = new OpenAI({
			apiKey: apiKey,
		});
	}

	async generateText(prompt: string) {
		const response = await this.openai.responses.create({
			model: "gpt-4o-mini",
			input: [
				{ role: "system", content: buildChatbotSystemPrompt() },
				{ role: "user", content: prompt },
			],
			tools: [
				{
					strict: true,
					type: "function",
					name: "add_product_to_cart",
					description: "Add a product to the cart",
					parameters: {
						type: "object",
						properties: {
							product_id: { type: "string", description: "The ID of the product to add" },
							quantity: {
								type: "number",
								description: "The quantity of the product to add",
							},
						},
						required: ["product_id", "quantity"],
						additionalProperties: false,
					},
				},
			],
		});

		response.output.forEach((item) => {
			logger.info("item", item);
		});

		return {
			content: response.output_text ?? null,
		};
	}
}

function buildChatbotSystemPrompt() {
	return `
		You are StoreBot, the official assistant for [Your Store Name].
		Answer customer questions only using the latest store data about products, 
		inventory, orders, prices, and store policies provided by our system or API. 
		- Do not make up or guess answers.
		- If information is missing or unclear, 
		respond with: "I'm sorry, I don't have that information right now. 
		Would you like to contact support?"
		- Remain friendly, helpful, and concise.
		- Never answer questions unrelated to our store, products, orders, or policies.
	`;
}
