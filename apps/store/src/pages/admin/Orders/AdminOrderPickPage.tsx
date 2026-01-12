import { useEffect, useState, useMemo } from "react";
import {
	Card,
	CardBody,
	Button,
	Table,
	TableHeader,
	TableBody,
	TableColumn,
	TableRow,
	TableCell,
	Input,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
	Autocomplete,
	AutocompleteItem,
	Chip,
} from "@heroui/react";
import { Trash2, Plus, ArrowLeft, Check, X } from "lucide-react";
import { navigate, useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { getCartCost, TOrder, TProduct } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useTranslation } from "react-i18next";
import algoliasearch from "algoliasearch/lite";
import { formatter } from "src/utils/formatter";

type ChangeType = "added" | "removed" | "modified";

interface ProductChange {
	type: ChangeType;
	productId: string;
	productName: string;
	oldValue?: number;
	newValue?: number;
}

export default function AdminOrderPickPage() {
	const { t, i18n } = useTranslation(["common", "ordersPage"]);
	const isRTL = i18n.dir() === "rtl";
	const { id } = useParams("admin.pickOrder");
	const appApi = useAppApi();
	const store = useStore();
	const discounts = useDiscounts();

	const [order, setOrder] = useState<TOrder | null>(null);
	const [originalItems, setOriginalItems] = useState<TOrder["cart"]["items"]>([]);
	const [selectedProduct, setSelectedProduct] = useState<string>("");
	const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
	const [searchResults, setSearchResults] = useState<TProduct[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const { isOpen, onOpen, onClose } = useDisclosure();

    console.log("order id", id);

	const {
		isOpen: isExternalOpen,
		onOpen: onExternalOpen,
		onClose: onExternalClose,
	} = useDisclosure();
	const [externalProductName, setExternalProductName] = useState<string>("");
	const [externalProductPrice, setExternalProductPrice] = useState<number>(0);
	const [externalProductQuantity, setExternalProductQuantity] = useState<number>(1);

	const algoliaClient = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
	const productsIndex = algoliaClient.initIndex("products");

	// Track changes
	const changes = useMemo<ProductChange[]>(() => {
		if (!order || originalItems.length === 0) return [];

		const changesList: ProductChange[] = [];
		const originalMap = new Map(
			originalItems.map((item) => [item.product.id, item.amount])
		);
		const currentMap = new Map(
			order.cart.items.map((item) => [item.product.id, item.amount])
		);

		// Check for removed and modified items
		originalItems.forEach((item) => {
			const productId = item.product.id;
			const originalAmount = originalMap.get(productId) || 0;
			const currentAmount = currentMap.get(productId) || 0;

			if (currentAmount === 0) {
				changesList.push({
					type: "removed",
					productId,
					productName: item.product.name?.[0]?.value || "",
					oldValue: originalAmount,
				});
			} else if (originalAmount !== currentAmount) {
				changesList.push({
					type: "modified",
					productId,
					productName: item.product.name?.[0]?.value || "",
					oldValue: originalAmount,
					newValue: currentAmount,
				});
			}
		});

		// Check for added items
		order.cart.items.forEach((item) => {
			const productId = item.product.id;
			if (!originalMap.has(productId)) {
				changesList.push({
					type: "added",
					productId,
					productName: item.product.name?.[0]?.value || "",
					newValue: item.amount,
				});
			}
		});

		return changesList;
	}, [order, originalItems]);

	useEffect(() => {
		if (!id) return;

		appApi.admin.getOrder(id).then((res) => {
			if (res?.success && res.data) {
				setOrder(res.data);
				setOriginalItems([...res.data.cart.items]);
			}
		});
	}, [id]);

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
		if (!product || !store) return;

		const existingItemIndex = order.cart.items.findIndex(
			(item) => item.product.id === selectedProduct
		);

		setOrder((prev) => {
			if (!prev) return prev;

			const updatedItems = [...prev.cart.items];

			if (existingItemIndex >= 0) {
				updatedItems[existingItemIndex] = {
					...updatedItems[existingItemIndex],
					amount: updatedItems[existingItemIndex].amount + selectedQuantity,
				};
			} else {
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
				deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
				freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
				isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
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
			externalProductQuantity <= 0 ||
			!store
		)
			return;

		const productId = `external-${Date.now()}-${Math.random()}`;
		const externalProduct: TProduct = {
			type: "Product",
			id: productId,
			objectID: productId,
			sku: `EXT-${Date.now()}`,
			name: [{ value: externalProductName, lang: "he" }],
			description: [{ value: "External product", lang: "he" }],
			price: externalProductPrice,
			storeId: store.id,
			companyId: store.companyId,
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

			const updatedItems = [...prev.cart.items];
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
				deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
				freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
				isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
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

		setExternalProductName("");
		setExternalProductPrice(0);
		setExternalProductQuantity(1);
		onExternalClose();
	}

	function updateOrderItem(itemId: string, field: "amount", value: number) {
		if (!store || !order) return;

		setOrder((prev) => {
			if (!prev) return prev;

			const updatedItems = prev.cart.items.map((item) => {
				if (item.product.id === itemId) {
					return { ...item, [field]: value };
				}
				return item;
			});

			const cartCost = getCartCost({
				cart: updatedItems,
				discounts: discounts,
				deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
				freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
				isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
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
	}

	function removeOrderItem(itemId: string) {
		if (!store || !order) return;

		setOrder((prev) => {
			if (!prev) return prev;
			const updatedItems = prev.cart.items.filter((item) => item.product.id !== itemId);

			const cartCost = getCartCost({
				cart: updatedItems,
				discounts: discounts,
				deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
				freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
				isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
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
	}

	async function saveChanges() {
		if (!order) return;

		const res = await appApi.admin.updateOrder({ order });
		if (res?.success) {
			navigate({ to: "admin.order", params: { id: order.id } });
		}
	}

	function cancelChanges() {
		navigate({ to: "admin.order", params: { id: order?.id || "" } });
	}

    console.log("order", order);

	if (!order) {
		return (
			<div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
				<div className="text-gray-500">{t("common:loading")}</div>
			</div>
		);
	}

	return (
		<div
			className={`min-h-screen bg-gray-50 p-4 md:p-6 ${isRTL ? "rtl" : "ltr"}`}
			dir={isRTL ? "rtl" : "ltr"}
		>
			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center gap-4 mb-4">
					<Button
						variant="light"
						isIconOnly
						onPress={cancelChanges}
						className={isRTL ? "rotate-180" : ""}
					>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
						{t("ordersPage:orderDetails.products.editTitle", "Edit Order Products")}
					</h1>
				</div>
				<p className="text-sm text-gray-600">
					{t("ordersPage:orderDetails.products.orderId")}: {order.id}
				</p>
			</div>

			{/* Changes Summary */}
			{changes.length > 0 && (
				<Card className="shadow-sm mb-6">
					<CardBody className="p-4 md:p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4 text-start">
							{t("ordersPage:orderDetails.products.changesSummary", "Changes Summary")}
						</h3>
						<div className="space-y-2">
							{changes.map((change) => (
								<div
									key={change.productId}
									className={`flex items-center justify-between p-3 rounded-lg ${
										change.type === "added"
											? "bg-green-50 border border-green-200"
											: change.type === "removed"
												? "bg-red-50 border border-red-200"
												: "bg-yellow-50 border border-yellow-200"
									}`}
								>
									<div className="flex items-center gap-3">
										{change.type === "added" && (
											<Check className="w-5 h-5 text-green-600" />
										)}
										{change.type === "removed" && (
											<X className="w-5 h-5 text-red-600" />
										)}
										{change.type === "modified" && (
											<Chip size="sm" color="warning" variant="flat">
												{t("common:modified", "Modified")}
											</Chip>
										)}
										<span className="font-medium text-gray-900">
											{change.productName}
										</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										{change.type === "added" && (
											<span className="text-green-700 font-medium">
												+{change.newValue} {t("common:units", "units")}
											</span>
										)}
										{change.type === "removed" && (
											<span className="text-red-700 font-medium">
												-{change.oldValue} {t("common:units", "units")}
											</span>
										)}
										{change.type === "modified" && (
											<span className="text-yellow-700 font-medium">
												{change.oldValue} → {change.newValue} {t("common:units", "units")}
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</CardBody>
				</Card>
			)}

			{/* Products Table */}
			<Card className="shadow-sm mb-6">
				<CardBody className="p-4 md:p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold text-gray-900 text-start">
							{t("ordersPage:orderDetails.products.title")}
						</h3>
						<div className="flex gap-2">
							<Button
								color="primary"
								startContent={<Plus className="w-4 h-4" />}
								onPress={onOpen}
								size="sm"
							>
								{t("ordersPage:orderDetails.products.addProduct", "Add Product")}
							</Button>
							<Button
								color="secondary"
								variant="bordered"
								startContent={<Plus className="w-4 h-4" />}
								onPress={onExternalOpen}
								size="sm"
							>
								{t("ordersPage:orderDetails.products.addExternal", "Add External")}
							</Button>
						</div>
					</div>
					<div className="overflow-x-auto">
						<Table aria-label="Products table" removeWrapper>
							<TableHeader>
								<TableColumn className="text-start">
									{t("ordersPage:orderDetails.products.productName")}
								</TableColumn>
								<TableColumn className="text-start">
									{t("ordersPage:orderDetails.products.price")}
								</TableColumn>
								<TableColumn className="text-start">
									{t("ordersPage:orderDetails.products.quantity")}
								</TableColumn>
								<TableColumn className="text-start">
									{t("ordersPage:orderDetails.products.total")}
								</TableColumn>
								<TableColumn className="text-start">
									{t("common:actionsLabel")}
								</TableColumn>
							</TableHeader>
							<TableBody>
								{order.cart.items.map((item, index) => {
									const change = changes.find((c) => c.productId === item.product.id);
									return (
										<TableRow key={item.product.id || index}>
											<TableCell className="text-start">
												<div className="flex items-center gap-3">
													{change && (
														<Chip
															size="sm"
															color={
																change.type === "added"
																	? "success"
																	: change.type === "removed"
																		? "danger"
																		: "warning"
															}
															variant="flat"
														>
															{change.type === "added"
																? t("common:added", "Added")
																: change.type === "removed"
																	? t("common:removed", "Removed")
																	: t("common:modified", "Modified")}
														</Chip>
													)}
													<span className="font-medium text-gray-900">
														{item.product.name?.[0]?.value || t("common:emptyField")}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-gray-700 text-start">
												{formatter.price(item.finalPrice || item.originalPrice || 0)}
											</TableCell>
											<TableCell className="text-start">
												<Input
													type="number"
													min={0.01}
													step={0.01}
													value={item.amount.toString()}
													onChange={(e) =>
														updateOrderItem(
															item.product.id,
															"amount",
															parseFloat(e.target.value) || 0.01
														)
													}
													className="w-24"
													size="sm"
												/>
											</TableCell>
											<TableCell className="font-semibold text-gray-900 text-start">
												{formatter.price(
													(item.finalPrice || item.originalPrice || 0) * item.amount
												)}
											</TableCell>
											<TableCell className="text-start">
												<Button
													isIconOnly
													color="danger"
													variant="light"
													size="sm"
													onPress={() => removeOrderItem(item.product.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardBody>
			</Card>

			{/* Order Summary */}
			<Card className="shadow-sm mb-6">
				<CardBody className="p-4 md:p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4 text-start">
						{t("ordersPage:orderDetails.summary.title", "Order Summary")}
					</h3>
					<div className="space-y-3 text-sm text-start">
						{order.cart && (
							<>
								{(() => {
									const subtotal =
										order.cart.cartTotal -
										(order.cart.cartVat || 0) -
										(order.cart.cartDiscount || 0) -
										(order.cart.deliveryPrice || 0);
									return (
										<>
											<div className="flex justify-between text-gray-600">
												<span className="text-start">
													{t("ordersPage:orderDetails.summary.subtotal")}:
												</span>
												<span className="font-medium">{formatter.price(subtotal)}</span>
											</div>
											{order.cart.cartVat > 0 && (
												<div className="flex justify-between text-gray-600">
													<span className="text-start">
														{t("ordersPage:orderDetails.summary.tax")}:
													</span>
													<span className="font-medium">
														{formatter.price(order.cart.cartVat)}
													</span>
												</div>
											)}
											{order.cart.cartDiscount > 0 && (
												<div className="flex justify-between text-gray-600">
													<span className="text-start">
														{t("ordersPage:orderDetails.summary.discount")}:
													</span>
													<span className="font-medium">
														{formatter.price(order.cart.cartDiscount)}
													</span>
												</div>
											)}
											{order.cart.deliveryPrice !== undefined &&
												order.cart.deliveryPrice > 0 && (
													<div className="flex justify-between text-gray-600">
														<span className="text-start">
															{t("common:deliveryPrice")}:
														</span>
														<span className="font-medium">
															{formatter.price(order.cart.deliveryPrice)}
														</span>
													</div>
												)}
											<div className="border-t border-gray-200 pt-3 mt-3">
												<div className="flex justify-between items-center">
													<span className="text-lg font-bold text-gray-900 text-start">
														{t("ordersPage:orderDetails.summary.total")}:
													</span>
													<span className="text-xl font-bold text-gray-900">
														{formatter.price(order.cart.cartTotal)}
													</span>
												</div>
											</div>
										</>
									);
								})()}
							</>
						)}
					</div>
				</CardBody>
			</Card>

			{/* Action Buttons */}
			<div className={`flex gap-4 ${isRTL ? "justify-start" : "justify-end"}`}>
				<Button variant="bordered" onPress={cancelChanges}>
					{t("common:cancel")}
				</Button>
				<Button color="primary" onPress={saveChanges}>
					{t("common:save")}
				</Button>
			</div>

			{/* Add Product Modal */}
			<Modal isOpen={isOpen} onClose={onClose} size="2xl">
				<ModalContent>
					<ModalHeader>
						{t("ordersPage:orderDetails.products.addProduct", "Add Product")}
					</ModalHeader>
					<ModalBody>
						<div className="space-y-4">
							<Autocomplete
								label={t("ordersPage:orderDetails.products.searchProduct", "Search Product")}
								placeholder={t("ordersPage:orderDetails.products.searchPlaceholder", "Type to search...")}
								items={searchResults}
								onInputChange={handleProductSearch}
								onSelectionChange={(key) => setSelectedProduct(key as string)}
								isLoading={isSearching}
								allowsCustomValue={false}
							>
								{(product) => (
									<AutocompleteItem key={product.id} textValue={product.name[0].value}>
										<div className="flex flex-col">
											<span className="font-medium">{product.name[0].value}</span>
											<span className="text-sm text-gray-500">
												{formatter.price(product.price)}
											</span>
										</div>
									</AutocompleteItem>
								)}
							</Autocomplete>
							<Input
								label={t("ordersPage:orderDetails.products.quantity")}
								type="number"
								min={0.01}
								step={0.01}
								value={selectedQuantity.toString()}
								onChange={(e) =>
									setSelectedQuantity(parseFloat(e.target.value) || 0.01)
								}
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button variant="flat" onPress={onClose}>
							{t("common:cancel")}
						</Button>
						<Button
							color="primary"
							onPress={addProductToOrder}
							isDisabled={!selectedProduct || selectedQuantity <= 0}
						>
							{t("common:add")}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Add External Product Modal */}
			<Modal isOpen={isExternalOpen} onClose={onExternalClose} size="lg">
				<ModalContent>
					<ModalHeader>
						{t("ordersPage:orderDetails.products.addExternal", "Add External Product")}
					</ModalHeader>
					<ModalBody>
						<div className="space-y-4">
							<Input
								label={t("ordersPage:orderDetails.products.productName")}
								placeholder={t("ordersPage:orderDetails.products.namePlaceholder", "Enter product name...")}
								value={externalProductName}
								onChange={(e) => setExternalProductName(e.target.value)}
							/>
							<Input
								label={t("ordersPage:orderDetails.products.price")}
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
								label={t("ordersPage:orderDetails.products.quantity")}
								type="number"
								min={0.01}
								step={0.01}
								value={externalProductQuantity.toString()}
								onChange={(e) =>
									setExternalProductQuantity(parseFloat(e.target.value) || 0.01)
								}
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button variant="flat" onPress={onExternalClose}>
							{t("common:cancel")}
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
							{t("common:add")}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}

