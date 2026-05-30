import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Selection } from "@react-types/shared";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { Button } from "src/components/button";
import { TOrder } from "src/domains/Order";
import { navigate } from "src/navigation";
import {
	Table,
	Modal,
	Dropdown,
	Pagination,
	Input,
	Select,
	ListBox,
	Avatar,
} from "@heroui/react";
import { Icon } from "src/components";
import { TOrganization } from "@jsdev_ninja/core";

// Helper for Avatar fallback initials
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getColumns = (t: any) => [
	{ name: t("ordersPage:columns.orderId"), uid: "id" },
	{ name: t("ordersPage:columns.customerName", "Customer Name"), uid: "customerName" },
	{ name: t("ordersPage:columns.createdBy", "Created By"), uid: "createdBy" },
	{ name: t("ordersPage:columns.paymentType", "Payment Type"), uid: "paymentType" },
	{ name: t("ordersPage:columns.sum"), uid: "total" },
	{ name: t("ordersPage:columns.date"), uid: "date" },
	{ name: t("ordersPage:columns.status"), uid: "status" },
	{ name: t("ordersPage:columns.actions", "Actions"), uid: "actions" },
];

const STATUS_COLORS: Record<TOrder["status"], string> = {
	completed: "#22c38f",
	pending: "#fea73e",
	cancelled: "#fc424a",
	processing: "#fea73e",
	in_delivery: "#fea73e",
	delivered: "#22c38f",
	draft: "#949ca9",
	refunded: "#fc424a",
};

function getStatusColor(status: TOrder["status"]): string {
	return STATUS_COLORS[status] ?? "#949ca9";
}

function AdminOrdersPages() {
	const appApi = useAppApi();
	const { t, i18n } = useTranslation(["common", "ordersPage"]);
	const isRTL = i18n.dir() === "rtl";

	const [orders, setOrders] = useState<TOrder[]>([]);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
	const [page, setPage] = useState(1);
	const [rowsPerPage] = useState(10);
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [orderToCancel, setOrderToCancel] = useState<TOrder | null>(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [filterData, setFilterData] = useState({
		orderId: "",
		customer: "",
		orderStatus: "",
		total: "",
		date: "",
	});

	const headerColumns = useMemo(() => getColumns(t), [t]);

	const items = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		const end = start + rowsPerPage;
		return orders.slice(start, end);
	}, [page, orders, rowsPerPage]);

	const pages = Math.ceil(orders.length / rowsPerPage) || 1;

	function updateOrder(id: string, status: TOrder["status"]) {
		setOrders((prev) =>
			prev.map((order) => (order.id === id ? { ...order, status } : order))
		);
	}

	useEffect(() => {
		appApi.admin.getStoreOrders().then((res) => {
			if (!res) return;
			setOrders(res.data);
		});
	}, []);

	useEffect(() => {
		appApi.admin.listOrganizations().then((res) => {
			if (res?.success) {
				setOrganizations(res.data || []);
			}
		});
	}, []);

	async function confirmCancelOrder() {
		if (!orderToCancel) return;
		const res = await appApi.admin.cancelOrder({ order: orderToCancel });
		if (!res?.success) {
			setIsCancelOpen(false);
			return;
		}
		updateOrder(orderToCancel.id, "cancelled");
		setIsCancelOpen(false);
		setOrderToCancel(null);
	}

	const getOrganizationName = useCallback(
		(organizationId?: string) => {
			if (!organizationId) return null;
			const org = organizations.find((o) => o.id === organizationId);
			return org?.name || null;
		},
		[organizations]
	);

	const renderCell = useCallback(
		(order: TOrder, columnKey: React.Key) => {
			switch (columnKey) {
				case "id":
					return (
						<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
							{order.id}
						</span>
					);
				case "customerName": {
					const customerName = order.client?.displayName || "-";
					const organizationName = getOrganizationName(order.organizationId);
					const billingAccount = order.billingAccount;

					const descriptionParts: string[] = [];
					if (organizationName) descriptionParts.push(organizationName);
					if (billingAccount)
						descriptionParts.push(`${billingAccount.name} (${billingAccount.number})`);
					const description =
						descriptionParts.length > 0 ? descriptionParts.join(" • ") : undefined;

					return (
						<div className="inline-flex items-center gap-2">
							<Avatar size="sm">
								<Avatar.Fallback>{getInitials(customerName)}</Avatar.Fallback>
							</Avatar>
							<div>
								<p className="text-[14px] leading-[22px] font-medium text-[#282828]">
									{customerName}
								</p>
								{description && (
									<p className="text-[12px] leading-[18px] font-normal text-[#949CA9]">
										{description}
									</p>
								)}
							</div>
						</div>
					);
				}
				case "createdBy":
					return (
						<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
							{order.createdBy
								? t(`ordersPage:createdBy.${order.createdBy}`, order.createdBy)
								: "-"}
						</span>
					);
				case "paymentType":
					return (
						<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
							{order.paymentType !== undefined && order.paymentType !== null
								? t(`common:paymentTypes.${order.paymentType}`, order.paymentType)
								: "-"}
						</span>
					);
				case "total":
					return (
						<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
							<Price price={order.cart.cartTotal} />
						</span>
					);
				case "date":
					return (
						<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
							<DateView date={order.date} />
						</span>
					);
				case "status": {
					const statusColor = getStatusColor(order.status);
					return (
						<div className="flex gap-[9px] items-center">
							<div
								className="rounded-[4.5px] size-[7px]"
								style={{ backgroundColor: statusColor }}
							/>
							<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
								{t(`common:orderStatutes.${order.status}`, order.status)}
							</span>
						</div>
					);
				}
				case "actions":
					return (
						<div className="flex justify-end">
							<OrderActionsDropdown
								order={order}
								onCancel={() => {
									setOrderToCancel(order);
									setIsCancelOpen(true);
								}}
							/>
						</div>
					);
				default:
					return null;
			}
		},
		[t, getOrganizationName]
	);

	const topContent = useMemo(() => {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex justify-between gap-3 items-center">
					<h1 className="text-[24px] leading-[36px] font-medium text-[#282828]">
						{t("ordersPage:title", "הזמנות שלי")}
					</h1>
					<Button
						className="bg-[#009EF7] text-white"
						onPress={() => {
							// TODO: Navigate to create order page
						}}
					>
						<Icon name="edit" size="sm" />
						{t("ordersPage:createOrder", "צור הזמנה")}
					</Button>
				</div>
				<div className="flex gap-[20px] items-center">
					<Button
						variant="ghost"
						onPress={() => setIsFilterOpen(true)}
					>
						<Icon name="search" size="sm" />
						{t("ordersPage:filters.filters", "סינונים")}
					</Button>
				</div>
			</div>
		);
	}, [t]);

	const bottomContent = useMemo(() => {
		if (pages <= 1) return null;
		return (
			<div className="py-2 px-2 flex justify-between items-center">
				<span className="text-[14px] leading-[22px] font-normal text-[#949CA9]">
					{t("ordersPage:pagination.showing", "מציג {{start}} עד {{end}} פריטים", {
						start: orders.length > 0 ? (page - 1) * rowsPerPage + 1 : 0,
						end: Math.min(page * rowsPerPage, orders.length),
					})}
				</span>
				<Pagination className={isRTL ? "[&_svg]:scale-x-[-1]" : ""}>
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.Previous onPress={() => setPage((p) => Math.max(1, p - 1))}>
								{""}
							</Pagination.Previous>
						</Pagination.Item>
						{Array.from({ length: pages }, (_, i) => (
							<Pagination.Item key={i + 1}>
								<Pagination.Link
									isActive={page === i + 1}
									onPress={() => setPage(i + 1)}
								>
									{i + 1}
								</Pagination.Link>
							</Pagination.Item>
						))}
						<Pagination.Item>
							<Pagination.Next onPress={() => setPage((p) => Math.min(pages, p + 1))}>
								{""}
							</Pagination.Next>
						</Pagination.Item>
					</Pagination.Content>
				</Pagination>
			</div>
		);
	}, [pages, page, orders.length, rowsPerPage, isRTL, t]);

	return (
		<div className="flex flex-col gap-[20px] flex-grow">
			{/* Table */}
			<div className="bg-white rounded-[10px] px-[25px] py-[20px]">
				{topContent}
				<Table.ScrollContainer>
					<Table.Content
						aria-label="Orders table"
						selectionMode="multiple"
						selectedKeys={selectedKeys}
						onSelectionChange={setSelectedKeys}
						selectionBehavior="toggle"
						className="[&>thead>tr]:border-b [&>thead>tr]:border-[#E8E9EA] [&>tbody>tr]:border-b [&>tbody>tr]:border-[#E8E9EA] [&>tbody>tr:last-child]:border-0 [&>tbody>tr]:cursor-default"
					>
						<Table.Header>
							{headerColumns.map((column) => (
								<Table.Column
									key={column.uid}
									isRowHeader={column.uid === "id"}
									className="text-[14px] leading-[22px] font-medium text-[#949CA9] bg-transparent pb-[15px]"
								>
									{column.name}
								</Table.Column>
							))}
						</Table.Header>
						<Table.Body>
							{items.length === 0 ? (
								<Table.Row>
									<Table.Cell colSpan={headerColumns.length} className="text-center py-4">
										{t("ordersPage:noOrders", "אין הזמנות")}
									</Table.Cell>
								</Table.Row>
							) : (
								items.map((order) => (
									<Table.Row key={order.id}>
										{headerColumns.map((column) => (
											<Table.Cell
												key={column.uid}
												className="text-[14px] leading-[22px] text-[#282828] pb-[15px] pt-[15px]"
											>
												{renderCell(order, column.uid)}
											</Table.Cell>
										))}
									</Table.Row>
								))
							)}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
				{bottomContent}
			</div>

			{/* Filter Modal */}
			<Modal isOpen={isFilterOpen} onOpenChange={setIsFilterOpen}>
				<Modal.Backdrop />
				<Modal.Container size="lg" placement="center" className="max-w-[400px]">
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>
								{t("ordersPage:filters.filters", "סינונים")}
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="py-6">
							<div className="flex flex-col gap-5">
								{/* Order ID */}
								<div className="flex flex-col gap-[5px]">
									<label className="font-['Poppins:Medium',sans-serif] leading-[24px] text-[16px] text-[#949CA9]">
										{t("ordersPage:columns.orderId", "מזהה הזמנה")}
									</label>
									<Input
										value={filterData.orderId}
										onChange={(e) =>
											setFilterData((prev) => ({ ...prev, orderId: e.target.value }))
										}
										placeholder="#45240"
										className={
											filterData.orderId ? "border-[#009EF7]" : "border-[#E8E9EA]"
										}
									/>
								</div>

								{/* Customer */}
								<div className="flex flex-col gap-[5px]">
									<label className="font-['Poppins:Medium',sans-serif] leading-[24px] text-[16px] text-[#282828]">
										{t("ordersPage:columns.customerName", "לקוח")}
									</label>
									<Input
										value={filterData.customer}
										onChange={(e) =>
											setFilterData((prev) => ({ ...prev, customer: e.target.value }))
										}
										placeholder={t("ordersPage:filters.typeHere", "הקלד כאן")}
										className="border-[#E8E9EA]"
									/>
								</div>

								{/* Order Status and Total */}
								<div className="flex gap-[19px]">
									<div className="flex flex-col gap-[5px] flex-1">
										<label className="font-['Poppins:Medium',sans-serif] leading-[24px] text-[16px] text-[#949CA9]">
											{t("ordersPage:columns.status", "סטטוס הזמנה")}
										</label>
										<Select
											selectedKey={filterData.orderStatus || null}
											onSelectionChange={(key) => {
												setFilterData((prev) => ({
													...prev,
													orderStatus: (key as string) || "",
												}));
											}}
											placeholder={t("ordersPage:filters.selectStatus", "בחר סטטוס")}
										>
											<Select.Trigger className="border-[#E8E9EA]">
												<Select.Value className="text-[14px] font-['Poppins:Regular',sans-serif]" />
												<Select.Indicator />
											</Select.Trigger>
											<Select.Popover>
												<ListBox>
													<ListBox.Item id="pending" textValue={t("common:orderStatutes.pending", "בהמתנה")}>
														{t("common:orderStatutes.pending", "בהמתנה")}
													</ListBox.Item>
													<ListBox.Item id="processing" textValue={t("common:orderStatutes.processing", "מעבד")}>
														{t("common:orderStatutes.processing", "מעבד")}
													</ListBox.Item>
													<ListBox.Item id="in_delivery" textValue={t("common:orderStatutes.in_delivery", "במשלוח")}>
														{t("common:orderStatutes.in_delivery", "במשלוח")}
													</ListBox.Item>
													<ListBox.Item id="delivered" textValue={t("common:orderStatutes.delivered", "נמסר")}>
														{t("common:orderStatutes.delivered", "נמסר")}
													</ListBox.Item>
													<ListBox.Item id="completed" textValue={t("common:orderStatutes.completed", "הושלם")}>
														{t("common:orderStatutes.completed", "הושלם")}
													</ListBox.Item>
													<ListBox.Item id="cancelled" textValue={t("common:orderStatutes.cancelled", "בוטל")}>
														{t("common:orderStatutes.cancelled", "בוטל")}
													</ListBox.Item>
												</ListBox>
											</Select.Popover>
										</Select>
									</div>
									<div className="flex flex-col gap-[5px] flex-1">
										<label className="font-['Poppins:Medium',sans-serif] leading-[24px] text-[16px] text-[#282828]">
											{t("ordersPage:columns.sum", "סכום")}
										</label>
										<Input
											value={filterData.total}
											onChange={(e) =>
												setFilterData((prev) => ({ ...prev, total: e.target.value }))
											}
											placeholder={t("ordersPage:filters.typeHere", "הקלד כאן")}
											type="number"
											className="border-[#E8E9EA]"
										/>
									</div>
								</div>

								{/* Date */}
								<div className="flex flex-col gap-[5px]">
									<label className="font-['Poppins:Medium',sans-serif] leading-[24px] text-[16px] text-[#282828]">
										{t("ordersPage:columns.date", "תאריך")}
									</label>
									<Input
										value={filterData.date}
										onChange={(e) =>
											setFilterData((prev) => ({ ...prev, date: e.target.value }))
										}
										placeholder={t("ordersPage:filters.typeHere", "הקלד כאן")}
										type="date"
										className="border-[#E8E9EA]"
									/>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button
								variant="ghost"
								onPress={() => {
									setFilterData({
										orderId: "",
										customer: "",
										orderStatus: "",
										total: "",
										date: "",
									});
									setIsFilterOpen(false);
								}}
							>
								{t("common:actions.cancel", "ביטול")}
							</Button>
							<Button
								className="bg-[#009EF7] text-white"
								onPress={() => {
									// TODO: Apply filters
									setIsFilterOpen(false);
								}}
							>
								{t("ordersPage:filters.apply", "החל")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal>

			{/* Cancel Order Modal */}
			<Modal isOpen={isCancelOpen} onOpenChange={setIsCancelOpen}>
				<Modal.Backdrop />
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>
								{t("ordersPage:confirmCancel.title", "ביטול הזמנה")}
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p>
								{t(
									"ordersPage:confirmCancel.message",
									"האם אתה בטוח שברצונך לבטל את ההזמנה הזו?"
								)}
							</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={() => setIsCancelOpen(false)}>
								{t("common:actions.cancel", "Close")}
							</Button>
							<Button variant="danger" onPress={confirmCancelOrder}>
								{t("ordersPage:actions.cancelOrder")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal>
		</div>
	);
}

function OrderActionsDropdown({ order, onCancel }: { order: TOrder; onCancel: () => void }) {
	const { t } = useTranslation(["common", "ordersPage"]);

	return (
		<Dropdown>
			<Dropdown.Trigger>
				<button
					type="button"
					className="text-default-500"
					aria-label="Order actions"
				>
					<svg
						aria-hidden="true"
						fill="none"
						focusable="false"
						height={24}
						role="presentation"
						viewBox="0 0 24 24"
						width={24}
					>
						<path
							d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
							fill="currentColor"
						/>
					</svg>
				</button>
			</Dropdown.Trigger>
			<Dropdown.Popover>
				<Dropdown.Menu
					aria-label="Order actions"
					className="bg-white border border-[#E8E9EA] rounded-[4px] shadow-[0px_10px_20px_0px_rgba(95,95,95,0.15)] py-[11px] min-w-[165px]"
					onAction={(key) => {
						if (key === "view") {
							navigate({ to: "admin.order", params: { id: order.id } });
						} else if (key === "delete") {
							onCancel();
						}
					}}
				>
					<Dropdown.Item
						id="view"
						textValue={t("ordersPage:actions.viewDetails", "צפה בפרטים")}
						className="text-[14px] leading-[22px] font-medium text-[#009EF7] pl-[20px] pr-[15px] gap-[10px] py-[9px] data-[hover=true]:bg-[#E9F2FA]"
					>
						<span className="text-[#009EF7]">
							<Icon name="eye" size="sm" />
						</span>
						{t("ordersPage:actions.viewDetails", "צפה בפרטים")}
					</Dropdown.Item>
					<Dropdown.Item
						id="delete"
						textValue={t("ordersPage:actions.delete", "מחק")}
						className="text-[14px] leading-[22px] font-normal text-[#949CA9] pl-[22px] pr-[15px] gap-[12px] py-[9px] data-[hover=true]:bg-[#E9F2FA]"
					>
						<span className="text-[#949CA9]">
							<Icon name="trash" size="sm" />
						</span>
						{t("ordersPage:actions.delete", "מחק")}
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}

export default AdminOrdersPages;
