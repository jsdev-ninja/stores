import { useEffect, useState, useCallback } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { Icon } from "@iconify/react";
import { TOrganization, TOrder } from "@jsdev_ninja/core";
import { Checkbox } from "@heroui/react";

export function CreateDeliveryNoteModal({
	onDeliveryNoteCreated,
}: {
	onDeliveryNoteCreated?: () => void;
}) {
	const appApi = useAppApi();
	const { t } = useTranslation(["common"]);

	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [orders, setOrders] = useState<TOrder[]>([]);
	const [isLoadingOrders, setIsLoadingOrders] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
	const [selectedOrder, setSelectedOrder] = useState<TOrder | null>(null);
	const [deliveryNoteDate, setDeliveryNoteDate] = useState<string>(
		new Date().toISOString().split("T")[0]
	);
	const [sendEmailToClient, setSendEmailToClient] = useState<boolean>(true);
	const [isCreating, setIsCreating] = useState(false);
	const [nameOnInvoice, setNameOnInvoice] = useState<string>("");

	// Load organizations on mount
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

	// Get organization name helper
	const getOrganizationName = useCallback(
		(organizationId?: string) => {
			if (!organizationId) return "ללא ארגון";
			const org = organizations.find((o) => o.id === organizationId);
			return org?.name || "לא ידוע";
		},
		[organizations]
	);

	// Load orders from all organizations for selected month
	const loadOrders = useCallback(async () => {
		setIsLoadingOrders(true);
		setSelectedOrder(null);
		try {
			const { fromDate, toDate } = getMonthRange(selectedMonth);
			const allOrders: TOrder[] = [];

			try {
				const result = await appApi.admin.getOrdersForDeliveryNote({
					fromDate,
					toDate,
				});

				if (result?.success && result.data) {
					allOrders.push(...result.data);
				}
			} catch (error) {
				console.error(`Failed to fetch orders`, error);
			}

			// Sort by date descending
			allOrders.sort((a, b) => b.date - a.date);
			setOrders(allOrders);
		} catch (error) {
			console.error("Failed to fetch orders:", error);
			setOrders([]);
		} finally {
			setIsLoadingOrders(false);
		}
	}, [selectedMonth]);

	// Auto-load orders when month changes
	useEffect(() => {
		loadOrders();
	}, [selectedMonth, loadOrders]);

	const handleMonthChange = (newMonth: Date) => {
		setSelectedMonth(newMonth);
	};

	const handleOrderSelect = (order: TOrder) => {
		setSelectedOrder(order);
		setDeliveryNoteDate(new Date().toISOString().split("T")[0]);
		setSendEmailToClient(true);
		setNameOnInvoice(order.nameOnInvoice || order.client?.displayName || "");
	};

	const handleCreateDeliveryNote = async () => {
		if (!selectedOrder) return;

		setIsCreating(true);
		try {
			const dateTimestamp = new Date(deliveryNoteDate).getTime();

			console.log("selectedOrder", {
				date: dateTimestamp,
				nameOnInvoice: nameOnInvoice,
				sendEmailToClient,
			});
			const result = await appApi.admin.createDeliveryNote(selectedOrder, {
				date: dateTimestamp,
				nameOnInvoice: nameOnInvoice,
				sendEmailToClient,
			});
			if (result?.success) {
				onDeliveryNoteCreated?.();
				modalApi.closeModal("createDeliveryNote");
			} else {
				console.error("Failed to create delivery note:", result);
				alert("שגיאה ביצירת תעודת משלוח");
			}
		} catch (error) {
			console.error("Failed to create delivery note:", error);
			alert("שגיאה ביצירת תעודת משלוח");
		} finally {
			setIsCreating(false);
		}
	};

	const monthDisplay = selectedMonth.toLocaleDateString("he-IL", {
		year: "numeric",
		month: "long",
	});

	const handlePreviousMonth = () => {
		handleMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
	};

	const handleNextMonth = () => {
		handleMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
	};

	// Show order details form when order is selected
	if (selectedOrder) {
		return (
			<Modal
				scrollBehavior="inside"
				placement="top-center"
				isOpen
				onClose={() => modalApi.closeModal("createDeliveryNote")}
				size="md"
			>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<h3 className="text-lg font-semibold">יצירת תעודת משלוח</h3>
						<p className="text-sm text-default-500">הזמנה #{selectedOrder.id}</p>
					</ModalHeader>
					<ModalBody className="p-4 md:p-5 grid grid-cols-1 gap-4">
						{/* Order Details */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="text-sm text-blue-800">
								<div className="font-medium mb-2">פרטי הזמנה:</div>
								<div>ארגון: {getOrganizationName(selectedOrder.organizationId)}</div>
								<div>לקוח: {selectedOrder.client?.displayName}</div>
								<div>
									תאריך הזמנה: {new Date(selectedOrder.date).toLocaleDateString("he-IL")}
								</div>
								<div>סכום: ₪{selectedOrder.cart.cartTotal.toFixed(2)}</div>
							</div>
						</div>

						{/* Name on Invoice */}
						<div className="flex flex-col gap-2">
							<label className="block text-sm font-medium text-gray-900 dark:text-white">
								שם בחשבונית
							</label>
							<input
								type="text"
								value={nameOnInvoice}
								onChange={(e) => setNameOnInvoice(e.target.value)}
								placeholder={selectedOrder.client?.displayName || ""}
								className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<p className="text-xs text-gray-500">ניתן לערוך את השם שיופיע בחשבונית</p>
						</div>

						{/* Delivery Note Date */}
						<div className="flex flex-col gap-2">
							<label className="block text-sm font-medium text-gray-900 dark:text-white">
								תאריך תעודת משלוח
							</label>
							<input
								type="date"
								value={deliveryNoteDate}
								onChange={(e) => setDeliveryNoteDate(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{/* Send Email Checkbox */}
						<div className="flex items-center gap-2">
							<Checkbox
								isSelected={sendEmailToClient}
								onValueChange={setSendEmailToClient}
								aria-label="שלח אימייל ללקוח"
							>
								שלח אימייל ללקוח
							</Checkbox>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							onPress={() => setSelectedOrder(null)}
							color="danger"
							variant="light"
							isDisabled={isCreating}
						>
							{t("cancel")}
						</Button>
						<Button color="primary" onPress={handleCreateDeliveryNote} isLoading={isCreating}>
							יצירת תעודת משלוח
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}

	return (
		<Modal
			scrollBehavior="inside"
			placement="top-center"
			isOpen
			onClose={() => modalApi.closeModal("createDeliveryNote")}
			size="2xl"
		>
			<ModalContent className="max-w-[90vw]">
				<ModalHeader className="flex flex-col gap-1">
					<h3 className="text-lg font-semibold">{t("createDeliveryNote")}</h3>
					<p className="text-sm text-default-500">בחר חודש להצגת הזמנות</p>
				</ModalHeader>
				<ModalBody className="p-4 md:p-5 grid grid-cols-1 gap-4">
					{/* Month Navigation */}
					<div className="bg-gray-50 rounded-lg p-4">
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

					{/* Orders List */}
					{isLoadingOrders && (
						<div className="flex justify-center py-4">
							<div className="text-sm text-gray-500">טוען הזמנות...</div>
						</div>
					)}

					{!isLoadingOrders && orders.length > 0 && (
						<div className="mt-4">
							<h4 className="text-lg font-medium mb-3">הזמנות ({orders.length})</h4>
							<div className="w-full overflow-x-auto border rounded-lg">
								<table className="w-full min-w-[1200px]">
									<thead className="bg-gray-50 sticky top-0">
										<tr>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												הזמנה
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												ארגון
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												תאריך
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												לקוח
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												שם בחשבונית
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												סכום
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												תעודת משלוח
											</th>
											<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
												סטטוס
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{orders.map((order) => (
											<tr
												key={order.id}
												className="hover:bg-gray-50 cursor-pointer"
												onClick={() => handleOrderSelect(order)}
											>
												<td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
													#{order.id}
												</td>
												<td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
													{getOrganizationName(order.organizationId)}
												</td>
												<td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
													{new Date(order.date).toLocaleDateString("he-IL")}
												</td>
												<td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
													{order.client?.displayName}
												</td>
												<td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
													{order.nameOnInvoice || order.client?.displayName || "-"}
												</td>
												<td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
													₪{order.cart.cartTotal.toFixed(2)}
												</td>
												<td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
													{order.deliveryNote?.number ||
													order.ezDeliveryNote?.doc_number ? (
														<div className="flex flex-col gap-1">
															{order.deliveryNote?.number && (
																<div className="text-xs">
																	תעודה: {order.deliveryNote.number}
																</div>
															)}
															{order.ezDeliveryNote?.doc_number && (
																<div className="text-xs">
																	EzCount: {order.ezDeliveryNote.doc_number}
																</div>
															)}
														</div>
													) : (
														<span className="text-gray-400">-</span>
													)}
												</td>
												<td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
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
					)}

					{!isLoadingOrders && orders.length === 0 && (
						<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<div className="flex items-center">
								<Icon icon="lucide:alert-circle" className="h-5 w-5 text-yellow-400 mr-2" />
								<div className="text-sm text-yellow-800">
									לא נמצאו הזמנות עבור החודש שנבחר
								</div>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						onPress={() => modalApi.closeModal("createDeliveryNote")}
						color="danger"
						variant="light"
					>
						{t("cancel")}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
