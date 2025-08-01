import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { Button } from "src/components/button";
import { Chip, ChipProps } from "@heroui/react";
import { navigate } from "src/navigation";
import { useUser } from "src/domains/user";
import { TOrder } from "@jsdev_ninja/core";
import { useAppSelector } from "src/infra";
import { useState } from "react";

function UserOrdersPage() {
	const { t } = useTranslation(["common", "ordersPage"]);

	const orders = useAppSelector((state) => state.orders.orders);

	const user = useUser();
	console.log("user", user?.uid);

	console.log("orders", orders);

	return (
		<div className="">
			<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
				<div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
					<div className="mx-auto max-w-5xl">
						<div className="gap-4 sm:flex sm:items-center sm:justify-between">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
								{t("ordersPage:title")}
							</h2>
						</div>
						<div className="mt-6 flow-root sm:mt-8">
							<div className="divide-y divide-gray-200 dark:divide-gray-700">
								{orders.map((order) => {
									return <OrderItem order={order} key={order.id} />;
								})}
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

function OrderItem({ order }: { order: TOrder }) {
	const { t } = useTranslation(["common", "ordersPage"]);

	const appApi = useAppApi();

	const user = useUser();

	const [loading, setLoading] = useState(false);

	const chipColors: Record<TOrder["status"], ChipProps["color"]> = {
		draft: "default",
		pending: "default",
		processing: "secondary",
		cancelled: "danger",
		refunded: "danger",
		completed: "success",
		in_delivery: "warning",
		delivered: "primary",
	};

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
			{!!user && !user.isAnonymous && (
				<div className="w-full grid sm:grid-cols-2 lg:flex lg:w-72 lg:items-center lg:justify-end gap-4">
					{order.paymentStatus === "pending" && (
						<Button
							color="secondary"
							isLoading={loading}
							onPress={async () => {
								try {
									setLoading(true);
									const payment = await appApi.user.createPaymentLink({ order: order });
									setLoading(false);
									window.location.href = payment.data.paymentLink;
								} catch (error) {
									console.log(error);
									setLoading(false);
								}
							}}
						>
							המשך לתשלום
						</Button>
					)}
					<Button
						color="primary"
						onPress={() => {
							navigate({ to: "store.orderPage", params: { id: order.id ?? "" } });
						}}
					>
						{t("ordersPage:actions.viewOrder")}
					</Button>
					{/* {order.status !== "completed" && (
						<Button
							variant="solid"
							color="danger"
							isDisabled={!appApi.user.permissions.canCancelOrder({ order })}
							onPress={() => {
								appApi.user.cancelOrder({ order });
							}}
						>
							{t("ordersPage:actions.cancelOrder")}
						</Button>
					)} */}
					{true && (
						<Button
							variant="solid"
							color="danger"
							onPress={() => {
								appApi.user.createCartFromOrder({ order });
							}}
						>
							{t("ordersPage:actions.duplicateOrder")}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

export default UserOrdersPage;
