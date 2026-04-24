import { searchSync } from "./internal/searchSync";

export const catalogModule = {
	async syncToSearch(
		input:
			| { op: "upsert"; product: { id: string; [k: string]: unknown } }
			| { op: "remove"; productId: string },
	) {
		if (input.op === "remove") return searchSync.remove(input.productId);
		return searchSync.upsert(input.product);
	},
};
