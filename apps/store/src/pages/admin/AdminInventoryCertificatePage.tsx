import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Input,
	NumberInput,
	Button,
	Select,
	SelectItem,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAppApi } from "src/appApi";
import { NewSupplierInvoiceSchema, TProduct, TSupplier, TSupplierInvoice } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";

// Helper function to round numbers
function round(value: number, digits = 2): number {
	const p = 10 ** digits;
	return Math.round((value + Number.EPSILON) * p) / p;
}

function marginPercentFromCostPrice(cost: number, price: number): number {
	if (cost <= 0 || price <= 0 || cost > price) return 0;

	const profit = price - cost;

	return round((profit / price) * 100);
}

function priceFromCostMarginPercent(cost: number, marginPercent: number): number {
	if (cost <= 0 || marginPercent <= 0) return 0;
	const margin = marginPercent / 100;
	return round(cost / (1 - margin));
}

export function AdminInventoryCertificatePage() {
	const { t } = useTranslation(["common"]);
	const appApi = useAppApi();

	// Document header state
	const [supplierInvoice, setSupplierInvoice] = useState<Partial<TSupplierInvoice>>({
		type: "SupplierInvoice",
		date: new Date().getTime(),
		invoiceNumber: "",
		rows: [],
		productsToUpdate: [],
	});

	// Suppliers state
	const [suppliers, setSuppliers] = useState<TSupplier[]>([]);

	// Save modal state
	const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

	// Debounce timers for SKU lookups
	const skuDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

	// Load suppliers on mount
	useEffect(() => {
		const loadSuppliers = async () => {
			try {
				const result = await appApi.admin.listSuppliers();
				if (result?.success) {
					setSuppliers((result.data || []) as TSupplier[]);
				}
			} catch (error) {
				console.error("Failed to load suppliers:", error);
			}
		};
		loadSuppliers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Cleanup debounce timers on unmount
	useEffect(() => {
		const timers = skuDebounceTimers.current;
		return () => {
			Object.values(timers).forEach((timer) => {
				if (timer) clearTimeout(timer);
			});
		};
	}, []);

	// Calculate profit percentage and net purchase value
	// Only auto-calculate when source fields change, but allow manual override
	const calculateRowValues = (
		row: TSupplierInvoice["rows"][number],
		changedField?: keyof TSupplierInvoice["rows"][number]
	): TSupplierInvoice["rows"][number] => {
		// If user manually edited calculated fields, don't auto-recalculate them
		const shouldAutoCalculate =
			changedField &&
			(changedField === "price" ||
				changedField === "purchasePrice" ||
				changedField === "profitPercentage" ||
				changedField === "quantity");

		if (!shouldAutoCalculate) {
			return row;
		}

		let profitPercentage = row.profitPercentage;
		let price = row.price;
		const priceWithoutVat = row.vat ? price / (1 + 18 / 100) : price;
		const purchasePrice = row.purchasePrice;
		const purchasePriceWithVat = round(purchasePrice * 1.18);

		if (changedField === "price" || changedField === "purchasePrice") {
			// calculate profit percentage (margin) on purchase price
			profitPercentage = marginPercentFromCostPrice(purchasePrice, priceWithoutVat);
		}

		if (changedField === "profitPercentage") {
			// calculate price from profit percentage margin (from top) and purchase price
			price = priceFromCostMarginPercent(purchasePriceWithVat, profitPercentage);
		}

		// Calculate totalPurchasePrice = quantity * purchasePrice
		const totalPurchasePrice = (row.quantity || 0) * purchasePrice;

		return {
			...row,
			profitPercentage: profitPercentage,
			price: price,
			purchasePrice: purchasePrice,
			totalPurchasePrice: round(totalPurchasePrice, 2),
		};
	};

	const loadProductBySku = async (rowId: string, sku: string) => {
		if (!sku || sku.trim() === "") return;

		try {
			const response = await appApi.system.getProductById({ id: sku });
			if (response?.success && response.data) {
				const product: TProduct = response.data;
				console.log("find product", product);
				setRows((prevRows) => {
					return prevRows.map((row) => {
						if (row.id === rowId) {
							// Store original product values for comparison
							const originalProduct =
								product.profitPercentage !== undefined
									? {
											purchasePrice: product.purchasePrice || 0,
											price: product.price || 0,
											profitPercentage: product.profitPercentage,
									  }
									: undefined;
							const updatedRow: TSupplierInvoice["rows"][number] = {
								...row,
								profitPercentage: product.profitPercentage ?? 0,
								itemName: product.name[0]?.value || "",
								price: product.price || 0,
								purchasePrice: product.purchasePrice || 0,
								vat: product.vat || false,
								...(originalProduct && { originalProduct }),
							};
							return calculateRowValues(updatedRow);
						}
						return row;
					});
				});
			}
		} catch (error) {
			console.error("Failed to load product by SKU:", error);
		}
	};

	// Helper to set rows
	const setRows = (
		updater:
			| TSupplierInvoice["rows"][number][]
			| ((prev: TSupplierInvoice["rows"][number][]) => TSupplierInvoice["rows"][number][])
	) => {
		setSupplierInvoice((prev: Partial<TSupplierInvoice>) => {
			const currentRows = (prev.rows || []) as TSupplierInvoice["rows"][number][];
			const newRows = typeof updater === "function" ? updater(currentRows) : updater;
			return {
				...prev,
				rows: newRows,
			};
		});
	};

	const updateRow = (id: string, field: keyof TSupplierInvoice["rows"][number], value: any) => {
		// Clear existing debounce timer for this row
		console.log("updateRow", id, field, value);
		if (skuDebounceTimers.current[id]) {
			clearTimeout(skuDebounceTimers.current[id]);
			delete skuDebounceTimers.current[id];
		}

		setRows((prevRows) => {
			const updatedRows = prevRows.map((row) => {
				if (row.id === id) {
					const updatedRow = { ...row, [field]: value };
					return calculateRowValues(updatedRow, field);
				}
				return row;
			});
			return updatedRows;
		});

		// If SKU field changed, debounce and load product
		if (field === "sku" && value && value.trim() !== "") {
			skuDebounceTimers.current[id] = setTimeout(() => {
				loadProductBySku(id, value);
			}, 1000);
		}
	};

	const addRow = (): string => {
		const newRow: TSupplierInvoice["rows"][number] = {
			id: `row-${Date.now()}-${Math.random()}`,
			rowNumber: supplierInvoice.rows?.length || 0 + 1,
			sku: "",
			itemName: "",
			quantity: 0,
			purchasePrice: 0,
			lineDiscount: 0,
			profitPercentage: 0,
			price: 0,
			totalPurchasePrice: 0,
			vat: true,
		};
		setRows((rows) => [...rows, newRow]);
		return newRow.id;
	};

	const removeRow = (id: string) => {
		setRows((prevRows) => {
			const filtered = prevRows.filter((row) => row.id !== id);
			// Update row numbers
			return filtered.map((row, index) => ({
				...row,
				rowNumber: index + 1,
			}));
		});
	};

	// Field order for navigation
	const fieldOrder: (keyof TSupplierInvoice["rows"][number])[] = [
		"sku",
		"itemName",
		"quantity",
		"purchasePrice",
		"lineDiscount",
		"profitPercentage",
		"price",
	];

	const handleKeyDown = (
		e: React.KeyboardEvent,
		rowId: string,
		currentField: keyof TSupplierInvoice["rows"][number]
	) => {
		if (e.key !== "Enter") return;

		// e.preventDefault();

		const currentIndex = fieldOrder.indexOf(currentField);
		const nextIndex = currentIndex + 1;

		// Find the current row element
		const currentRow = (e.target as HTMLElement).closest("tr");
		if (!currentRow) return;

		// If not the last field, move to next field in same row
		if (nextIndex < fieldOrder.length) {
			// Get all table cells in the row (skip rowNumber which is index 0)
			const cells = currentRow.querySelectorAll("td");
			// Field order: sku(1), itemName(2), quantity(3), purchasePrice(4), lineDiscount(5), profitPercentage(6), price(7)
			const nextCellIndex = nextIndex + 1; // +1 because rowNumber is at index 0
			if (cells[nextCellIndex]) {
				const nextInput = cells[nextCellIndex].querySelector("input") as HTMLInputElement;
				if (nextInput) {
					nextInput.focus();
					nextInput.select();
				}
			}
		} else {
			// Last field - move to first field of next row
			const currentRowIndex = supplierInvoice.rows?.findIndex((row) => row.id === rowId);
			if (
				currentRowIndex &&
				supplierInvoice.rows &&
				currentRowIndex < supplierInvoice.rows.length - 1
			) {
				// Move to next existing row
				const nextRow = currentRow.nextElementSibling as HTMLTableRowElement;
				if (nextRow) {
					const cells = nextRow.querySelectorAll("td");
					const firstInput = cells[1]?.querySelector("input") as HTMLInputElement; // Index 1 is sku
					if (firstInput) {
						firstInput.focus();
						firstInput.select();
					}
				}
			} else {
				// Last row - add new row and focus first field
				addRow();
				// Wait for DOM update
				setTimeout(() => {
					const allRows = document.querySelectorAll("tbody tr");
					const newRow = allRows[allRows.length - 1] as HTMLTableRowElement;
					if (newRow) {
						const cells = newRow.querySelectorAll("td");
						const firstInput = cells[1]?.querySelector("input") as HTMLInputElement; // Index 1 is sku
						if (firstInput) {
							firstInput.focus();
							firstInput.select();
						}
					}
				}, 0);
			}
		}
	};

	const columns = useMemo(
		() => [
			{ name: t("common:inventoryCertificatePage.rowNumber"), uid: "rowNumber" },
			{ name: t("common:sku"), uid: "sku" },
			{ name: t("common:inventoryCertificatePage.itemName"), uid: "itemName" },
			{ name: t("common:inventoryCertificatePage.quantity"), uid: "quantity" },
			{ name: t("common:inventoryCertificatePage.purchasePriceIn"), uid: "purchasePrice" },
			{ name: t("common:inventoryCertificatePage.lineDiscount"), uid: "lineDiscount" },
			{ name: t("common:inventoryCertificatePage.profitPercent"), uid: "profitPercentage" },
			{ name: t("common:inventoryCertificatePage.salesPriceFrom"), uid: "price" },
			{ name: t("common:inventoryCertificatePage.netPurchaseValue"), uid: "totalPurchasePrice" },
			{ name: t("common:actionsLabel"), uid: "actions" },
		],
		[t]
	);

	// Get products that will be updated (have originalProduct and changed values)
	const productsToUpdate = useMemo(() => {
		return (supplierInvoice.rows || [])
			.filter((row) => row.sku && row.originalProduct)
			.map((row) => {
				const original = row.originalProduct!;
				const hasChanges =
					original.purchasePrice !== row.purchasePrice ||
					original.price !== row.price ||
					(original.profitPercentage !== undefined &&
						original.profitPercentage !== row.profitPercentage) ||
					(original.profitPercentage === undefined && row.profitPercentage !== 0);

				if (!hasChanges) return null;

				return {
					sku: row.sku,
					itemName: row.itemName,
					oldPurchasePrice: original.purchasePrice,
					newPurchasePrice: row.purchasePrice,
					oldPrice: original.price,
					newPrice: row.price,
					oldProfitPercentage: original.profitPercentage,
					newProfitPercentage: row.profitPercentage,
				};
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);
	}, [supplierInvoice.rows]);

	const handleSave = () => {
		if (!supplierInvoice.supplier) {
			// TODO: Show error message
			return;
		}
		if (supplierInvoice.rows?.length === 0) {
			// TODO: Show error message
			return;
		}
		setIsSaveModalOpen(true);
	};

	// Helper to get date as string for the date input
	const documentDate = supplierInvoice.date
		? new Date(supplierInvoice.date).toISOString().split("T")[0]
		: "";

	// Helper to set date from date string
	const setDocumentDate = (dateString: string) => {
		setSupplierInvoice((prev: Partial<TSupplierInvoice>) => ({
			...prev,
			date: new Date(dateString).getTime(),
		}));
	};

	// Helper to get invoice number
	const invoiceNumber = supplierInvoice.invoiceNumber || "";

	// Helper to set invoice number
	const setInvoiceNumber = (value: string) => {
		setSupplierInvoice((prev: Partial<TSupplierInvoice>) => ({
			...prev,
			invoiceNumber: value,
		}));
	};

	// Helper to get selected supplier
	const selectedSupplier = supplierInvoice.supplier || null;

	// Helper to set selected supplier
	const setSelectedSupplier = (supplier: TSupplier | null) => {
		setSupplierInvoice((prev: Partial<TSupplierInvoice>) => ({
			...prev,
			supplier: supplier || undefined,
		}));
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">{t("common:inventoryCertificate")}</h1>
			</div>

			{/* Document Header Section */}
			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Input
						label={t("common:inventoryCertificatePage.documentDate")}
						type="date"
						value={documentDate}
						onValueChange={setDocumentDate}
					/>
					<Select
						label={t("common:inventoryCertificatePage.supplier")}
						selectedKeys={selectedSupplier ? [selectedSupplier.id] : []}
						onChange={(e) => {
							const supplier = suppliers.find((s) => s.id === e.target.value);
							setSelectedSupplier(supplier || null);
						}}
					>
						{suppliers.map((supplier) => (
							<SelectItem key={supplier.id}>
								{supplier.name} {supplier.code ? `(${supplier.code})` : ""}
							</SelectItem>
						))}
					</Select>
					<Input
						label={t("common:inventoryCertificatePage.invoiceNumber")}
						value={invoiceNumber}
						onValueChange={setInvoiceNumber}
					/>
				</div>
			</div>

			{/* Items Table */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-900">
						{t("common:inventoryCertificatePage.itemName")}
					</h2>
					<div className="flex gap-2">
						<Button
							color="primary"
							onPress={addRow}
							startContent={<Icon icon="lucide:plus" />}
						>
							{t("common:inventoryCertificatePage.addRow")}
						</Button>
						<Button
							color="success"
							onPress={handleSave}
							startContent={<Icon icon="lucide:save" />}
							isDisabled={!selectedSupplier || supplierInvoice.rows?.length === 0}
						>
							{t("common:inventoryCertificatePage.save" as any)}
						</Button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<Table
						aria-label="Inventory certificate items table"
						classNames={{
							wrapper: "shadow-none border border-gray-300",
							thead: "[&>tr]:border-b [&>tr]:border-gray-300",
							tbody: "[&>tr]:border-b [&>tr]:border-gray-300 [&>tr:last-child]:border-b",
							th: "text-[14px] leading-[22px] font-medium text-[#949CA9] bg-transparent p-0 border-r border-gray-300 [&:last-child]:border-r-0",
							td: "text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 [&:last-child]:border-r-0",
						}}
						removeWrapper
					>
						<TableHeader columns={columns}>
							{(column) => (
								<TableColumn
									key={column.uid}
									align={column.uid === "actions" ? "end" : "start"}
									width={column.uid === "rowNumber" ? 50 : undefined}
								>
									{column.name}
								</TableColumn>
							)}
						</TableHeader>
						<TableBody
							items={supplierInvoice.rows || []}
							emptyContent={t("common:inventoryCertificatePage.addRow")}
						>
							{(row) => (
								<TableRow key={row.id}>
									<TableCell>
										<div className="text-[14px] px-2 min-w-[50px]">{row.rowNumber}</div>
									</TableCell>
									<TableCell>
										<Input
											value={row.sku}
											onValueChange={(value) => updateRow(row.id, "sku", value)}
											onKeyDown={(e) => handleKeyDown(e, row.id, "sku")}
											aria-label={`${t("common:sku")} ${t(
												"common:inventoryCertificatePage.rowNumber"
											)} ${row.rowNumber}`}
											size="sm"
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<Input
											value={row.itemName}
											onValueChange={(value) => updateRow(row.id, "itemName", value)}
											onKeyDown={(e) => handleKeyDown(e, row.id, "itemName")}
											aria-label={`${t("common:inventoryCertificatePage.itemName")} ${t(
												"common:inventoryCertificatePage.rowNumber"
											)} ${row.rowNumber}`}
											size="sm"
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<NumberInput
											value={row.quantity}
											onValueChange={(value) => {
												updateRow(row.id, "quantity", value ?? 0);
											}}
											onKeyDown={(e) => handleKeyDown(e, row.id, "quantity")}
											aria-label={`${t("common:inventoryCertificatePage.quantity")} ${t(
												"common:inventoryCertificatePage.rowNumber"
											)} ${row.rowNumber}`}
											size="sm"
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<NumberInput
											type="number"
											value={row.purchasePrice}
											onValueChange={(value) =>
												updateRow(row.id, "purchasePrice", value ?? 0)
											}
											onKeyDown={(e) => handleKeyDown(e, row.id, "purchasePrice")}
											aria-label={`${t(
												"common:inventoryCertificatePage.purchasePriceIn"
											)} ${t("common:inventoryCertificatePage.rowNumber")} ${
												row.rowNumber
											}`}
											size="sm"
											startContent={<span className="text-gray-500">₪</span>}
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<NumberInput
											value={row.lineDiscount}
											onValueChange={(value) =>
												updateRow(row.id, "lineDiscount", value ?? 0)
											}
											onKeyDown={(e) => handleKeyDown(e, row.id, "lineDiscount")}
											aria-label={`${t(
												"common:inventoryCertificatePage.lineDiscount"
											)} ${t("common:inventoryCertificatePage.rowNumber")} ${
												row.rowNumber
											}`}
											size="sm"
											endContent={<span className="text-gray-500">%</span>}
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<NumberInput
											value={row.profitPercentage}
											onValueChange={(value) =>
												updateRow(row.id, "profitPercentage", value ?? 0)
											}
											onKeyDown={(e) => handleKeyDown(e, row.id, "profitPercentage")}
											aria-label={`${t(
												"common:inventoryCertificatePage.profitPercent"
											)} ${t("common:inventoryCertificatePage.rowNumber")} ${
												row.rowNumber
											}`}
											size="sm"
											endContent={<span className="text-gray-500">%</span>}
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<NumberInput
											type="number"
											value={row.price}
											onValueChange={(value) => updateRow(row.id, "price", value ?? 0)}
											onKeyDown={(e) => handleKeyDown(e, row.id, "price")}
											aria-label={`${t(
												"common:inventoryCertificatePage.salesPriceFrom"
											)} ${t("common:inventoryCertificatePage.rowNumber")} ${
												row.rowNumber
											}`}
											size="sm"
											startContent={<span className="text-gray-500">₪</span>}
											classNames={{
												input: "text-[14px]",
												inputWrapper: "h-8 border-0 rounded-none m-0 bg-white",
												base: "w-full",
											}}
										/>
									</TableCell>
									<TableCell>
										<div className="min-w-[100px] text-right px-2">
											₪ {row.totalPurchasePrice.toFixed(2)}
										</div>
									</TableCell>
									<TableCell>
										<Button
											isIconOnly
											color="danger"
											variant="light"
											size="sm"
											onPress={() => removeRow(row.id)}
											aria-label={`${t("common:actionsLabel")} ${t(
												"common:inventoryCertificatePage.rowNumber"
											)} ${row.rowNumber}`}
										>
											<Icon icon="lucide:trash" />
										</Button>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Save Confirmation Modal */}
			<Modal
				isOpen={isSaveModalOpen}
				onClose={() => setIsSaveModalOpen(false)}
				size="5xl"
				scrollBehavior="inside"
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								{t("common:inventoryCertificatePage.saveModalTitle" as any)}
							</ModalHeader>
							<ModalBody>
								<p className="text-gray-700 mb-4">
									{t("common:inventoryCertificatePage.saveModalDescription" as any)}
								</p>
								{productsToUpdate.length > 0 ? (
									<div className="overflow-x-auto">
										<Table
											aria-label="Products comparison table"
											classNames={{
												wrapper: "shadow-none border border-gray-300",
												thead: "[&>tr]:border-b [&>tr]:border-gray-300",
												tbody: "[&>tr]:border-b [&>tr]:border-gray-300",
												th: "text-[14px] leading-[22px] font-medium text-[#949CA9] bg-gray-50 p-2 border-r border-gray-300 [&:last-child]:border-r-0",
												td: "text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 [&:last-child]:border-r-0",
											}}
											removeWrapper
										>
											<TableHeader>
												<TableColumn>{t("common:sku")}</TableColumn>
												<TableColumn>
													{t("common:inventoryCertificatePage.itemName")}
												</TableColumn>
												<TableColumn>
													{t("common:inventoryCertificatePage.purchasePriceIn")}
												</TableColumn>
												<TableColumn>
													{t("common:inventoryCertificatePage.salesPriceFrom")}
												</TableColumn>
												<TableColumn>
													{t("common:inventoryCertificatePage.profitPercent")}
												</TableColumn>
											</TableHeader>
											<TableBody items={productsToUpdate}>
												{(item) => (
													<TableRow key={item.sku}>
														<TableCell>
															<div className="font-medium">{item.sku}</div>
														</TableCell>
														<TableCell>{item.itemName || "-"}</TableCell>
														<TableCell>
															<div className="flex flex-col gap-1">
																<div className="text-red-600 line-through">
																	₪ {item.oldPurchasePrice.toFixed(2)}
																</div>
																<div className="text-green-600 font-medium">
																	₪ {item.newPurchasePrice.toFixed(2)}
																</div>
															</div>
														</TableCell>
														<TableCell>
															<div className="flex flex-col gap-1">
																<div className="text-red-600 line-through">
																	₪ {item.oldPrice.toFixed(2)}
																</div>
																<div className="text-green-600 font-medium">
																	₪ {item.newPrice.toFixed(2)}
																</div>
															</div>
														</TableCell>
														<TableCell>
															<div className="flex flex-col gap-1">
																{item.oldProfitPercentage !== undefined && (
																	<div className="text-red-600 line-through">
																		{item.oldProfitPercentage.toFixed(2)}%
																	</div>
																)}
																<div className="text-green-600 font-medium">
																	{item.newProfitPercentage.toFixed(2)}%
																</div>
															</div>
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
								) : (
									<p className="text-gray-500 text-center py-4">
										{t("common:inventoryCertificatePage.noProductsToUpdate" as any)}
									</p>
								)}
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:actions.cancel")}
								</Button>
								<Button
									color="primary"
									onPress={async () => {
										// TODO: Implement actual save logic
										console.log("Save supplier invoice", {
											supplierInvoice: {
												...supplierInvoice,
												rows: supplierInvoice.rows || [],
												productsToUpdate: productsToUpdate,
											},
										});
										// is valid schema
										const isValid = NewSupplierInvoiceSchema.safeParse(supplierInvoice);
										if (!isValid.success) {
											console.error("Invalid supplier invoice", isValid.error);
											return;
										}
										await appApi.admin.uploadSupplierInvoice({
											...isValid.data,
											productsToUpdate: productsToUpdate,
											id: FirebaseApi.firestore.generateDocId("supplierInvoices"),
										});
										onClose();
									}}
									isDisabled={productsToUpdate.length === 0}
								>
									{t("common:inventoryCertificatePage.confirmSave" as any)}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
