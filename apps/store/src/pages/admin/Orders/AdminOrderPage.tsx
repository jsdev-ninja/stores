import React, { useEffect, useState } from "react";
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
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
	Autocomplete,
	AutocompleteItem,
} from "@heroui/react";
import { Trash2, Plus } from "lucide-react";
import { navigate, useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { getCartCost, TOrder, TProduct } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useTranslation } from "react-i18next";
import algoliasearch from "algoliasearch/lite";

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
								min={0.01}
								step={0.01}
								value={item.amount.toString()}
								onChange={(e) =>
									onUpdateItem(item.product.id, "amount", parseFloat(e.target.value) || 0)
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
	const [selectedProduct, setSelectedProduct] = useState<string>("");
	const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
	const [searchResults, setSearchResults] = useState<TProduct[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [deliveryPriceRemoved, setDeliveryPriceRemoved] = useState<boolean>(false);
	const { isOpen, onOpen, onClose } = useDisclosure();

	// External product modal state
	const {
		isOpen: isExternalOpen,
		onOpen: onExternalOpen,
		onClose: onExternalClose,
	} = useDisclosure();
	const [externalProductName, setExternalProductName] = useState<string>("");
	const [externalProductPrice, setExternalProductPrice] = useState<number>(0);
	const [externalProductQuantity, setExternalProductQuantity] = useState<number>(1);

	console.log(JSON.stringify(order?.cart.items));
	console.log("order", order?.cart);
	// 1617.95; //

	const appApi = useAppApi();
	const { id } = useParams("admin.order");
	const { t } = useTranslation(["common"]);

	const store = useStore();
	const discounts = useDiscounts();

	const algoliaClient = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

	const productsIndex = algoliaClient.initIndex("products");

	async function save() {
		if (!order) return;

		const res = await appApi.admin.updateOrder({ order });
		if (res?.success) {
			navigate({ to: "admin.orders" });
		}
	}

	async function handleProductSearch(query: string) {
		if (!query || query.length < 2) {
			setSearchResults([]);
			return;
		}
		setIsSearching(true);
		try {
			const { hits } = await productsIndex.search<TProduct>(query, {
				filters: `storeId:${store?.id} AND companyId:${store?.companyId}`,
				hitsPerPage: 10,
			});
			setSearchResults(hits);
		} catch (error) {
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}

	function addProductToOrder() {
		if (!order || !selectedProduct || selectedQuantity <= 0) return;
		const product = searchResults.find((p) => p.id === selectedProduct);
		if (!product) return;

		// Check if product already exists in order
		const existingItemIndex = order.cart.items.findIndex(
			(item) => item.product.id === selectedProduct
		);

		setOrder((prev) => {
			if (!prev) return prev;
			if (!store) return prev;

			const updatedItems = [...prev.cart.items];

			if (existingItemIndex >= 0) {
				// Update existing item quantity
				updatedItems[existingItemIndex] = {
					...updatedItems[existingItemIndex],
					amount: updatedItems[existingItemIndex].amount + selectedQuantity,
				};
			} else {
				// Add new item
				const newItem = {
					product: product,
					originalPrice: product.price,
					finalPrice: product.price,
					finalDiscount: 0,
					amount: selectedQuantity,
				};
				updatedItems.push(newItem);
			}

			const cartCost = getCartCost({
				cart: updatedItems,
				discounts: discounts,
				store: { ...store, deliveryPrice: deliveryPriceRemoved ? 0 : store.deliveryPrice ?? 0 },
			});

			return {
				...prev,
				cart: {
					...prev.cart,
					items: updatedItems,
					cartDiscount: cartCost.discount,
					cartTotal: cartCost.finalCost,
					cartVat: cartCost.vat,
					deliveryPrice: cartCost.deliveryPrice,
				},
			};
		});

		// Reset form
		setSelectedProduct("");
		setSelectedQuantity(1);
		setSearchResults([]);
		onClose();
	}

	function addExternalProductToOrder() {
		if (
			!order ||
			!externalProductName.trim() ||
			externalProductPrice <= 0 ||
			externalProductQuantity <= 0
		)
			return;

		const id = `external-${Date.now()}-${Math.random()}`;
		// Create a mock product object for external products
		const externalProduct: TProduct = {
			type: "Product",
			id: id,
			objectID: id,
			sku: `EXT-${Date.now()}`,
			name: [{ value: externalProductName, lang: "he" }],
			description: [{ value: "External product", lang: "he" }],
			price: externalProductPrice,
			storeId: store?.id || "",
			companyId: store?.companyId || "",
			isPublished: true,
			vat: true,
			priceType: { type: "unit", value: 1 },
			currency: "ILS",
			discount: { type: "none", value: 0 },
			weight: { value: 0, unit: "none" },
			volume: { value: 0, unit: "none" },
			images: [],
			manufacturer: "",
			brand: "",
			importer: "",
			supplier: "",
			ingredients: [],
			created_at: Date.now(),
			updated_at: Date.now(),
			categoryIds: [],
		};

		setOrder((prev) => {
			if (!prev) return prev;
			if (!store) return prev;
			const updatedItems = [...prev.cart.items];

			// Add external product as new item
			const newItem = {
				product: externalProduct,
				originalPrice: externalProductPrice,
				finalPrice: externalProductPrice,
				finalDiscount: 0,
				amount: externalProductQuantity,
			};
			updatedItems.push(newItem);

			const cartCost = getCartCost({
				cart: updatedItems,
				discounts: discounts,
				store: { ...store, deliveryPrice: deliveryPriceRemoved ? 0 : store.deliveryPrice ?? 0 },
			});

			return {
				...prev,
				cart: {
					...prev.cart,
					items: updatedItems,
					cartDiscount: cartCost.discount,
					cartTotal: cartCost.finalCost,
					cartVat: cartCost.vat,
					deliveryPrice: cartCost.deliveryPrice,
				},
			};
		});

		// Reset form
		setExternalProductName("");
		setExternalProductPrice(0);
		setExternalProductQuantity(1);
		onExternalClose();
	}

	useEffect(() => {
		if (!id) return;

		appApi.admin.getOrder(id).then((res) => {
			if (res?.success) {
				setOrder(res.data);
			}
		});
	}, [id]);

	// Recalculate cart cost when delivery price removal changes
	useEffect(() => {
		if (!order || !store) return;

		const updatedItems = order.cart.items;
		const cartCost = getCartCost({
			cart: updatedItems,
			discounts: discounts,
			store: { ...store, deliveryPrice: deliveryPriceRemoved ? 0 : store.deliveryPrice ?? 0 },
		});

		setOrder({
			...order,
			cart: {
				...order.cart,
				cartDiscount: cartCost.discount,
				cartTotal: cartCost.finalCost,
				cartVat: cartCost.vat,
				deliveryPrice: cartCost.deliveryPrice,
			},
		});
	}, [deliveryPriceRemoved, store, discounts]);

	const updateOrderItem = (itemId: string, field: any, value: any) => {
		if (!store) return;

		setOrder((prev) => {
			if (!prev) return prev;

			const updatedItems = prev?.cart.items.map((item) => {
				if (item.product.id === itemId) {
					if (field === "amount") return { ...item, [field]: value };
					return { ...item, product: { ...item.product, [field]: value } };
				}
				return item;
			});

			const cartCost = getCartCost({
				cart: updatedItems,
				discounts: discounts,
				store: { ...store, deliveryPrice: deliveryPriceRemoved ? 0 : store.deliveryPrice ?? 0 },
			});

			return {
				...prev,
				cart: {
					...prev.cart,
					items: updatedItems,
					cartDiscount: cartCost.discount,
					cartTotal: cartCost.finalCost,
					cartVat: cartCost.vat,
					deliveryPrice: cartCost.deliveryPrice ?? 0,
				},
			};
		});
	};

	const removeOrderItem = (itemId: string) => {
		if (!store) return;

		setOrder((prev) => {
			if (!prev) return prev;
			const updatedItems = prev.cart.items.filter((item) => item.product.id !== itemId);

			const cartCost = getCartCost({
				cart: updatedItems,
				discounts: discounts,
				store: { ...store, deliveryPrice: store.deliveryPrice ?? 0 },
			});

			return {
				...prev,
				cart: {
					...prev.cart,
					items: updatedItems,
					cartDiscount: cartCost.discount,
					cartTotal: cartCost.finalCost,
					cartVat: cartCost.vat,
					deliveryPrice: cartCost.deliveryPrice,
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
						<Input label="Email" value={order.client.email} isDisabled />
						<Input
							isDisabled
							label="Name on Invoice"
							value={order.nameOnInvoice || ""}
							placeholder="Name that will appear on invoice"
						/>
						<Input
							isDisabled
							label="Client Comment"
							value={order.clientComment || ""}
							placeholder="Client's comment for the store"
						/>
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
							value={order.date ? new Date(order.date).toLocaleDateString() : ""}
							isDisabled
						/>
						<Input
							label="Delivery Date"
							type="date"
							value={
								order.deliveryDate
									? new Date(order.deliveryDate).toISOString().split("T")[0]
									: ""
							}
						/>
					</div>

					{/* Customer Address Section */}
					<div className="flex flex-col gap-2">
						<h2 className="text-lg font-semibold">Customer Address</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Input label="City" value={order.client.address?.city || ""} isDisabled />
							<Input label="Street" value={order.client.address?.street || ""} isDisabled />
							<Input
								label="Street Number"
								value={order.client.address?.streetNumber || ""}
								isDisabled
							/>
							<Input label="Floor" value={order.client.address?.floor || ""} isDisabled />
							<Input
								label="Apartment Number"
								value={order.client.address?.apartmentNumber || ""}
								isDisabled
							/>
							<Input label="Phone" value={order.client.phoneNumber || ""} isDisabled />
						</div>
					</div>

					{/* Delivery Price Section */}
					<div className="flex flex-col gap-2 text-start">
						<h2 className="text-lg font-semibold">{t("common:deliveryPrice")}</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium text-gray-700">
									{t("common:currentDeliveryPrice")}
								</label>
								<div className="flex gap-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={store?.deliveryPrice?.toString() || "0.00"}
										isDisabled
										placeholder="0.00"
										className="flex-1"
									/>
									<Button
										color={deliveryPriceRemoved ? "success" : "danger"}
										variant="light"
										onPress={() => {
											setDeliveryPriceRemoved(!deliveryPriceRemoved);
										}}
									>
										{deliveryPriceRemoved
											? t("common:restoreDeliveryPrice")
											: t("common:removeDeliveryPrice")}
									</Button>
								</div>
								<p className="text-sm text-gray-500">
									{deliveryPriceRemoved
										? t("common:deliveryPriceRemovedDescription")
										: t("common:deliveryPriceRemoveDescription")}
								</p>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Order Items</h2>
							<div className="flex gap-2">
								<Button
									color="primary"
									startContent={<Plus />}
									onPress={() => {
										onOpen();
									}}
								>
									Add Product
								</Button>
								<Button
									color="secondary"
									variant="bordered"
									startContent={<Plus />}
									onPress={onExternalOpen}
								>
									Add External Product
								</Button>
							</div>
						</div>
						<OrderItemsTable
							items={order.cart.items}
							onUpdateItem={updateOrderItem}
							onRemoveItem={removeOrderItem}
						/>
					</div>

					{/* Add Product Modal */}
					<Modal isOpen={isOpen} onClose={onClose} size="2xl">
						<ModalContent>
							<ModalHeader>Add Product to Order</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Autocomplete
										label="Search and Select Product"
										placeholder="Type to search products..."
										items={searchResults}
										onInputChange={handleProductSearch}
										onSelectionChange={(key) => setSelectedProduct(key as string)}
										isLoading={isSearching}
										allowsCustomValue={false}
									>
										{(product) => (
											<AutocompleteItem
												key={product.id}
												textValue={product.name[0].value}
											>
												<div className="flex flex-col">
													<span className="font-medium">{product.name[0].value}</span>
													<span className="text-sm text-gray-500">
														₪{product.price}
													</span>
												</div>
											</AutocompleteItem>
										)}
									</Autocomplete>
									<Input
										label="Quantity"
										type="number"
										min={1}
										value={selectedQuantity.toString()}
										onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button variant="flat" onPress={onClose}>
									Cancel
								</Button>
								<Button
									color="primary"
									onPress={addProductToOrder}
									isDisabled={!selectedProduct || selectedQuantity <= 0}
								>
									Add to Order
								</Button>
							</ModalFooter>
						</ModalContent>
					</Modal>

					{/* Add External Product Modal */}
					<Modal isOpen={isExternalOpen} onClose={onExternalClose} size="lg">
						<ModalContent>
							<ModalHeader>Add External Product to Order</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Input
										label="Product Name"
										placeholder="Enter product name..."
										value={externalProductName}
										onChange={(e) => setExternalProductName(e.target.value)}
									/>
									<Input
										label="Price (₪)"
										type="number"
										min={0}
										step={0.01}
										placeholder="0.00"
										value={externalProductPrice.toString()}
										onChange={(e) =>
											setExternalProductPrice(parseFloat(e.target.value) || 0)
										}
									/>
									<Input
										label="Quantity"
										type="number"
										min={1}
										step={0.01}
										value={externalProductQuantity.toString()}
										onChange={(e) =>
											setExternalProductQuantity(parseFloat(e.target.value) || 1)
										}
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button variant="flat" onPress={onExternalClose}>
									Cancel
								</Button>
								<Button
									color="primary"
									onPress={addExternalProductToOrder}
									isDisabled={
										!externalProductName.trim() ||
										externalProductPrice <= 0 ||
										externalProductQuantity <= 0
									}
								>
									Add to Order
								</Button>
							</ModalFooter>
						</ModalContent>
					</Modal>
				</CardBody>
				<Divider />
				<CardFooter>
					<div className="flex flex-col gap-2 ml-auto">
						<div className="text-right">
							<p className="text-sm text-gray-600">
								{t("common:subtotal")}: ₪{order?.cart.cartTotal.toFixed(2)}
							</p>
							{deliveryPriceRemoved && (
								<p className="text-sm text-green-600">
									{t("common:deliveryPrice")}: ₪0.00 ({t("common:waived")})
								</p>
							)}
							{!deliveryPriceRemoved && (store?.deliveryPrice ?? 0) > 0 && (
								<p className="text-sm text-gray-600">
									{t("common:deliveryPrice")}: ₪{(store?.deliveryPrice ?? 0).toFixed(2)}
								</p>
							)}
							<p className="text-xl font-semibold">
								{t("common:total")}: ₪{order?.cart.cartTotal.toFixed(2)}
							</p>
						</div>
					</div>
					<Button onPress={save}>save</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
