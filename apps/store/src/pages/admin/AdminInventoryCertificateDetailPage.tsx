import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAppApi } from "src/appApi";
import { TSupplierInvoice } from "@jsdev_ninja/core";
import { useParams, navigate } from "src/navigation";

// Helper function to round numbers
function round(value: number, digits = 2): number {
	const p = 10 ** digits;
	return Math.round((value + Number.EPSILON) * p) / p;
}

export function AdminInventoryCertificateDetailPage() {
	const { t } = useTranslation(["common"]);
	const appApi = useAppApi();
	const { id } = useParams("admin.inventoryCertificateDetail");

	const [supplierInvoice, setSupplierInvoice] = useState<TSupplierInvoice | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			loadSupplierInvoice(id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const loadSupplierInvoice = async (invoiceId: string) => {
		setLoading(true);
		setError(null);
		try {
			const result = await appApi.admin.getSupplierInvoice(invoiceId);
			if (result?.success && result.data) {
				setSupplierInvoice(result.data);
			} else {
				setError(t("common:inventoryCertificatePage.noInvoices" as any) || "Invoice not found");
			}
		} catch (error) {
			console.error("Failed to load supplier invoice:", error);
			setError("Failed to load invoice");
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		navigate({ to: "admin.inventoryCertificate" });
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
		],
		[t]
	);

	// Calculate totals for summary
	const invoiceSummary = useMemo(() => {
		if (!supplierInvoice?.rows) {
			return {
				totalBeforeVat: 0,
				totalVat: 0,
				totalWithVat: 0,
			};
		}

		const rows = supplierInvoice.rows;
		let totalBeforeVat = 0;
		let totalVat = 0;

		rows.forEach((row) => {
			const purchasePriceAfterDiscount =
				row.purchasePrice * (1 - (row.lineDiscount || 0) / 100);
			const rowTotal = (row.quantity || 0) * purchasePriceAfterDiscount;

			totalBeforeVat += rowTotal;

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
	}, [supplierInvoice?.rows]);

	if (loading) {
		return (
			<div className="w-full p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-lg text-start">{t("common:loading")}</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="text-lg text-red-500 mb-4 text-start">{error}</div>
						<Button onPress={handleBack} startContent={<Icon icon="lucide:arrow-right" />}>
							{t("common:back")}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!supplierInvoice) {
		return (
			<div className="w-full p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="text-lg mb-4 text-start">
							{t("common:inventoryCertificatePage.noInvoices" as any) || "Invoice not found"}
						</div>
						<Button onPress={handleBack} startContent={<Icon icon="lucide:arrow-right" />}>
							{t("common:back")}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const documentDate = supplierInvoice.date
		? new Date(supplierInvoice.date).toLocaleDateString()
		: "-";

	return (
		<div className="p-6">
			<div className="flex items-center gap-4 mb-6">
				<Button
					variant="light"
					onPress={handleBack}
					startContent={<Icon icon="lucide:arrow-right" />}
				>
					{t("common:back")}
				</Button>
				<h1 className="text-2xl font-bold text-gray-900">
					{t("common:inventoryCertificate")} #{supplierInvoice.invoiceNumber || supplierInvoice.id.slice(-8)}
				</h1>
			</div>

			{/* Document Header */}
			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
							{t("common:inventoryCertificatePage.documentDate")}
						</label>
						<div className="text-lg text-start">{documentDate}</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
							{t("common:inventoryCertificatePage.supplier")}
						</label>
						<div className="text-lg text-start">
							{supplierInvoice.supplier?.name || "-"}
							{supplierInvoice.supplier?.code && ` (${supplierInvoice.supplier.code})`}
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
							{t("common:inventoryCertificatePage.invoiceNumber")}
						</label>
						<div className="text-lg text-start">
							{supplierInvoice.invoiceNumber || "-"}
						</div>
					</div>
				</div>
			</div>

			{/* Items Table */}
			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">
					{t("common:inventoryCertificatePage.itemName")}
				</h2>

				<div className="overflow-x-auto">
					<Table
						aria-label="Inventory certificate items table"
						classNames={{
							wrapper: "shadow-none border border-gray-300",
							thead: "[&>tr]:border-b [&>tr]:border-gray-300",
							tbody: "[&>tr]:border-b [&>tr]:border-gray-300 [&>tr:last-child]:border-b",
							th: "text-[14px] leading-[22px] font-medium text-[#949CA9] bg-transparent p-2 border-r border-gray-300 [&:last-child]:border-r-0",
							td: "text-[14px] leading-[22px] text-[#282828] p-2 border-r border-gray-300 [&:last-child]:border-r-0",
						}}
						removeWrapper
					>
						<TableHeader columns={columns}>
							{(column) => (
								<TableColumn
									key={column.uid}
									align={column.uid === "totalPurchasePrice" ? "end" : "start"}
									width={column.uid === "rowNumber" ? 50 : undefined}
								>
									{column.name}
								</TableColumn>
							)}
						</TableHeader>
						<TableBody
							items={supplierInvoice.rows || []}
							emptyContent={t("common:inventoryCertificatePage.addRow") || "No items"}
						>
							{(row) => (
								<TableRow key={row.id}>
									<TableCell>
										<div className="text-[14px] px-2 min-w-[50px]">{row.rowNumber}</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">{row.sku || "-"}</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">{row.itemName || "-"}</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">{row.quantity || 0}</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">₪ {row.purchasePrice.toFixed(2)}</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">
											{row.lineDiscount ? `${row.lineDiscount}%` : "0%"}
										</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">
											{row.profitPercentage ? `${row.profitPercentage.toFixed(2)}%` : "0%"}
										</div>
									</TableCell>
									<TableCell>
										<div className="text-[14px]">₪ {row.price.toFixed(2)}</div>
									</TableCell>
									<TableCell>
										<div className="min-w-[100px] text-right px-2">
											₪ {row.totalPurchasePrice.toFixed(2)}
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Summary Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">
					{t("common:inventoryCertificatePage.summary" as any)}
				</h2>
				<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
			</div>
		</div>
	);
}
