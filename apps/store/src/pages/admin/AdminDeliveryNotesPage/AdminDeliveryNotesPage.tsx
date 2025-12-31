import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { Icon } from "@iconify/react";
import { modalApi } from "src/infra/modals";
import { TOrder, TOrganization } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";

export default function AdminDeliveryNotesPage() {
	const { t } = useTranslation(["common", "admin"]);
	const [deliveryNotes, setDeliveryNotes] = useState<TOrder[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

	const appApi = useAppApi();

	// Calculate month range
	const getMonthRange = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);
		return {
			fromDate: firstDay.getTime(),
			toDate: lastDay.getTime(),
		};
	};

	// Load delivery notes for selected month
	const loadDeliveryNotes = useCallback(async () => {
		setIsLoading(true);
		try {
			const { fromDate, toDate } = getMonthRange(selectedMonth);
			const result = await appApi.admin.getDeliveryNotes({ fromDate, toDate });
			if (result?.success) {
				setDeliveryNotes(result.data || []);
			}
		} catch (error) {
			console.error("Failed to load delivery notes:", error);
		} finally {
			setIsLoading(false);
		}
	}, [selectedMonth]);

	// Load delivery notes when month changes
	useEffect(() => {
		loadDeliveryNotes();
	}, [loadDeliveryNotes]);

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

	const handleCreateDeliveryNote = () => {
		modalApi.openModal("createDeliveryNote", {
			onDeliveryNoteCreated: () => {
				loadDeliveryNotes();
			},
		});
	};

	const handlePreviousMonth = () => {
		setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
	};

	const handleNextMonth = () => {
		setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
	};

	const monthDisplay = selectedMonth.toLocaleDateString("he-IL", {
		year: "numeric",
		month: "long",
	});

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

	return (
		<div className="p-6">
			<div className="mb-6">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">{t("deliveryNotes")}</h1>
						<p className="text-gray-600 mt-2">{t("deliveryNotesManagement")}</p>
					</div>
					<Button
						color="primary"
						onPress={handleCreateDeliveryNote}
						startContent={<Icon icon="lucide:plus" />}
					>
						{t("createDeliveryNote")}
					</Button>
				</div>
			</div>

			{/* Month Filter */}
			<div className="mb-6 bg-white rounded-lg shadow p-4">
				<div className="flex items-center justify-between">
					<Button
						variant="light"
						size="sm"
						onPress={handlePreviousMonth}
						startContent={<Icon icon="lucide:chevron-right" />}
					>
						חודש קודם
					</Button>
					<div className="text-lg font-semibold text-gray-900">{monthDisplay}</div>
					<Button
						variant="light"
						size="sm"
						onPress={handleNextMonth}
						endContent={<Icon icon="lucide:chevron-left" />}
					>
						חודש הבא
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="bg-white rounded-lg shadow p-6">
					<div className="text-center py-8">
						<div className="text-gray-400 mb-4">
							<Icon icon="lucide:loader-2" className="mx-auto h-8 w-8 animate-spin" />
						</div>
						<p className="text-gray-500">{t("loading")}</p>
					</div>
				</div>
			) : deliveryNotes.length > 0 ? (
				<div className="bg-white rounded-lg shadow">
					<div className="px-6 py-4 border-b border-gray-200">
						<div>
						<h3 className="text-lg font-medium text-gray-900">
							{t("admin:deliveryNotesPage.deliveryNotesTitle")} ({deliveryNotes.length})
						</h3>
						<p className="text-sm text-gray-500 mt-1">
							{t("admin:deliveryNotesPage.deliveryNotesDescription")}
						</p>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.deliveryNoteNumber")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.invoiceNumber")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.order")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.date")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.client")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.organization")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.billingAccount")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.amount")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin:deliveryNotesPage.status")}
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{deliveryNotes.map((order) => (
									<tr key={order.id} className="hover:bg-gray-50">
										{/* Delivery Note Number */}
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.ezDeliveryNote?.doc_number ? (
												<a
													href={order.deliveryNote?.link}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:text-blue-800 underline"
												>
													{order.ezDeliveryNote.doc_number}
												</a>
											) : (
												"-"
											)}
										</td>
										{/* Invoice Number */}
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.ezInvoice?.doc_number ? order.ezInvoice.doc_number : "-"}
										</td>
										<td className="px-6 py-4 text-sm font-medium text-gray-900">
											#{order.id.slice(-8)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{new Date(order.date).toLocaleDateString("he-IL")}
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{order.client?.displayName}
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
				</div>
			) : (
				<div className="bg-white rounded-lg shadow p-6">
					<div className="text-center py-8">
						<div className="text-gray-400 mb-4">
							<Icon icon="lucide:file-text" className="mx-auto h-12 w-12" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							{t("admin:deliveryNotesPage.noOrdersFound")}
						</h3>
						<p className="text-gray-500">
							{t("admin:deliveryNotesPage.noOrdersFoundDescription")}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

