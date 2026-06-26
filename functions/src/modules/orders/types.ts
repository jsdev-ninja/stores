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

export type CreateOrderParams = {
	order: TOrder;
	companyId: string;
	storeId: string;
	actorId?: string;
};

export type UpdateOrderParams = {
	orderId: string;
	updates: Partial<TOrder>;
	companyId: string;
	storeId: string;
	actorId?: string;
};
