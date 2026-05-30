import { useEffect, useState } from "react";
import {
	Card,
	Separator,
	Chip,
	Table,
	ProgressBar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { TOrder } from "@jsdev_ninja/core";

const STATUS_CHIP_COLOR: Record<
	NonNullable<TOrder["status"]>,
	"warning" | "accent" | "success" | "danger" | "default"
> = {
	processing: "warning",
	in_delivery: "accent",
	delivered: "success",
	cancelled: "danger",
	pending: "default",
	completed: "success",
	draft: "default",
	refunded: "warning",
};

const STATUS_TEXT: Record<NonNullable<TOrder["status"]>, string> = {
	processing: "Processing",
	in_delivery: "Shipped",
	delivered: "Delivered",
	cancelled: "Cancelled",
	pending: "Pending",
	completed: "Completed",
	draft: "Draft",
	refunded: "Refunded",
};

const STATUS_PROGRESS: Record<NonNullable<TOrder["status"]>, number> = {
	processing: 25,
	in_delivery: 50,
	delivered: 100,
	cancelled: 0,
	pending: 0,
	completed: 100,
	draft: 0,
	refunded: 0,
};

const getStatusColor = (
	status: TOrder["status"]
): "warning" | "accent" | "success" | "danger" | "default" =>
	STATUS_CHIP_COLOR[status as NonNullable<TOrder["status"]>] ?? "default";

const getStatusText = (status: TOrder["status"]) =>
	STATUS_TEXT[status as NonNullable<TOrder["status"]>] ?? "Unknown";

const getTrackingProgress = (status: TOrder["status"]) =>
	STATUS_PROGRESS[status as NonNullable<TOrder["status"]>] ?? 0;

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
				<Card.Header className="flex justify-between">
					<h2 className="text-lg font-semibold">Order Status</h2>
					<Chip color={getStatusColor(order.status)}>
						<Chip.Label>{getStatusText(order.status)}</Chip.Label>
					</Chip>
				</Card.Header>
				<Card.Content>
					<ProgressBar
						value={getTrackingProgress(order.status)}
						aria-label="Order progress"
						className="mb-4"
					>
						<ProgressBar.Track>
							<ProgressBar.Fill />
						</ProgressBar.Track>
					</ProgressBar>
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
				</Card.Content>
			</Card>

			{/* Order Items */}
			<Card className="mb-6">
				<Card.Header>
					<h2 className="text-lg font-semibold">Order Items</h2>
				</Card.Header>
				<Table>
					<Table.ScrollContainer>
						<Table.Content aria-label="Order items">
							<Table.Header>
								<Table.Column isRowHeader>PRODUCT</Table.Column>
								<Table.Column>PRICE</Table.Column>
								<Table.Column>QUANTITY</Table.Column>
								<Table.Column>TOTAL</Table.Column>
							</Table.Header>
							<Table.Body>
								{order.cart.items.map((item) => (
									<Table.Row key={item.product.id}>
										<Table.Cell>
											<div className="flex items-center gap-3">
												<img
													src={item.product.images?.[0]?.url}
													alt={item.product.name[0].value}
													className="w-16 h-16 rounded-md object-cover"
												/>
												<div>
													<p className="font-medium">{item.product.name[0].value}</p>
												</div>
											</div>
										</Table.Cell>
										<Table.Cell>{item.product.price.toFixed(2)}</Table.Cell>
										<Table.Cell>{item.amount}</Table.Cell>
										<Table.Cell>
											{(item.product.price * item.amount).toFixed(2)}
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
				<Card.Footer className="flex flex-col items-end">
					<div className="w-full max-w-xs">
						<div className="flex justify-between py-2">
							<span className="text-default-600">Subtotal</span>
							<span>{order.cart.cartTotal.toFixed(2)}</span>
						</div>
						<div className="flex justify-between py-2">
							<span className="text-default-600">Tax</span>
							<span>{order.cart.cartVat.toFixed(2)}</span>
						</div>
						<Separator className="my-2" />
						<div className="flex justify-between py-2">
							<span className="font-bold">Total</span>
							<span className="font-bold">{order.cart.cartTotal.toFixed(2)}</span>
						</div>
					</div>
				</Card.Footer>
			</Card>
		</div>
	);
}
