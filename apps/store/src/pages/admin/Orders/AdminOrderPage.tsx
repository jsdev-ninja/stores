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
import { navigate, useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { TOrder } from "@jsdev_ninja/core";
import { calculateCartPrice } from "src/utils/calculateCartPrice";
interface OrderItemsTableProps {
	items: TOrder["cart"]["items"];
	onUpdateItem: (itemId: string, field: keyof TOrder["cart"]["items"][number], value: any) => void;
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
							<Input isDisabled value={item.product.name[0].value} />
						</TableCell>
						<TableCell>
							<Input
								type="number"
								min={1}
								value={item.amount.toString()}
								onChange={(e) =>
									onUpdateItem(item.product.id, "amount", parseInt(e.target.value))
								}
							/>
						</TableCell>
						<TableCell>
							<Input
								isDisabled
								type="number"
								min={0}
								step={0.01}
								value={item.product.price.toString()}
							/>
						</TableCell>
						<TableCell>${(item.amount * item.product.price).toFixed(2)}</TableCell>
						<TableCell>
							<Button
								isIconOnly
								color="danger"
								variant="light"
								onPress={() => onRemoveItem(item.product.id)}
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

export default function AdminOrderPage() {
	const [order, setOrder] = React.useState<TOrder | null>(null);

	console.log("order", order);

	const appApi = useAppApi();
	const { id } = useParams("admin.order");

	async function save() {
		if (!order) return;

		const res = await appApi.admin.updateOrder({ order });
		if (res?.success) {
			navigate({ to: "admin.orders" });
		}
	}

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

			const cartCost = calculateCartPrice(updatedItems ?? []);

			return {
				...prev,
				cart: {
					...prev.cart,
					items: updatedItems,
					cartDiscount: cartCost.discount,
					cartTotal: cartCost.finalCost,
					cartVat: cartCost.vat,
				},
			};
		});
	};

	const removeOrderItem = (itemId: string) => {
		setOrder((prev) => {
			if (!prev) return prev;
			const updatedItems = prev.cart.items.filter((item) => item.product.id !== itemId);

			const cartCost = calculateCartPrice(updatedItems ?? []);

			return {
				...prev,
				cart: {
					...prev.cart,
					items: updatedItems,
					cartDiscount: cartCost.discount,
					cartTotal: cartCost.finalCost,
					cartVat: cartCost.vat,
				},
			};
		});
	};

	const statusColorMap = {
		pending: "warning",
		processing: "primary",
		completed: "success",
		canceled: "danger",
	} as const;

	if (!order) return null;

	return (
		<div className="p-4 min-h-screen bg-default-50">
			<Card className="max-w-[1200px] mx-auto">
				<CardHeader className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">Order Details</h1>
						<Chip
							color={
								statusColorMap[
									order.status as keyof typeof statusColorMap
								] as unknown as any
							}
							variant="flat"
						>
							{order.status}
						</Chip>
					</div>
					<p className="text-small text-default-500">Order ID: {order.id}</p>
				</CardHeader>
				<Divider />
				<CardBody className="flex flex-col gap-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input label="Customer Name" value={order.client.displayName} isDisabled />
						<Input label="Email" value={order.client.email} />
						<Select
							label="Status"
							selectedKeys={[order.status]}
							onChange={(e) =>
								setOrder({
									...order,
									status: e.target.value as TOrder["status"],
								})
							}
						>
							<SelectItem key="pending">Pending</SelectItem>
							<SelectItem key="processing">Processing</SelectItem>
							<SelectItem key="completed">Completed</SelectItem>
							<SelectItem key="canceled">Canceled</SelectItem>
						</Select>
						<Input
							label="Order Date"
							value={order.date?.toString()}
							onChange={(e) => setOrder({ ...order, date: e.target.value as any })}
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
						<p className="text-xl font-semibold">
							Total: ${order?.cart.cartTotal.toFixed(2)}
						</p>
					</div>
					<Button onPress={save}>save</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
