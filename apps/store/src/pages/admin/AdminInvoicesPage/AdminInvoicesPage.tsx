import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { Icon } from "@iconify/react";
import { modalApi } from "src/infra/modals";
import { TOrder, TOrganization } from "@jsdev_ninja/core";
import { Checkbox } from "@heroui/react";
import { useAppApi } from "src/appApi";

export default function AdminInvoicesPage() {
	const { t } = useTranslation(["common"]);
	const [orders, setOrders] = useState<TOrder[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);

	const appApi = useAppApi();

	const handleOrdersFound = (foundOrders: TOrder[]) => {
		setOrders(foundOrders);
		setHasSearched(true);
		setSelectedOrders(new Set()); // Clear selection when new orders are loaded
	};

	const handleCreateInvoice = () => {
		modalApi.openModal("createInvoice", { onOrdersFound: handleOrdersFound });
	};

	// Load organizations on component mount
	useEffect(() => {
		const loadOrganizations = async () => {
			try {
				const result = await appApi.admin.listOrganizations();
				if (result?.success) {
					setOrganizations(result.data || []);
				}
			} catch (error) {
				console.error("Failed to load organizations:", error);
			}
		};
		loadOrganizations();
	}, []);

	// Helper functions to get organization and billing account names
	const getOrganizationName = (orgId: string) => {
		const org = organizations.find((o) => o.id === orgId);
		return org?.name || "לא ידוע";
	};

	const getBillingAccountName = (orgId: string, billingAccountNumber: string) => {
		const org = organizations.find((o) => o.id === orgId);
		const account = org?.billingAccounts.find((acc) => acc.number === billingAccountNumber);
		return account ? `${account.name} (${account.number})` : "לא נבחר";
	};

	// Computed values for selection
	const isAllSelected = useMemo(() => {
		return orders.length > 0 && selectedOrders.size === orders.length;
	}, [orders.length, selectedOrders.size]);

	const isIndeterminate = useMemo(() => {
		return selectedOrders.size > 0 && selectedOrders.size < orders.length;
	}, [selectedOrders.size, orders.length]);

	// Selection handlers
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedOrders(new Set(orders.map((order) => order.id)));
		} else {
			setSelectedOrders(new Set());
		}
	};

	const handleSelectOrder = (orderId: string, checked: boolean) => {
		const newSelected = new Set(selectedOrders);
		if (checked) {
			newSelected.add(orderId);
		} else {
			newSelected.delete(orderId);
		}
		setSelectedOrders(newSelected);
	};

	const handleOpenInvoiceDetailsModal = () => {
		if (selectedOrders.size === 0) return;

		const selectedOrderData: TOrder[] = Array.from(selectedOrders).map(
			(orderId) => orders.find((order) => order.id === orderId)!
		);

		modalApi.openModal("invoiceDetails", {
			selectedOrders: selectedOrderData,
			onInvoiceCreated: () => {
				// Clear selection after invoice is created
				setSelectedOrders(new Set());
				// Optionally reload orders or show success message
			},
		});
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">{t("invoices")}</h1>
						<p className="text-gray-600 mt-2">ניהול חשבוניות ותשלומים</p>
					</div>
					<Button
						color="primary"
						onPress={handleCreateInvoice}
						startContent={<Icon icon="lucide:plus" />}
					>
						{t("createInvoice")}
					</Button>
				</div>
			</div>

			{hasSearched && orders.length > 0 ? (
				<div className="bg-white rounded-lg shadow">
					<div className="px-6 py-4 border-b border-gray-200">
						<div className="flex justify-between items-center">
							<div>
								<h3 className="text-lg font-medium text-gray-900">
									הזמנות שנמצאו ({orders.length})
								</h3>
								<p className="text-sm text-gray-500 mt-1">
									הזמנות עבור הארגון והתאריכים שנבחרו
								</p>
							</div>
							{selectedOrders.size > 0 && (
								<div className="flex items-center gap-2">
									<span className="text-sm text-gray-600">
										נבחרו {selectedOrders.size} הזמנות
									</span>
									<Button
										size="sm"
										color="danger"
										variant="light"
										onPress={() => setSelectedOrders(new Set())}
									>
										בטל בחירה
									</Button>
								</div>
							)}
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
										<Checkbox
											isSelected={isAllSelected}
											isIndeterminate={isIndeterminate}
											onValueChange={handleSelectAll}
											aria-label="בחר הכל"
										/>
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										מספר חשבונית
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										מספר תעודת משלוח
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										הזמנה
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										תאריך
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										לקוח
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										ארגון
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										חשבון חיוב
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										סכום
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										סטטוס
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{orders.map((order) => (
									<tr
										key={order.id}
										className={`hover:bg-gray-50 ${
											selectedOrders.has(order.id) ? "bg-blue-50" : ""
										}`}
									>
										<td className="px-6 py-4 text-sm font-medium text-gray-900 w-12">
											<Checkbox
												isSelected={selectedOrders.has(order.id)}
												onValueChange={(checked) =>
													handleSelectOrder(order.id, checked)
												}
												aria-label={`בחר הזמנה ${order.id.slice(-8)}`}
											/>
										</td>
										{/* Invoice Number */}
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.ezInvoice?.doc_number ? order.ezInvoice.doc_number : "-"}
										</td>
										{/* Delivery Note Number */}
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.ezDeliveryNote?.doc_number ? order?.ezDeliveryNote.doc_number : "-"}
										</td>
										<td className="px-6 py-4 text-sm font-medium text-gray-900">
											#{order.id.slice(-8)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{new Date(order.date).toLocaleDateString("he-IL")}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.client.displayName}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{getOrganizationName(order.organizationId || "")}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.billingAccount
												? getBillingAccountName(
														order.organizationId || "",
														order.billingAccount.number
												  )
												: "לא נבחר"}
										</td>
										<td className="px-6 py-4 text-sm font-medium text-gray-900">
											₪{order.cart.cartTotal.toFixed(2)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													order.status === "completed"
														? "bg-green-100 text-green-800"
														: order.status === "pending"
														? "bg-yellow-100 text-yellow-800"
														: order.status === "processing"
														? "bg-blue-100 text-blue-800"
														: order.status === "cancelled"
														? "bg-red-100 text-red-800"
														: "bg-gray-100 text-gray-800"
												}`}
											>
												{order.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{selectedOrders.size > 0 && (
						<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-4">
									<span className="text-sm text-gray-600">
										{selectedOrders.size} הזמנות נבחרו
									</span>
									<Button
										size="sm"
										variant="light"
										onPress={() => setSelectedOrders(new Set())}
									>
										בטל בחירה
									</Button>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										color="primary"
										onPress={handleOpenInvoiceDetailsModal}
										startContent={<Icon icon="lucide:file-text" />}
									>
										צור חשבונית
									</Button>
									<Button
										size="sm"
										color="secondary"
										startContent={<Icon icon="lucide:download" />}
									>
										ייצא ל-Excel
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			) : hasSearched && orders.length === 0 ? (
				<div className="bg-white rounded-lg shadow p-6">
					<div className="text-center py-8">
						<div className="text-yellow-400 mb-4">
							<Icon icon="lucide:alert-circle" className="mx-auto h-12 w-12" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו הזמנות</h3>
						<p className="text-gray-500">לא נמצאו הזמנות עבור הארגון והתאריכים שנבחרו</p>
					</div>
				</div>
			) : (
				<div className="bg-white rounded-lg shadow p-6">
					<div className="text-center py-12">
						<div className="text-gray-400 mb-4">
							<svg
								className="mx-auto h-12 w-12"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">חשבוניות</h3>
						<p className="text-gray-500">כאן תוכל לנהל את כל החשבוניות והתשלומים</p>
					</div>
				</div>
			)}
		</div>
	);
}
