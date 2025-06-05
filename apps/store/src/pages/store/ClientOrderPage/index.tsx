import { useEffect, useState } from "react";
import {
	Card,
	CardBody,
	CardHeader,
	CardFooter,
	Divider,
	Chip,
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Progress,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { TOrder } from "@jsdev_ninja/core";

// Sample order data

const getStatusColor = (status: TOrder["status"]) => {
	switch (status) {
		case "processing":
			return "warning";
		case "in_delivery":
			return "primary";
		case "delivered":
			return "success";
		case "cancelled":
			return "danger";
		default:
			return "default";
	}
};

const getStatusText = (status: TOrder["status"]) => {
	switch (status) {
		case "processing":
			return "Processing";
		case "in_delivery":
			return "Shipped";
		case "delivered":
			return "Delivered";
		case "cancelled":
			return "Cancelled";
		default:
			return "Unknown";
	}
};

const getTrackingProgress = (status: TOrder["status"]) => {
	switch (status) {
		case "processing":
			return 25;
		case "in_delivery":
			return 50;
		case "delivered":
			return 100;
		case "cancelled":
			return 0;
		default:
			return 0;
	}
};

export default function ClientOrderPage() {
	const appApi = useAppApi();

	const { id } = useParams("store.orderPage");

	const [order, setOrder] = useState<TOrder | null>(null);

	useEffect(() => {
		if (!id) return;

		appApi.user.getOrder({ id }).then((res) => {
			if (res.success) {
				setOrder(res.data);
			}
		});
	}, [id]);

	if (!order) {
		// todo
		return null;
	}
	return (
		<div className="container mx-auto px-4 py-8 max-w-5xl">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold text-default-900">Order Details</h1>
					<p className="text-default-600">
						Order #{order.id} • Placed on {new Date(order.date).toLocaleDateString()}
					</p>
				</div>
			</div>

			{/* Order Status */}
			<Card className="mb-6">
				<CardHeader className="flex justify-between">
					<h2 className="text-lg font-semibold">Order Status</h2>
					<Chip color={getStatusColor(order.status)} variant="flat">
						{getStatusText(order.status)}
					</Chip>
				</CardHeader>
				<CardBody>
					<Progress
						value={getTrackingProgress(order.status)}
						color={getStatusColor(order.status)}
						className="mb-4"
						aria-label="Order progress"
					/>
					<div className="grid grid-cols-4 text-center text-sm">
						<div className="flex flex-col items-center">
							<div
								className={`rounded-full p-2 mb-2 ${
									order.status !== "cancelled"
										? "bg-success-100 text-success-600"
										: "bg-default-100 text-default-600"
								}`}
							>
								<Icon icon="lucide:check-circle" className="text-lg" />
							</div>
							<span>Confirmed</span>
						</div>
						<div className="flex flex-col items-center">
							<div
								className={`rounded-full p-2 mb-2 ${
									["shipped", "delivered"].includes(order.status)
										? "bg-success-100 text-success-600"
										: "bg-default-100 text-default-600"
								}`}
							>
								<Icon icon="lucide:package" className="text-lg" />
							</div>
							<span>Processing</span>
						</div>
						<div className="flex flex-col items-center">
							<div
								className={`rounded-full p-2 mb-2 ${
									["shipped", "delivered"].includes(order.status)
										? "bg-success-100 text-success-600"
										: "bg-default-100 text-default-600"
								}`}
							>
								<Icon icon="lucide:truck" className="text-lg" />
							</div>
							<span>Shipped</span>
						</div>
						<div className="flex flex-col items-center">
							<div
								className={`rounded-full p-2 mb-2 ${
									order.status === "delivered"
										? "bg-success-100 text-success-600"
										: "bg-default-100 text-default-600"
								}`}
							>
								<Icon icon="lucide:home" className="text-lg" />
							</div>
							<span>Delivered</span>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Order Items */}
			<Card className="mb-6">
				<CardHeader>
					<h2 className="text-lg font-semibold">Order Items</h2>
				</CardHeader>
				<Table removeWrapper aria-label="Order items">
					<TableHeader>
						<TableColumn>PRODUCT</TableColumn>
						<TableColumn>PRICE</TableColumn>
						<TableColumn>QUANTITY</TableColumn>
						<TableColumn>TOTAL</TableColumn>
					</TableHeader>
					<TableBody>
						{order.cart.items.map((item) => (
							<TableRow key={item.product.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										<img
											src={item.product.images?.[0]?.url}
											alt={item.product.name[0].value}
											className="w-16 h-16 rounded-md object-cover"
										/>
										<div>
											<p className="font-medium">{item.product.name[0].value}</p>
											{/* <div className="text-xs text-default-500 mt-1">
												<span className="mr-2">Size: {item.size}</span>
												<span>Color: {item.color}</span>
											</div> */}
										</div>
									</div>
								</TableCell>
								<TableCell>{item.product.price.toFixed(2)}</TableCell>
								<TableCell>{item.amount}</TableCell>
								<TableCell>{(item.product.price * item.amount).toFixed(2)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<CardFooter className="flex flex-col items-end">
					<div className="w-full max-w-xs">
						<div className="flex justify-between py-2">
							<span className="text-default-600">Subtotal</span>
							<span>{order.cart.cartTotal.toFixed(2)}</span>
						</div>
						{/* <div className="flex justify-between py-2">
							<span className="text-default-600">Shipping</span>
							<span>${order.shipping.toFixed(2)}</span>
						</div> */}
						<div className="flex justify-between py-2">
							<span className="text-default-600">Tax</span>
							<span>{order.cart.cartVat.toFixed(2)}</span>
						</div>
						<Divider className="my-2" />
						<div className="flex justify-between py-2">
							<span className="font-bold">Total</span>
							<span className="font-bold">{order.cart.cartTotal.toFixed(2)}</span>
						</div>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
