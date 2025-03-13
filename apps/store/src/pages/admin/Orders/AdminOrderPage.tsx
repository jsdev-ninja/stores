import React, { useEffect } from "react";
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	Input,
	Select,
	SelectItem,
	Chip,
	Divider,
	Table,
	TableHeader,
	TableBody,
	TableColumn,
	TableRow,
	TableCell,
	Button,
} from "@heroui/react";
import { Trash2 } from "lucide-react";
import { useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { TOrder } from "@jsdev_ninja/core";
interface OrderItemsTableProps {
	items: TOrder["cart"]["items"];
	onUpdateItem: (itemId: string, field: keyof OrderItem, value: any) => void;
	onRemoveItem: (itemId: string) => void;
}

export function OrderItemsTable({ items, onUpdateItem, onRemoveItem }: OrderItemsTableProps) {
	return (
		<Table aria-label="Order items table">
			<TableHeader>
				<TableColumn>PRODUCT</TableColumn>
				<TableColumn>QUANTITY</TableColumn>
				<TableColumn>PRICE</TableColumn>
				<TableColumn>SUBTOTAL</TableColumn>
				<TableColumn>ACTIONS</TableColumn>
			</TableHeader>
			<TableBody>
				{items.map((item) => (
					<TableRow key={item.product.id}>
						<TableCell>
							<Input
								value={item.product.name[0].value}
								onChange={(e) =>
									onUpdateItem(item.product.id, "productName", e.target.value)
								}
							/>
						</TableCell>
						<TableCell>
							<Input
								type="number"
								min={1}
								value={item.amount.toString()}
								onChange={(e) =>
									onUpdateItem(item.product.id, "quantity", parseInt(e.target.value))
								}
							/>
						</TableCell>
						<TableCell>
							<Input
								type="number"
								min={0}
								step={0.01}
								value={item.product.price.toString()}
								onChange={(e) =>
									onUpdateItem(item.product.id, "price", parseFloat(e.target.value))
								}
							/>
						</TableCell>
						<TableCell>${(item.amount * item.product.price).toFixed(2)}</TableCell>
						<TableCell>
							<Button
								isIconOnly
								color="danger"
								variant="light"
								onPress={() => onRemoveItem(item.id)}
							>
								<Trash2 />
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export interface OrderItem {
	id: string;
	productName: string;
	quantity: number;
	price: number;
}

export interface Order {
	id: string;
	customerName: string;
	email: string;
	status: "pending" | "processing" | "completed" | "cancelled";
	items: OrderItem[];
	total: number;
	date: string;
}

export default function AdminOrderPage() {
	const [order, setOrder] = React.useState<TOrder | null>(null);

	const appApi = useAppApi();
	const { id } = useParams("admin.order");

	useEffect(() => {
		if (!id) return;

		appApi.admin.getOrder(id).then((res) => {
			if (res?.success) {
				setOrder(res.data);
			}
		});
	}, [id]);

	const updateOrderItem = (itemId: string, field: any, value: any) => {
		setOrder((prev) => {
			if (!prev) return prev;

			const updatedItems = prev?.cart.items.map((item) => {
				if (item.product.id === itemId) {
					if (field === "amount") return { ...item, [field]: value };
					return { ...item, product: { ...item.product, [field]: value } };
				}
				return item;
			});

			const newTotal = (updatedItems ?? []).reduce(
				(sum, item) => sum + item.amount * item.product.price,
				0
			);

			return {
				...prev,
				items: updatedItems,
				total: newTotal,
			};
		});
	};

	const removeOrderItem = (itemId: string) => {
		setOrder((prev) => {
			if (!prev) return prev;
			const updatedItems = prev.cart.items.filter((item) => item.product.id !== itemId);
			const newTotal = updatedItems.reduce(
				(sum, item) => sum + item.amount * item.product.price,
				0
			);

			return {
				...prev,
				items: updatedItems,
				total: newTotal,
			};
		});
	};

	const statusColorMap = {
		pending: "warning",
		processing: "primary",
		completed: "success",
		cancelled: "danger",
	} as const;

	if (!order) return null;

	return (
		<div className="p-4 min-h-screen bg-default-50">
			<Card className="max-w-[1200px] mx-auto">
				<CardHeader className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">Order Details</h1>
						<Chip color={statusColorMap[order.status]} variant="flat">
							{order.status}
						</Chip>
					</div>
					<p className="text-small text-default-500">Order ID: {order.id}</p>
				</CardHeader>
				<Divider />
				<CardBody className="flex flex-col gap-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							label="Customer Name"
							value={order.client.displayName}
							onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
						/>
						<Input
							label="Email"
							value={order.client.email}
							onChange={(e) => setOrder({ ...order, email: e.target.value })}
						/>
						<Select
							label="Status"
							selectedKeys={[order.status]}
							onChange={(e) =>
								setOrder({
									...order,
									status: e.target.value as Order["status"],
								})
							}
						>
							<SelectItem key="pending">Pending</SelectItem>
							<SelectItem key="processing">Processing</SelectItem>
							<SelectItem key="completed">Completed</SelectItem>
							<SelectItem key="cancelled">Cancelled</SelectItem>
						</Select>
						<Input
							label="Order Date"
							value={order.date}
							onChange={(e) => setOrder({ ...order, date: e.target.value })}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<h2 className="text-lg font-semibold">Order Items</h2>
						<OrderItemsTable
							items={order.cart.items}
							onUpdateItem={updateOrderItem}
							onRemoveItem={removeOrderItem}
						/>
					</div>
				</CardBody>
				<Divider />
				<CardFooter>
					<div className="ml-auto">
						<p className="text-xl font-semibold">Total: ${order.cart.cartTotal.toFixed(2)}</p>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
