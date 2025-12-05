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
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Pagination,
} from "@heroui/react";
import { Icon } from "src/components";

const getColumns = (t: any) => [
	{ name: t("ordersPage:columns.orderId"), uid: "id" },
	{ name: t("ordersPage:columns.customerName", "Customer Name"), uid: "customerName" },
	{ name: t("ordersPage:columns.paymentType", "Payment Type"), uid: "paymentType" },
	{ name: t("ordersPage:columns.sum"), uid: "total" },
	{ name: t("ordersPage:columns.date"), uid: "date" },
	{ name: t("ordersPage:columns.status"), uid: "status" },
	{ name: t("ordersPage:columns.actions", "Actions"), uid: "actions" },
];

const getStatusColor = (status: TOrder["status"]): string => {
	const statusColors: Record<TOrder["status"], string> = {
		completed: "#22c38f",
		pending: "#fea73e",
		cancelled: "#fc424a",
		processing: "#fea73e",
		in_delivery: "#fea73e",
		delivered: "#22c38f",
		draft: "#949ca9",
		refunded: "#fc424a",
	};
	return statusColors[status] || "#949ca9";
};

function AdminOrdersPages() {
	const appApi = useAppApi();
	const { t } = useTranslation(["common", "ordersPage"]);

	const [orders, setOrders] = useState<TOrder[]>([]);
	const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
	const [page, setPage] = useState(1);
	const [rowsPerPage] = useState(10);
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [orderToCancel, setOrderToCancel] = useState<TOrder | null>(null);

	const headerColumns = useMemo(() => getColumns(t), [t]);

	const items = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		const end = start + rowsPerPage;
		return orders.slice(start, end);
	}, [page, orders, rowsPerPage]);

	const pages = Math.ceil(orders.length / rowsPerPage) || 1;

	function updateOrder(id: string, status: TOrder["status"]) {
		setOrders((orders) =>
			orders.map((order) => (order.id === id ? { ...order, status: status } : order))
		);
	}

	useEffect(() => {
		appApi.admin.getStoreOrders().then((res) => {
			if (!res) {
				return;
			}
			setOrders(res.data);
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

	const renderCell = useCallback(
		(order: TOrder, columnKey: React.Key) => {
			switch (columnKey) {
				case "id":
					return (
						<span className="text-[14px] leading-[22px] font-normal text-[#282828]">
							#{order.id.slice(-8)}
						</span>
					);
				case "customerName":
					return (
						<span className="text-[14px] leading-[22px] font-medium text-[#282828]">
							{order.client?.displayName || "-"}
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
		[t]
	);

	const topContent = useMemo(() => {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex justify-between gap-3 items-center">
					<h1 className="text-[24px] leading-[36px] font-medium text-[#282828]">
						{t("ordersPage:title", "הזמנות שלי")}
					</h1>
					<Button
						color="primary"
						className="bg-[#009EF7] text-white"
						onPress={() => {
							// TODO: Navigate to create order page
						}}
						startContent={<Icon name="edit" size="sm" />}
					>
						{t("ordersPage:createOrder", "צור הזמנה")}
					</Button>
				</div>
				{/* Filters */}
				<div className="flex gap-[20px] items-center">
					<Button
						variant="flat"
						className="bg-[#F6F6F6] text-[#282828] px-[15px] py-[9px] rounded-[5px]"
						endContent={
							<svg
								width="10"
								height="5"
								viewBox="0 0 10 5"
								fill="none"
								className="rotate-180"
							>
								<path
									d="M0 0L5 5L10 0"
									stroke="#949CA9"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						}
					>
						{t("ordersPage:filters.allCategory", "כל הקטגוריות")}
					</Button>
					<Button
						variant="flat"
						className="bg-[#F6F6F6] text-[#282828] px-[15px] py-[9px] rounded-[5px]"
						startContent={<Icon name="document" size="sm" />}
					>
						{t("ordersPage:filters.date", "תאריך")}
					</Button>
					<Button
						variant="flat"
						className="bg-[#F6F6F6] text-[#282828] px-[15px] py-[9px] rounded-[5px]"
						endContent={
							<svg width="10" height="5" viewBox="0 0 10 5" fill="none" className="rotate-180">
								<path
									d="M0 0L5 5L10 0"
									stroke="#949CA9"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						}
					>
						{t("ordersPage:filters.status", "סטטוס")}
					</Button>
					<Button
						variant="flat"
						className="bg-[#F6F6F6] text-[#282828] px-[15px] py-[9px] rounded-[5px] w-[90px]"
						startContent={<Icon name="search" size="sm" />}
					>
						{t("ordersPage:filters.filters", "סינונים")}
					</Button>
				</div>
			</div>
		);
	}, [t]);

	const bottomContent = useMemo(() => {
		return (
			<div className="py-2 px-2 flex justify-between items-center">
				<span className="text-[14px] leading-[22px] font-normal text-[#949CA9]">
					{t("ordersPage:pagination.showing", "מציג {start} עד {end} פריטים", {
						start: orders.length > 0 ? (page - 1) * rowsPerPage + 1 : 0,
						end: Math.min(page * rowsPerPage, orders.length),
					})}
				</span>
				<Pagination
					isCompact
					showControls
					showShadow
					color="primary"
					page={page}
					total={pages}
					onChange={setPage}
					classNames={{
						wrapper: "gap-0 overflow-visible h-8",
						item: "w-8 h-8 text-small rounded-none bg-transparent",
						cursor: "bg-[#009EF7] text-white",
					}}
				/>
			</div>
		);
	}, [page, pages, orders.length, rowsPerPage, t]);

	return (
		<div className="flex flex-col gap-[20px]">
			{/* Table */}
			<div className="bg-white rounded-[10px] px-[25px] py-[20px]">
				<Table
					aria-label="Orders table"
					isHeaderSticky
					selectionMode="multiple"
					selectedKeys={selectedKeys}
					onSelectionChange={setSelectedKeys}
					topContent={topContent}
					topContentPlacement="outside"
					bottomContent={bottomContent}
					bottomContentPlacement="outside"
					classNames={{
						base: "max-h-[400px]",
						table: "min-h-[200px]",
						wrapper: "shadow-none",
						thead: "[&>tr]:border-b [&>tr]:border-[#E8E9EA]",
						tbody: "[&>tr]:border-b [&>tr]:border-[#E8E9EA] [&>tr:last-child]:border-0",
						th: "text-[14px] leading-[22px] font-medium text-[#949CA9] bg-transparent pb-[15px]",
						td: "text-[14px] leading-[22px] text-[#282828] pb-[15px] pt-[15px]",
					}}
					removeWrapper
				>
					<TableHeader columns={headerColumns}>
						{(column) => (
							<TableColumn key={column.uid} align={column.uid === "actions" ? "end" : "start"}>
								{column.name}
							</TableColumn>
						)}
					</TableHeader>
					<TableBody items={items} emptyContent={t("ordersPage:noOrders", "אין הזמנות")}>
						{(order) => (
							<TableRow key={order.id}>
								{(columnKey) => <TableCell>{renderCell(order, columnKey)}</TableCell>}
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Cancel Order Modal */}
			<Modal isOpen={isCancelOpen} onOpenChange={setIsCancelOpen}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								{t("ordersPage:confirmCancel.title", "ביטול הזמנה")}
							</ModalHeader>
							<ModalBody>
								<p>
									{t(
										"ordersPage:confirmCancel.message",
										"האם אתה בטוח שברצונך לבטל את ההזמנה הזו?"
									)}
								</p>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={() => onClose()}>
									{t("common:actions.cancel", "Close")}
								</Button>
								<Button color="danger" onPress={confirmCancelOrder}>
									{t("ordersPage:actions.cancelOrder")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}

function OrderActionsDropdown({
	order,
	onCancel,
}: {
	order: TOrder;
	onCancel: () => void;
}) {
	const { t } = useTranslation(["common", "ordersPage"]);

	return (
		<Dropdown>
			<DropdownTrigger>
					<Button isIconOnly size="sm" variant="light">
						<svg
							className="text-default-500"
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
					</Button>
				</DropdownTrigger>
				<DropdownMenu
					aria-label="Order actions"
					className="bg-white border border-[#E8E9EA] rounded-[4px] shadow-[0px_10px_20px_0px_rgba(95,95,95,0.15)] py-[11px] min-w-[165px]"
					itemClasses={{
						base: "py-[9px] data-[hover=true]:bg-[#E9F2FA]",
					}}
					onAction={(key) => {
						if (key === "view") {
							navigate({ to: "admin.order", params: { id: order.id } });
						} else if (key === "edit") {
							// TODO: Implement edit order functionality
						} else if (key === "delete") {
							onCancel();
						}
					}}
				>
					<DropdownItem
						key="view"
						className="text-[14px] leading-[22px] font-medium text-[#009EF7] pl-[20px] pr-[15px] gap-[10px]"
						startContent={
							<span className="text-[#009EF7]">
								<Icon name="eye" size="sm" />
							</span>
						}
					>
						{t("ordersPage:actions.viewDetails", "צפה בפרטים")}
					</DropdownItem>
					<DropdownItem
						key="edit"
						className="text-[14px] leading-[22px] font-normal text-[#949CA9] pl-[22px] pr-[15px] gap-[11px]"
						startContent={
							<span className="text-[#949CA9]">
								<Icon name="edit" size="sm" />
							</span>
						}
					>
						{t("ordersPage:actions.editInfo", "ערוך מידע")}
					</DropdownItem>
					<DropdownItem
						key="delete"
						className="text-[14px] leading-[22px] font-normal text-[#949CA9] pl-[22px] pr-[15px] gap-[12px]"
						startContent={
							<span className="text-[#949CA9]">
								<Icon name="trash" size="sm" />
							</span>
						}
					>
						{t("ordersPage:actions.delete", "מחק")}
					</DropdownItem>
				</DropdownMenu>
		</Dropdown>
	);
}

export default AdminOrdersPages;
