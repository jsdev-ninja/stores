import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { Button } from "src/components/button";
import { TOrder } from "src/domains/Order";
import { navigate } from "src/navigation";
import { ChipProps, Chip } from "@nextui-org/react";

function AdminOrdersPages() {
	const appApi = useAppApi();

	const [orders, setOrders] = useState<TOrder[]>([]);

	function updateOrder(id: string, status: TOrder["status"]) {
		setOrders((orders) =>
			orders.map((order) => (order.id === id ? { ...order, status: status } : order))
		);
	}

	useEffect(() => {
		appApi.orders.list().then((res) => {
			if (!res) {
				return;
			}
			setOrders(res.data as TOrder[]);
		});
	}, [appApi.orders]);

	console.log("orders", orders);

	return (
		<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
				<div className="mx-auto">
					<div className="mt-6 flow-root sm:mt-8">
						<div className="divide-y divide-gray-200 dark:divide-gray-700">
							{orders.map((order) => {
								return <OrderRow key={order.id} order={order} updateOrder={updateOrder} />;
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function OrderRow({
	order,
	updateOrder,
}: {
	order: TOrder;
	updateOrder: (id: string, status: TOrder["status"]) => void;
}) {
	const { t } = useTranslation(["common", "ordersPage"]);

	const appApi = useAppApi();

	const chipColors: Record<TOrder["status"], ChipProps["color"]> = {
		pending: "default",
		processing: "secondary",
		canceled: "danger",
		refunded: "danger",
		completed: "success",
		delivered: "primary",
	};

	function orderMainAction() {
		if (order.status === "delivered") {
			return (
				<>
					<Button
						onClick={async () => {
							const res = await appApi.admin.orderPaid({ order });
							if (!res?.success) {
								// todo:
								return;
							}
							updateOrder(order.id, "completed");
						}}
					>
						{t("ordersPage:actions.paidOrder")}
					</Button>
				</>
			);
		}
		if (order.status === "processing") {
			return (
				<>
					<Button
						color="primary"
						onClick={async () => {
							const res = await appApi.admin.orderDelivered({ order });
							if (!res?.success) {
								// todo:
								return;
							}
							updateOrder(order.id, "delivered");
						}}
					>
						{t("ordersPage:actions.deliveredOrder")}
					</Button>
					<Button type="button">{t("ordersPage:actions.cancelOrder")}</Button>
				</>
			);
		}

		if (order.status === "pending") {
			return (
				<>
					<Button
						type="button"
						onClick={async () => {
							const res = await appApi.admin.orderAccept({ order });
							if (!res?.success) {
								// todo:
								return;
							}
							updateOrder(order.id, "processing");
						}}
					>
						{t("ordersPage:actions.acceptOrder")}
					</Button>
					<Button type="button">{t("ordersPage:actions.cancelOrder")}</Button>
				</>
			);
		}

		return null;
	}

	return (
		<div key={order.id} className="flex flex-wrap items-center gap-y-4 gap-x-4 py-6">
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">
					{t("ordersPage:columns.orderId")}
				</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					<a href="#" className="hover:underline">
						{order.id}
					</a>
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">
					{t("ordersPage:columns.client")}
				</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					<a href="#" className="hover:underline">
						{order.client.displayName}
						<br />({order.client.phoneNumber.number})
					</a>
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">
					{t("ordersPage:columns.date")}
				</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					<DateView date={order.date} />
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">
					{t("ordersPage:columns.sum")}
				</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					<Price price={order.cart.cartTotal} />
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">
					{t("ordersPage:columns.status")}
				</dt>
				<dd className="mt-1.5 inline-flex items-center">
					<Chip color={chipColors[order.status]}>
						{t(`common:orderStatutes.${order.status}`)}
					</Chip>
				</dd>
			</dl>
			<div className="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center gap-4">
				{orderMainAction()}
			</div>
			<div className="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center lg:justify-end gap-4">
				<Button
					color="primary"
					onClick={() => {
						navigate({ to: "admin.order", params: { id: order.id } });
					}}
				>
					{t("ordersPage:actions.viewOrder")}
				</Button>
			</div>
		</div>
	);
}

export default AdminOrdersPages;
