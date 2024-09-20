import { useEffect, useState } from "react";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { Button } from "src/components/button";
import { TOrder } from "src/domains/Order";
import { navigate } from "src/navigation";
import { calculateCartPrice } from "src/utils/calculateCartPrice";

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
					<div className="gap-4 sm:flex sm:items-center sm:justify-between">
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
							My orders
						</h2>
						<div className="mt-6 gap-4 space-y-4 sm:mt-0 sm:flex sm:items-center sm:justify-end sm:space-y-0">
							<div>
								<label
									htmlFor="order-type"
									className="sr-only mb-2 block text-sm font-medium text-gray-900 dark:text-white"
								>
									Select order type
								</label>
								<select
									id="order-type"
									className="block w-full min-w-[8rem] rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
								>
									<option selected>All orders</option>
									<option value="pre-order">Pre-order</option>
									<option value="transit">In transit</option>
									<option value="confirmed">Confirmed</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>
							<span className="inline-block text-gray-500 dark:text-gray-400"> from </span>
							<div>
								<label
									htmlFor="duration"
									className="sr-only mb-2 block text-sm font-medium text-gray-900 dark:text-white"
								>
									Select duration
								</label>
								<select
									id="duration"
									className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
								>
									<option selected>this week</option>
									<option value="this month">this month</option>
									<option value="last 3 months">the last 3 months</option>
									<option value="lats 6 months">the last 6 months</option>
									<option value="this year">this year</option>
								</select>
							</div>
						</div>
					</div>
					<div className="mt-6 flow-root sm:mt-8">
						<div className="divide-y divide-gray-200 dark:divide-gray-700">
							{orders.map((order) => {
								return <OrderRow key={order.id} order={order} updateOrder={updateOrder} />;
							})}
						</div>
					</div>
					<nav
						className="mt-6 flex items-center justify-center sm:mt-8"
						aria-label="Page navigation example"
					>
						<ul className="flex h-8 items-center -space-x-px text-sm">
							<li>
								<a
									href="#"
									className="flex h-8 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									1
								</a>
							</li>
							<li>
								<a
									href="#"
									className="flex h-8 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									2
								</a>
							</li>
							<li>
								<a
									href="#"
									aria-current="page"
									className="z-10 flex h-8 items-center justify-center border border-primary-300 bg-primary-50 px-3 leading-tight text-primary-600 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
								>
									3
								</a>
							</li>
							<li>
								<a
									href="#"
									className="flex h-8 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									...
								</a>
							</li>
							<li>
								<a
									href="#"
									className="flex h-8 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									100
								</a>
							</li>
							<li>
								<a
									href="#"
									className="flex h-8 items-center justify-center rounded-e-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<span className="sr-only">Next</span>
									<svg
										className="h-4 w-4 rtl:rotate-180"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width={24}
										height={24}
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="m9 5 7 7-7 7"
										/>
									</svg>
								</a>
							</li>
						</ul>
					</nav>
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
	const appApi = useAppApi();

	function orderMainAction() {
		if (order.status === "delivered") {
			return (
				<>
					<button
						type="button"
						onClick={async () => {
							const res = await appApi.admin.orderPaid({ order });
							if (!res?.success) {
								// todo:
								return;
							}
							updateOrder(order.id, "completed");
						}}
						className="w-full rounded-lg bg-primary-main px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 lg:w-auto"
					>
						mark as paid
					</button>
				</>
			);
		}
		if (order.status === "processing") {
			return (
				<>
					<button
						type="button"
						onClick={async () => {
							const res = await appApi.admin.orderDelivered({ order });
							if (!res?.success) {
								// todo:
								return;
							}
							updateOrder(order.id, "delivered");
						}}
						className="w-full rounded-lg bg-primary-main px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 lg:w-auto"
					>
						mark as delivered
					</button>
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
						Accept order
					</Button>
					<Button type="button">Cancel order</Button>
				</>
			);
		}

		return null;
	}
	return (
		<div className="flex flex-wrap items-center gap-y-4 py-6 gap-x-4">
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">Order ID:</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					{order.id}
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">Date:</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					<DateView
					 date={order.date} />
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">Price:</dt>
				<dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
					<Price price={calculateCartPrice(order.cart.items).finalCost} />
				</dd>
			</dl>
			<dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
				<dt className="text-base font-medium text-gray-500 dark:text-gray-400">Status:</dt>
				<dd className="me-2 mt-1.5 inline-flex items-center rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
					<svg
						className="me-1 h-3 w-3"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width={24}
						height={24}
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
						/>
					</svg>
					{order.status}
				</dd>
			</dl>
			<div className="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center gap-4">
				{orderMainAction()}
			</div>
			<div className="w-full grid sm:grid-cols-3 lg:flex lg:w-64 lg:items-center  gap-4">
				<span
					onClick={() =>
						navigate({
							to: "admin.order",
							params: { id: order.id },
						})
					}
					className="w-full inline-flex justify-center rounded-lg  border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 lg:w-auto"
				>
					View details
				</span>
			</div>
		</div>
	);
}

export default AdminOrdersPages;
