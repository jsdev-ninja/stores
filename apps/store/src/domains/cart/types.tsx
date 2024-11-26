import { TProduct } from "@jsdev_ninja/core";

export type TCart = {
	type: "Cart";
	id: string;
	companyId: string;
	storeId: string;
	userId: string;
	status: "active" | "draft" | "completed";
	items: Array<{ product: TProduct; amount: number }>;
};
