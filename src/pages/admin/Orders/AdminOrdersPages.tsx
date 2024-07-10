import { useEffect, useState } from "react";
import { useAppApi } from "src/appApi";
import { TOrder } from "src/domains/Order";

function AdminOrdersPages() {
	const appApi = useAppApi();

	const [orders, setOrders] = useState<TOrder[]>([]);

	useEffect(() => {
		appApi.orders.list().then((res) => {
			setOrders(res.data as TOrder[]);
		});
	}, [appApi.orders]);

	console.log("orders", orders);

	return (
		<div className="p-4">
			<div className="mb-8 font-bold text-2xl">Orders</div>
			<div className="flex flex-col gap-8">
				{orders.map((order) => {
					return (
						<div className="shadow p-4 rounded">
							<div className="flex gap-2">
								<div className="">status</div>
								<div className="">{order.status}</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default AdminOrdersPages;
