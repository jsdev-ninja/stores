import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { logger } from "firebase-functions/v2";
import { AlgoliaService } from "../algolia-service";
import { createAppApi } from "../../appApi";

export type ChatHistoryItem = {
	role: "user" | "bot";
	text: string;
};

type GenkitServiceContext = {
	companyId?: string;
	storeId?: string;
	cartId?: string;
	userId?: string;
	isAdmin?: boolean;
};

export class GenkitChatService {
	private context: GenkitServiceContext;
	private apiKey: string;

	constructor(apiKey: string, context: GenkitServiceContext) {
		this.apiKey = apiKey;
		this.context = context;
	}

	async generateText(prompt: string, history: ChatHistoryItem[] = []) {
		if (!this.context.companyId || !this.context.storeId) {
			logger.warn("GenkitChatService missing store/company context", {
				companyId: this.context.companyId,
				storeId: this.context.storeId,
			});
			return { content: "Missing store context. Please refresh and try again." };
		}

		if (!prompt || !prompt.trim()) {
			return { content: null };
		}

		const ai = genkit({
			plugins: [googleAI({ apiKey: this.apiKey })],
			model: "googleai/gemini-2.0-flash",
		});

		const algoliaService = new AlgoliaService({
			storeId: this.context.storeId,
			companyId: this.context.companyId,
		});

		const appApi = createAppApi({
			companyId: this.context.companyId ?? "",
			storeId: this.context.storeId ?? "",
			cartId: this.context.cartId ?? "",
			userId: this.context.userId ?? "",
			isAdmin: this.context.isAdmin ?? false,
		});

		const cartId = this.context.cartId ?? "";

		const queryProductsTool = ai.defineTool(
			{
				name: "query_products",
				description:
					"Search products by query. Use when user asks about details of a specific product.",
				inputSchema: z.object({
					query: z.string().describe("Product name or search phrase"),
				}),
				outputSchema: z.any(),
			},
			async ({ query }) => {
				logger.info("query_products tool called", { query });
				const result = await algoliaService.queryProducts(query);
				logger.info("query_products result", { count: result.data?.length ?? 0 });
				return result;
			},
		);

		const manageCartTool = ai.defineTool(
			{
				name: "manage_cart",
				description:
					"Manage cart by adding, removing, or updating product quantities. Make ONE call for all cart changes in a single user request.",
				inputSchema: z.object({
					items: z
						.array(
							z.object({
								action: z
									.enum(["add", "remove", "update_amount"])
									.describe(
										"add=increment quantity, remove=decrement quantity, update_amount=set final quantity (0 removes product)",
									),
								query: z.string().describe("Product name or phrase to search"),
								quantity: z
									.number()
									.int()
									.min(0)
									.describe("Quantity value for the action"),
							}),
						)
						.min(1),
				}),
				outputSchema: z.any(),
			},
			async ({ items }) => {
				logger.info("manage_cart tool called", { items });

				if (!cartId) {
					return {
						success: false,
						error: "No active cart found. User must be logged in with an active cart to manage items.",
					};
				}

				const results = [];

				for (const item of items) {
					const productsResult = await algoliaService.queryProducts(item.query);
					const totalProducts = productsResult.data?.length ?? 0;

					if (!totalProducts || productsResult.error) {
						results.push({ success: false, message: "No product found", item });
						continue;
					}
					if (totalProducts > 1) {
						results.push({
							success: false,
							message: "Multiple products found - please be more specific",
							item,
							products: productsResult.data,
						});
						continue;
					}

					const product = productsResult.data![0];
					let cartResult: { success: boolean; error: unknown } = {
						success: false,
						error: "Unsupported action",
					};

					if (item.action === "add") {
						cartResult = await appApi.cart.addItem({
							product,
							cartId,
							amount: item.quantity,
						});
					} else if (item.action === "remove") {
						cartResult = await appApi.cart.removeItem({
							productId: product.id,
							cartId,
							amount: item.quantity,
						});
					} else if (item.action === "update_amount") {
						cartResult = await appApi.cart.updateItemAmount({
							productId: product.id,
							cartId,
							amount: item.quantity,
						});
					}

					results.push(
						cartResult.success
							? {
									success: true,
									message: `Product ${item.action} completed`,
									item,
									product,
								}
							: {
									success: false,
									message: `Failed to ${item.action} product`,
									item,
									product,
									error: cartResult.error,
								},
					);
				}

				logger.info("manage_cart results", { results });
				return { success: true, data: results };
			},
		);

		// Convert frontend history (role: "bot") to Genkit format (role: "model")
		const genkitHistory = history.map((msg) => ({
			role: msg.role === "user" ? ("user" as const) : ("model" as const),
			content: [{ text: msg.text }],
		}));

		logger.info("GenkitChatService.generateText", {
			prompt,
			historyLength: genkitHistory.length,
		});

		const response = await ai.generate({
			system: buildChatbotSystemPrompt(),
			messages: genkitHistory,
			prompt,
			tools: [queryProductsTool, manageCartTool],
		});

		return { content: response.text ?? null };
	}
}

function buildChatbotSystemPrompt(): string {
	return `
You are StoreBot, the official assistant for this online store.

Help customers with products, cart management, orders, and store policies.

## Cart Management
Use manage_cart for add, remove, and update quantity requests.
If user asks for multiple cart changes, make ONE manage_cart call with all items.
Actions:
- add: increase quantity in cart
- remove: decrease quantity in cart
- update_amount: set final quantity (0 removes product)

## Product Search
Use query_products when user asks about details of a specific product.

## Unclear Requests
- Never respond with "I can't help" as a first answer.
- Ask ONE short clarification question or suggest close matches.
- Only suggest contacting support after clarification fails.

## General Rules
- Never invent products, prices, availability, or policies.
- Be friendly, concise, and helpful.
- Do not answer questions unrelated to the store.
- Keep responses brief and actionable.
`;
}
