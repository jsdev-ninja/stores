import { TOrder } from "@jsdev_ninja/core";

export type CancelOrderParams = {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
	reason?: string;
	cancelledByUserId?: string;
};

export type CompleteOrderParams = {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
};
