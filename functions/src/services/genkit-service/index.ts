import { AsyncLocalStorage } from "async_hooks";
import { genkit, z } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { logger } from "firebase-functions/v2";
import { AlgoliaService } from "../algolia-service";
import { createAppApi, getChatbotConfig } from "../../appApi";

export type ChatHistoryItem = {
	role: "user" | "bot";
	text: string;
};

type RequestContext = {
	companyId: string;
	storeId: string;
	cartId: string;
	userId?: string;
	isAdmin?: boolean;
};

// Per-request context store — thread-safe for concurrent Cloud Function invocations
const requestStore = new AsyncLocalStorage<RequestContext>();

// Single ai instance at module level — avoids cold-start cost on warm instances
const ai = genkit({
	plugins: [vertexAI({ location: "us-central1" })],
	model: vertexAI.model("gemini-2.5-flash"),
});

// Tools defined once at module level — fixes "already has entry in registry" overwrite error
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
		const ctx = requestStore.getStore()!;
		const algoliaService = new AlgoliaService({
			storeId: ctx.storeId,
			companyId: ctx.companyId,
		});
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
						quantity: z.number().int().min(0).describe("Quantity value for the action"),
					}),
				)
				.min(1),
		}),
		outputSchema: z.any(),
	},
	async ({ items }) => {
		const ctx = requestStore.getStore()!;
		logger.info("manage_cart tool called", { items, cartId: ctx.cartId });

		if (!ctx.userId) {
			return {
				success: false,
				error: "User must be logged in to manage cart items.",
			};
		}

		const algoliaService = new AlgoliaService({
			storeId: ctx.storeId,
			companyId: ctx.companyId,
		});

		const appApi = createAppApi({
			companyId: ctx.companyId,
			storeId: ctx.storeId,
			cartId: ctx.cartId,
			userId: ctx.userId,
			isAdmin: ctx.isAdmin ?? false,
		});

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
					cartId: ctx.cartId,
					amount: item.quantity,
				});
			} else if (item.action === "remove") {
				cartResult = await appApi.cart.removeItem({
					productId: product.id,
					cartId: ctx.cartId,
					amount: item.quantity,
				});
			} else if (item.action === "update_amount") {
				cartResult = await appApi.cart.updateItemAmount({
					productId: product.id,
					cartId: ctx.cartId,
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

export class GenkitChatService {
	private context: RequestContext;

	constructor(context: RequestContext) {
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

		const genkitHistory = history.map((msg) => ({
			role: msg.role === "user" ? ("user" as const) : ("model" as const),
			content: [{ text: msg.text }],
		}));

		logger.info("GenkitChatService.generateText", {
			prompt,
			historyLength: genkitHistory.length,
		});

		const chatbotConfig = await getChatbotConfig(this.context.storeId);

		// Run inside AsyncLocalStorage context so tools can safely read per-request data
		return requestStore.run(this.context, async () => {
			const response = await ai.generate({
				system: buildChatbotSystemPrompt(chatbotConfig?.storeContext),
				messages: genkitHistory,
				prompt,
				tools: [queryProductsTool, manageCartTool],
			});

			return { content: response.text ?? null };
		});
	}
}

function buildChatbotSystemPrompt(storeContext?: string): string {
	const contextSection = storeContext?.trim()
		? `\n## Store Information\n${storeContext.trim()}\n`
		: "";

	return `
You are StoreBot, the official assistant for this online store.
${contextSection}
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
