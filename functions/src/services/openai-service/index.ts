import { logger } from "firebase-functions/v2";
import OpenAI from "openai";
import {
	FunctionTool,
	ResponseFunctionToolCallOutputItem,
} from "openai/resources/responses/responses";
import { AlgoliaService } from "../algolia-service";
import { createAppApi } from "../../appApi";

export class OpenAiService {
	private openai: OpenAI;
	private context: {
		companyId?: string;
		storeId?: string;
		cartId?: string;
		userId?: string;
		isAdmin?: boolean;
	};
	constructor(
		apiKey: string,
		context: {
			companyId?: string;
			storeId?: string;
			cartId?: string;
			userId?: string;
			isAdmin?: boolean;
		},
	) {
		this.context = context;
		this.generateText = this.generateText.bind(this);
		this.openai = new OpenAI({
			apiKey: apiKey,
		});
	}

	async generateText(prompt: string) {
		const tools = getChatbotTools();

		const appApi = createAppApi({
			companyId: this.context.companyId ?? "",
			storeId: this.context.storeId ?? "",
			cartId: this.context.cartId ?? "",
			userId: this.context.userId ?? "",
			isAdmin: this.context.isAdmin ?? false,
		});

		const algoliaService = new AlgoliaService();
		let input: unknown[] = [
			{ role: "system", content: buildChatbotSystemPrompt() },
			{ role: "user", content: prompt },
		];
		const handleToolCall = async (name: string, args: Record<string, unknown>) => {
			logger.info("handleToolCall", { name, args });
			let result: { success: boolean; data: any; error: string | null } = {
				success: false,
				data: null,
				error: "Unknown tool",
			};
			if (name === "query_products") {
				result = await algoliaService.queryProducts(args.query as string);
			}
			if (name === "add_products_to_cart") {
				const result = [];

				const { items } = args as { items: { query: string; quantity: number }[] };
				for (const item of items) {
					const productsResult = await algoliaService.queryProducts(item.query);
					const totalProducts = productsResult.data?.length ?? 0;
					if (!totalProducts || productsResult.error) {
						result.push({
							success: false,
							message: "No product found",
							item,
						});
					} else if (totalProducts > 1) {
						result.push({
							success: false,
							message: "Multiple products found",
							item,
							products: productsResult.data,
						});
					} else if (totalProducts === 1 && productsResult.data) {
						await appApi.cart.addItem({
							product: productsResult.data[0],
							cartId: this.context.cartId ?? "",
						});
						result.push({
							success: true,
							message: "Product added to cart",
							item,
							product: productsResult.data[0],
						});
					}
				}
				return {
					success: true,
					data: JSON.stringify(result),
					error: null,
				};
			}
			return result;
		};

		const maxToolRounds = 10;

		let response = await this.openai.responses.create({
			model: "gpt-4o-mini",
			input: input as Parameters<OpenAI["responses"]["create"]>[0]["input"],
			tools,
		});

		let round = 0;
		while (hasFunctionCalls(response.output) && round < maxToolRounds) {
			round += 1;
			input = [...input, ...response.output];

			for (const item of response.output as Array<{
				type: string;
				call_id?: string;
				name?: string;
				arguments?: string;
			}>) {
				if (item.type !== "function_call") continue;

				const args = parseToolCallArgs(item.arguments ?? "{}");
				const output = await handleToolCall(item.name ?? "", args);

				logger.info("handleToolCall output", { output, args });

				input.push({
					type: "function_call_output",
					id: `fc_${item.call_id!}`,
					status: "completed",
					call_id: item.call_id!,
					output: JSON.stringify(output),
				} as ResponseFunctionToolCallOutputItem);
			}

			response = await this.openai.responses.create({
				model: "gpt-4o-mini",
				input: input as Parameters<OpenAI["responses"]["create"]>[0]["input"],
				tools,
			});
		}

		if (round >= maxToolRounds && hasFunctionCalls(response.output)) {
			logger.warn("Tool call loop stopped: max rounds reached", { maxToolRounds });
		}

		return {
			content: response.output_text ?? null,
		};
	}
}

const CHATBOT_TOOLS: FunctionTool[] = [
	{
		strict: true,
		type: "function" as const,
		name: "add_products_to_cart",
		description: "allow user to add multiple products to cart at once,from user input",
		parameters: {
			type: "object",
			properties: {
				items: {
					type: "array",
					minItems: 1,
					items: {
						type: "object",
						properties: {
							query: {
								type: "string",
								description: "user product phrase",
							},
							quantity: {
								type: "integer",
								minimum: 1,
								description:
									"Number of units. Default 1. Use 1 when words like 'שישית' or 'שישייה' are part of the product name.",
							},
						},
						required: ["query", "quantity"],
						additionalProperties: false,
					},
				},
			},
			required: ["items"],
			additionalProperties: false,
		},
	},
	{
		strict: false,
		name: "query_products",
		type: "function",
		description:
			"search products by query for get product details used when user ask about details of specific product",
		parameters: {
			type: "object" as const,
			properties: {
				query: {
					type: "string" as const,
					description: "Search query: product name or part of it",
				},
			},
			required: ["query"],
			additionalProperties: false,
		},
	},
];

function getChatbotTools() {
	return CHATBOT_TOOLS;
}

function hasFunctionCalls(output: Array<{ type: string }>): boolean {
	return output.some((item) => item.type === "function_call");
}

function parseToolCallArgs(argumentsString: string): Record<string, unknown> {
	try {
		return JSON.parse(argumentsString) as Record<string, unknown>;
	} catch {
		logger.warn("Invalid function_call arguments", { argumentsString });
		return {};
	}
}

function buildChatbotSystemPrompt() {
	return `
	You are StoreBot, the official assistant for [Your Store Name].

	Help customers with products, cart, orders, and store policies

	## Adding to cart tool call
	when user add products to cart, use add_products_to_cart tool to add products to cart
	if u detect multiple products in user input that need be added to cart,
	make 1 tool call to add_products_to_cart tool with all products to add to cart

	## Query products tool call
	when user ask about details of specific product, use query_products tool to get product details
	if u detect multiple products in user input that need be added to cart,
	if there is many products in user input, make 1 tool call to query_products tool for each product

	## Unclear requests
	- Never respond with "I can’t help" as a first answer.
	- Ask ONE short clarification question or suggest close matches.
	- Only suggest contacting support after clarification fails.

	## General
	- Never invent products, prices, availability, or policies.
	- Be friendly, concise, and helpful.
	- Do not answer questions unrelated to the store.

`;
}
