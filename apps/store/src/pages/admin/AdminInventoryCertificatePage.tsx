import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	Table,
	Input,
	Button,
	Select,
	ListBox,
	Modal,
	Tabs,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAppApi } from "src/appApi";
import { NewSupplierInvoiceSchema, TProduct, TSupplier, TSupplierInvoice } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";
import { useStore } from "src/domains/Store";
import type { Key } from "react-aria-components";

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

	const store = useStore();
	const isVatIncludedInPrice = store?.isVatIncludedInPrice ?? false;
	// Document header state
	const [supplierInvoice, setSupplierInvoice] = useState<Partial<TSupplierInvoice>>({
		type: "SupplierInvoice",
		date: new Date().getTime(),
		invoiceNumber: "",
		rows: [],
		productsToUpdate: [],
		supplier: undefined,
	});

	// Suppliers state
	const [suppliers, setSuppliers] = useState<TSupplier[]>([]);

	// Save modal state
	const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

	// Tab state
	const [activeTab, setActiveTab] = useState<string>("create");

	// Supplier invoices list state (for view tab)
	const [supplierInvoices, setSupplierInvoices] = useState<TSupplierInvoice[]>([]);

	// Debounce timers for SKU lookups
	const skuDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

	// Raw (in-progress) text for numeric inputs, so the user can freely type
	// decimals like "8.04" without the value being normalized mid-typing.
	// Keyed by `${rowId}:${field}`. Cleared on blur so the display normalizes.
	const [rawNumericInputs, setRawNumericInputs] = useState<Record<string, string>>({});

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

	// Load supplier invoices when view tab is active
	useEffect(() => {
		if (activeTab === "view") {
			const loadSupplierInvoices = async () => {
				try {
					const result = await appApi.admin.listSupplierInvoices();
					if (result?.success) {
						setSupplierInvoices((result.data || []) as TSupplierInvoice[]);
					}
				} catch (error) {
					console.error("Failed to load supplier invoices:", error);
				}
			};
			loadSupplierInvoices();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

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
				changedField === "lineDiscount" ||
				changedField === "quantity");

		if (!shouldAutoCalculate) {
			return row;
		}

		let profitPercentage = row.profitPercentage;
		let price = row.price;
		const priceWithoutVat = isVatIncludedInPrice && row.vat ? price / (1 + 18 / 100) : price;
		const purchasePrice = row.purchasePrice;
		let purchasePriceAfterDiscount = purchasePrice;
		if (row.lineDiscount) {
			purchasePriceAfterDiscount = purchasePrice * (1 - row.lineDiscount / 100);
		}
		const purchasePriceWithVat = isVatIncludedInPrice && row.vat
			? round(purchasePriceAfterDiscount * 1.18)
			: purchasePriceAfterDiscount;

		if (
			changedField === "price" ||
			changedField === "purchasePrice" ||
			changedField === "lineDiscount"
		) {
			// calculate profit percentage (margin) on purchase price
			profitPercentage = marginPercentFromCostPrice(purchasePriceAfterDiscount, priceWithoutVat);
		}

		if (changedField === "profitPercentage") {
			// calculate price from profit percentage margin (from top) and purchase price
			price = priceFromCostMarginPercent(purchasePriceWithVat, profitPercentage);
		}

		// Calculate totalPurchasePrice = quantity * purchasePrice
		const totalPurchasePrice = (row.quantity || 0) * purchasePriceAfterDiscount;

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

	const rawNumericKey = (rowId: string, field: keyof TSupplierInvoice["rows"][number]) =>
		`${rowId}:${field}`;

	// Value to display in a numeric input: the user's in-progress text if they
	// are currently typing, otherwise the normalized number ("" for 0).
	const getNumericInputValue = (
		row: TSupplierInvoice["rows"][number],
		field: keyof TSupplierInvoice["rows"][number]
	): string => {
		const key = rawNumericKey(row.id, field);
		if (key in rawNumericInputs) return rawNumericInputs[key];
		const num = row[field] as number;
		return num === 0 ? "" : String(num);
	};

	const handleNumericChange = (
		rowId: string,
		field: keyof TSupplierInvoice["rows"][number],
		rawValue: string
	) => {
		setRawNumericInputs((prev) => ({ ...prev, [rawNumericKey(rowId, field)]: rawValue }));
		updateRow(rowId, field, Number(rawValue) || 0);
	};

	const handleNumericBlur = (
		rowId: string,
		field: keyof TSupplierInvoice["rows"][number]
	) => {
		setRawNumericInputs((prev) => {
			const next = { ...prev };
			delete next[rawNumericKey(rowId, field)];
			return next;
		});
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

	// Calculate totals for summary
	const invoiceSummary = useMemo(() => {
		const rows = supplierInvoice.rows || [];

		let totalBeforeVat = 0;
		let totalVat = 0;

		rows.forEach((row) => {
			// Calculate purchase price after discount
			const purchasePriceAfterDiscount = row.purchasePrice * (1 - (row.lineDiscount || 0) / 100);
			// Total for this row (quantity * price after discount)
			const rowTotal = (row.quantity || 0) * purchasePriceAfterDiscount;

			totalBeforeVat += rowTotal;

			// If VAT applies, calculate VAT (18%)
			if (row.vat) {
				totalVat += rowTotal * 0.18;
			}
		});

		const totalWithVat = totalBeforeVat + totalVat;

		return {
			totalBeforeVat: round(totalBeforeVat, 2),
			totalVat: round(totalVat, 2),
			totalWithVat: round(totalWithVat, 2),
		};
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
	const setDocumentDate = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSupplierInvoice((prev: Partial<TSupplierInvoice>) => ({
			...prev,
			date: new Date(e.target.value).getTime(),
		}));
	};

	// Helper to get invoice number
	const invoiceNumber = supplierInvoice.invoiceNumber || "";

	// Helper to set invoice number
	const setInvoiceNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSupplierInvoice((prev: Partial<TSupplierInvoice>) => ({
			...prev,
			invoiceNumber: e.target.value,
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

	// View tab columns
	const viewColumns = useMemo(
		() => [
			{ name: t("common:inventoryCertificatePage.documentDate"), uid: "date" },
			{ name: t("common:inventoryCertificatePage.supplier"), uid: "supplier" },
			{ name: t("common:inventoryCertificatePage.invoiceNumber"), uid: "invoiceNumber" },
			{ name: t("common:inventoryCertificatePage.totalWithVat"), uid: "total" },
			{ name: t("common:inventoryCertificatePage.rowsCount"), uid: "rowsCount" },
		],
		[t]
	);

	// Build create tab content (defined outside JSX to allow Tabs.Panel children)
	const createTabContent = (
		<div className="mt-6">
			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">
							{t("common:inventoryCertificatePage.documentDate")}
						</label>
						<Input
							type="date"
							value={documentDate}
							onChange={setDocumentDate}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">
							{t("common:inventoryCertificatePage.supplier")}
						</label>
						<Select
							selectedKey={selectedSupplier?.id || null}
							onSelectionChange={(key: Key | null) => {
								const supplier = suppliers.find((s) => s.id === String(key));
								setSelectedSupplier(supplier || null);
							}}
						>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{suppliers.map((supplier) => (
										<ListBox.Item
											id={supplier.id}
											key={supplier.id}
											textValue={`${supplier.name}${supplier.code ? ` (${supplier.code})` : ""}`}
										>
											{supplier.name} {supplier.code ? `(${supplier.code})` : ""}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">
							{t("common:inventoryCertificatePage.invoiceNumber")}
						</label>
						<Input
							value={invoiceNumber}
							onChange={setInvoiceNumber}
						/>
					</div>
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
							variant="primary"
							onPress={addRow}
						>
							<Icon icon="lucide:plus" />
							{t("common:inventoryCertificatePage.addRow")}
						</Button>
						<Button
							variant="primary"
							onPress={handleSave}
							isDisabled={!selectedSupplier || supplierInvoice.rows?.length === 0}
						>
							<Icon icon="lucide:save" />
							{t("common:inventoryCertificatePage.save")}
						</Button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<Table aria-label="Inventory certificate items table" className="shadow-none border border-gray-300">
						<Table.ScrollContainer>
							<Table.Content>
								<Table.Header>
									{columns.map((column) => (
										<Table.Column
											key={column.uid}
											isRowHeader={column.uid === "rowNumber"}
											className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-transparent p-0 border-r border-gray-300 last:border-r-0"
										>
											{column.name}
										</Table.Column>
									))}
								</Table.Header>
								<Table.Body
									items={supplierInvoice.rows || []}
									renderEmptyState={() => (
										<div className="text-center p-4">
											{t("common:inventoryCertificatePage.addRow")}
										</div>
									)}
								>
									{(row) => (
										<Table.Row id={row.id}>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<div className="text-[14px] px-2 min-w-[50px]">{row.rowNumber}</div>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<Input
													value={row.sku}
													onChange={(e) => updateRow(row.id, "sku", e.target.value)}
													onKeyDown={(e) => handleKeyDown(e, row.id, "sku")}
													aria-label={`${t("common:sku")} ${t(
														"common:inventoryCertificatePage.rowNumber"
													)} ${row.rowNumber}`}
													className="h-8 w-full bg-white text-[14px]"
												/>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<Input
													value={row.itemName}
													onChange={(e) => updateRow(row.id, "itemName", e.target.value)}
													onKeyDown={(e) => handleKeyDown(e, row.id, "itemName")}
													aria-label={`${t("common:inventoryCertificatePage.itemName")} ${t(
														"common:inventoryCertificatePage.rowNumber"
													)} ${row.rowNumber}`}
													className="h-8 w-full bg-white text-[14px]"
												/>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<Input
													type="number"
													value={getNumericInputValue(row, "quantity")}
													onChange={(e) => handleNumericChange(row.id, "quantity", e.target.value)}
													onBlur={() => handleNumericBlur(row.id, "quantity")}
													onKeyDown={(e) => handleKeyDown(e, row.id, "quantity")}
													aria-label={`${t("common:inventoryCertificatePage.quantity")} ${t(
														"common:inventoryCertificatePage.rowNumber"
													)} ${row.rowNumber}`}
													className="h-8 w-full bg-white text-[14px]"
												/>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<div className="relative">
													<span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[14px] pointer-events-none">₪</span>
													<Input
														type="number"
														value={getNumericInputValue(row, "purchasePrice")}
														onChange={(e) =>
															handleNumericChange(row.id, "purchasePrice", e.target.value)
														}
														onBlur={() => handleNumericBlur(row.id, "purchasePrice")}
														onKeyDown={(e) => handleKeyDown(e, row.id, "purchasePrice")}
														aria-label={`${t(
															"common:inventoryCertificatePage.purchasePriceIn"
														)} ${t("common:inventoryCertificatePage.rowNumber")} ${
															row.rowNumber
														}`}
														className="h-8 w-full bg-white text-[14px] pl-6"
													/>
												</div>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<div className="relative">
													<Input
														type="number"
														value={getNumericInputValue(row, "lineDiscount")}
														onChange={(e) =>
															handleNumericChange(row.id, "lineDiscount", e.target.value)
														}
														onBlur={() => handleNumericBlur(row.id, "lineDiscount")}
														onKeyDown={(e) => handleKeyDown(e, row.id, "lineDiscount")}
														aria-label={`${t(
															"common:inventoryCertificatePage.lineDiscount"
														)} ${t("common:inventoryCertificatePage.rowNumber")} ${
															row.rowNumber
														}`}
														className="h-8 w-full bg-white text-[14px] pr-6"
													/>
													<span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[14px] pointer-events-none">%</span>
												</div>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<div className="relative">
													<Input
														type="number"
														value={getNumericInputValue(row, "profitPercentage")}
														onChange={(e) =>
															handleNumericChange(row.id, "profitPercentage", e.target.value)
														}
														onBlur={() => handleNumericBlur(row.id, "profitPercentage")}
														onKeyDown={(e) => handleKeyDown(e, row.id, "profitPercentage")}
														aria-label={`${t(
															"common:inventoryCertificatePage.profitPercent"
														)} ${t("common:inventoryCertificatePage.rowNumber")} ${
															row.rowNumber
														}`}
														className="h-8 w-full bg-white text-[14px] pr-6"
													/>
													<span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[14px] pointer-events-none">%</span>
												</div>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<div className="relative">
													<span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[14px] pointer-events-none">₪</span>
													<Input
														type="number"
														value={getNumericInputValue(row, "price")}
														onChange={(e) => handleNumericChange(row.id, "price", e.target.value)}
														onBlur={() => handleNumericBlur(row.id, "price")}
														onKeyDown={(e) => handleKeyDown(e, row.id, "price")}
														aria-label={`${t(
															"common:inventoryCertificatePage.salesPriceFrom"
														)} ${t("common:inventoryCertificatePage.rowNumber")} ${
															row.rowNumber
														}`}
														className="h-8 w-full bg-white text-[14px] pl-6"
													/>
												</div>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<div className="min-w-[100px] text-right px-2">
													₪ {row.totalPurchasePrice.toFixed(2)}
												</div>
											</Table.Cell>
											<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-0 border-r border-gray-300 last:border-r-0">
												<Button
													variant="danger"
													onPress={() => removeRow(row.id)}
													aria-label={`${t("common:actionsLabel")} ${t(
														"common:inventoryCertificatePage.rowNumber"
													)} ${row.rowNumber}`}
												>
													<Icon icon="lucide:trash" />
												</Button>
											</Table.Cell>
										</Table.Row>
									)}
								</Table.Body>
							</Table.Content>
						</Table.ScrollContainer>
					</Table>
				</div>
			</div>

			{/* Save Confirmation Modal */}
			<Modal.Backdrop isOpen={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>
								{t("common:inventoryCertificatePage.saveModalTitle")}
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p className="text-gray-700 mb-4">
								{t("common:inventoryCertificatePage.saveModalDescription")}
							</p>

							{productsToUpdate.length > 0 ? (
								<div className="overflow-x-auto">
									<Table aria-label="Products comparison table" className="shadow-none border border-gray-300">
										<Table.ScrollContainer>
											<Table.Content>
												<Table.Header>
													<Table.Column isRowHeader className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-gray-50 p-2 border-r border-gray-300 last:border-r-0">
														{t("common:sku")}
													</Table.Column>
													<Table.Column className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-gray-50 p-2 border-r border-gray-300 last:border-r-0">
														{t("common:inventoryCertificatePage.itemName")}
													</Table.Column>
													<Table.Column className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-gray-50 p-2 border-r border-gray-300 last:border-r-0">
														{t("common:inventoryCertificatePage.purchasePriceIn")}
													</Table.Column>
													<Table.Column className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-gray-50 p-2 border-r border-gray-300 last:border-r-0">
														{t("common:inventoryCertificatePage.salesPriceFrom")}
													</Table.Column>
													<Table.Column className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-gray-50 p-2 border-r border-gray-300 last:border-r-0">
														{t("common:inventoryCertificatePage.profitPercent")}
													</Table.Column>
												</Table.Header>
												<Table.Body items={productsToUpdate}>
													{(item) => (
														<Table.Row id={item.sku}>
															<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
																<div className="font-medium">{item.sku}</div>
															</Table.Cell>
															<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
																{item.itemName || "-"}
															</Table.Cell>
															<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
																<div className="flex flex-col gap-1">
																	<div className="text-red-600 line-through">
																		₪ {item.oldPurchasePrice.toFixed(2)}
																	</div>
																	<div className="text-green-600 font-medium">
																		₪ {item.newPurchasePrice.toFixed(2)}
																	</div>
																</div>
															</Table.Cell>
															<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
																<div className="flex flex-col gap-1">
																	<div className="text-red-600 line-through">
																		₪ {item.oldPrice.toFixed(2)}
																	</div>
																	<div className="text-green-600 font-medium">
																		₪ {item.newPrice.toFixed(2)}
																	</div>
																</div>
															</Table.Cell>
															<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
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
															</Table.Cell>
														</Table.Row>
													)}
												</Table.Body>
											</Table.Content>
										</Table.ScrollContainer>
									</Table>
								</div>
							) : (
								<p className="text-gray-500 text-center py-4">
									{t("common:inventoryCertificatePage.noProductsToUpdate")}
								</p>
							)}
							{/* Summary Section */}
							<div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">
									{t("common:inventoryCertificatePage.summary" as any)}
								</h3>
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-gray-700">
											{t("common:inventoryCertificatePage.totalBeforeVat" as any)}:
										</span>
										<span className="font-medium text-gray-900">
											₪ {invoiceSummary.totalBeforeVat.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-700">
											{t("common:inventoryCertificatePage.vatAmount" as any)}:
										</span>
										<span className="font-medium text-gray-900">
											₪ {invoiceSummary.totalVat.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center pt-2 border-t border-gray-300">
										<span className="text-lg font-semibold text-gray-900">
											{t("common:inventoryCertificatePage.totalWithVat" as any)}:
										</span>
										<span className="text-lg font-bold text-gray-900">
											₪ {invoiceSummary.totalWithVat.toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={() => setIsSaveModalOpen(false)}>
								{t("common:actions.cancel")}
							</Button>
							<Button
								variant="primary"
								onPress={async () => {
									// TODO: Implement actual save logic
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
										vat: invoiceSummary.totalVat,
										total: invoiceSummary.totalWithVat,
										totalBeforeVat: invoiceSummary.totalBeforeVat,
									});
									setIsSaveModalOpen(false);
									// Refresh supplier invoices list if view tab is active
									if (activeTab === "view") {
										const result = await appApi.admin.listSupplierInvoices();
										if (result?.success) {
											setSupplierInvoices((result.data || []) as TSupplierInvoice[]);
										}
									}
								}}
							>
								{t("common:inventoryCertificatePage.confirmSave")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);

	const viewTabContent = (
		<div className="mt-6">
			<div className="bg-white rounded-lg shadow p-6">
				<Table aria-label="Supplier invoices table" className="shadow-none border border-gray-300">
					<Table.ScrollContainer>
						<Table.Content>
							<Table.Header>
								{viewColumns.map((column) => (
									<Table.Column
										key={column.uid}
										isRowHeader={column.uid === "date"}
										className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-transparent p-2 border-r border-gray-300 last:border-r-0"
									>
										{column.name}
									</Table.Column>
								))}
							</Table.Header>
							<Table.Body
								items={supplierInvoices}
								renderEmptyState={() => (
									<div className="text-center p-4">
										{t("common:inventoryCertificatePage.noInvoices")}
									</div>
								)}
							>
								{(invoice) => (
									<Table.Row
										id={invoice.id}
										className="cursor-pointer hover:bg-gray-50"
										onClick={() => {
											navigate({
												to: "admin.inventoryCertificateDetail",
												params: { id: invoice.id },
											});
										}}
									>
										<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
											{new Date(invoice.date).toLocaleDateString()}
										</Table.Cell>
										<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
											{invoice.supplier?.name || "-"}
											{invoice.supplier?.code && ` (${invoice.supplier.code})`}
										</Table.Cell>
										<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
											{invoice.invoiceNumber || "-"}
										</Table.Cell>
										<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0 text-right">
											₪ {invoice.total?.toFixed(2) || "0.00"}
										</Table.Cell>
										<Table.Cell className="text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 last:border-r-0">
											{invoice.rows?.length || 0}
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</div>
		</div>
	);

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">{t("common:inventoryCertificate")}</h1>
			</div>

			<Tabs
				selectedKey={activeTab}
				onSelectionChange={(key) => setActiveTab(key as string)}
				aria-label="Inventory certificate tabs"
			>
				<Tabs.List>
					<Tabs.Tab id="create">{t("common:inventoryCertificatePage.createTab")}</Tabs.Tab>
					<Tabs.Tab id="view">{t("common:inventoryCertificatePage.viewTab")}</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel id="create">{createTabContent}</Tabs.Panel>
				<Tabs.Panel id="view">{viewTabContent}</Tabs.Panel>
			</Tabs>
		</div>
	);
}
