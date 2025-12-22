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
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAppApi } from "src/appApi";
import { TProduct } from "@jsdev_ninja/core";

// Helper function to round numbers
function round(value: number, digits = 2): number {
	const p = 10 ** digits;
	return Math.round((value + Number.EPSILON) * p) / p;
}

function marginPercentFromCostPrice(cost: number, price: number): number {
	if (cost <= 0 || price <= 0) return 0;

	const profit = price - cost;
	if (profit <= 0) return 0; // UI-friendly: no negative margins

	return round((profit / price) * 100);
}

function priceFromCostMarginPercent(cost: number, marginPercent: number): number {
	if (cost <= 0 || marginPercent <= 0) return 0;
	return round(cost / (1 - marginPercent / 100));
}

interface InventoryCertificateRow {
	id: string;
	rowNumber: number;
	sku: string;
	itemName: string;
	quantity: number; // quantity of units
	purchasePrice: number; // purchase price per unit
	lineDiscount: number; // line discount percentage (on purchase price)
	profitPercentage: number; // profit percentage (margin) on purchase price
	price: number; // product price
	totalPurchasePrice: number; // quantity * purchasePrice
	vat: boolean;
}

export function AdminInventoryCertificatePage() {
	const { t } = useTranslation(["common"]);
	const appApi = useAppApi();

	// Document header state
	const [documentDate, setDocumentDate] = useState<string>(new Date().toISOString().split("T")[0]);
	const [supplierNumber, setSupplierNumber] = useState<string>("");
	const [invoiceNumber, setInvoiceNumber] = useState<string>("");

	// Table rows state
	const [rows, setRows] = useState<InventoryCertificateRow[]>([]);

	// Debounce timers for SKU lookups
	const skuDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

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
		row: InventoryCertificateRow,
		changedField?: keyof InventoryCertificateRow
	): InventoryCertificateRow => {
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

		if (changedField === "price" || changedField === "purchasePrice") {
			// calculate profit percentage (margin) on purchase price
			profitPercentage = marginPercentFromCostPrice(purchasePrice, priceWithoutVat);
		}

		if (changedField === "profitPercentage") {
			// calculate price from profit percentage margin (from top) and purchase price
			price = priceFromCostMarginPercent(purchasePrice, profitPercentage);
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
							const updatedRow: InventoryCertificateRow = {
								...row,
								itemName: product.name[0]?.value || "",
								price: product.price || 0,
								purchasePrice: product.purchasePrice || 0,
								vat: product.vat || false,
							};
							return calculateRowValues(updatedRow, "purchasePrice");
						}
						return row;
					});
				});
			}
		} catch (error) {
			console.error("Failed to load product by SKU:", error);
		}
	};

	const updateRow = (id: string, field: keyof InventoryCertificateRow, value: any) => {
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
		const newRow: InventoryCertificateRow = {
			id: `row-${Date.now()}-${Math.random()}`,
			rowNumber: rows.length + 1,
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
		setRows(rows => [...rows, newRow]);
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
	const fieldOrder: (keyof InventoryCertificateRow)[] = [
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
		currentField: keyof InventoryCertificateRow
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
			const currentRowIndex = rows.findIndex((row) => row.id === rowId);
			if (currentRowIndex < rows.length - 1) {
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
					<Input
						label={t("common:inventoryCertificatePage.supplier")}
						value={supplierNumber}
						onValueChange={setSupplierNumber}
						type="number"
					/>
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
					<Button color="primary" onPress={addRow} startContent={<Icon icon="lucide:plus" />}>
						{t("common:inventoryCertificatePage.addRow")}
					</Button>
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
							items={rows}
							emptyContent={t("common:inventoryCertificatePage.addRow")}
						>
							{(row) => (
								<TableRow key={row.id}>
									<TableCell>
										<div className="text-[14px] px-2 min-w-[50px]">
											{row.rowNumber}
										</div>
									</TableCell>
									<TableCell>
										<Input
											value={row.sku}
											onValueChange={(value) => updateRow(row.id, "sku", value)}
											onKeyDown={(e) => handleKeyDown(e, row.id, "sku")}
											aria-label={`${t("common:sku")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											aria-label={`${t("common:inventoryCertificatePage.itemName")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											aria-label={`${t("common:inventoryCertificatePage.quantity")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											aria-label={`${t("common:inventoryCertificatePage.purchasePriceIn")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											aria-label={`${t("common:inventoryCertificatePage.lineDiscount")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											aria-label={`${t("common:inventoryCertificatePage.profitPercent")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											value={row.price}
											onValueChange={(value) => updateRow(row.id, "price", value ?? 0)}
											onKeyDown={(e) => handleKeyDown(e, row.id, "price")}
											aria-label={`${t("common:inventoryCertificatePage.salesPriceFrom")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
											aria-label={`${t("common:actionsLabel")} ${t("common:inventoryCertificatePage.rowNumber")} ${row.rowNumber}`}
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
		</div>
	);
}
