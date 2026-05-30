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

export { onProductCreate, onProductDelete, onProductUpdate } from "./triggers/product";

// Admin write endpoints — exported here for future wiring; NOT re-exported from root index.tsx
export { saveProduct } from "./api/saveProduct";
export { deleteProduct } from "./api/deleteProduct";
export { createCategory } from "./api/createCategory";
export { updateCategories } from "./api/updateCategories";
