import { TStore } from "src/domains/Store";

export const RENDER_CONFIG: Record<TStore["id"], { productCard: boolean }> = {
	"tester-store": {
		productCard: false,
	},
} as const;
