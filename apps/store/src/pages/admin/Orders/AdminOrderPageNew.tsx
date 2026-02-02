import {
	Card,
	CardBody,
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Table,
	TableHeader,
	TableBody,
	TableColumn,
	TableRow,
	TableCell,
	Textarea,
	Chip,
} from "@heroui/react";
import { TOrder } from "@jsdev_ninja/core";
import { Calendar, User, Package, MapPin, ChevronDown, Download, Edit } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { useParams, navigate } from "src/navigation";
import { useAppSelector } from "src/infra";
import { modalApi } from "src/infra/modals";
import { formatter } from "src/utils/formatter";

export default function AdminOrderPageNew() {
	const { t, i18n } = useTranslation(["common", "ordersPage"]);
	const isRTL = i18n.dir() === "rtl";
	const { id } = useParams("admin.order");

	const [order, setOrder] = useState<TOrder | null>(null);
	const [isCreatingDeliveryNote, setIsCreatingDeliveryNote] = useState(false);
	const appApi = useAppApi();

	async function refetchOrder() {
		if (!id) return;
		const res = await appApi.admin.getOrder(id);
		if (res?.success) setOrder(res.data);
	}
	const organizations = useAppSelector((state) => state.organization.organizations);

	// Get organization from Redux if order has organizationId
	const organization = useMemo(() => {
		if (!order?.organizationId) return null;
		return organizations.find((org) => org.id === order.organizationId) || null;
	}, [order?.organizationId, organizations]);

	function updateOrder(id: string, status: TOrder["status"]) {
		setOrder((order) => (order?.id === id ? { ...order, status: status } : order));
	}

	const actions = [
		{
			id: "createPaymentLink",
			label: t("ordersPage:actions.createPaymentLink"),
			color: "primary",
			className: "text-primary",
		},
		{
			id: "endOrder",
			label: t("ordersPage:actions.endOrder"),
			color: "success",
			className: "text-success",
		},
		{
			id: "cancelOrder",
			label: t("ordersPage:actions.cancelOrder"),
			color: "danger",
			className: "text-danger",
		},
	] as const;

	const mainActions = () => {
		if (!order) return null;
		const actionByStatus: Partial<Record<TOrder["status"], React.ReactNode>> = {
			pending: (
				<Button
					type="button"
					onPress={async () => {
						const res = await appApi.admin.orderAccept({ order });
						if (!res?.success) {
							return;
						}
						updateOrder(order.id, "processing");
					}}
				>
					{t("ordersPage:actions.acceptOrder")}
				</Button>
			),
			in_delivery: (
				<Button
					onPress={async () => {
						const res = await appApi.admin.orderDelivered({ order });
						if (!res?.success) {
							return;
						}
						updateOrder(order.id, "delivered");
					}}
				>
					{t("ordersPage:actions.deliveredOrder")}
				</Button>
			),
			processing: (
				<Button
					color="primary"
					onPress={async () => {
						const res = await appApi.admin.orderInDelivery({ order });
						if (!res?.success) {
							return;
						}
						updateOrder(order.id, "in_delivery");
					}}
				>
					{t("ordersPage:actions.setOnDelivery")}
				</Button>
			),
			delivered: (order.paymentType == "j5"|| order.paymentStatus == "pending_j5") && (
				<Button
					onPress={async () => {
						// charge for order
						const res = await appApi.admin.chargeOrder({ order });
						console.log("res", res);

						if (!res?.success) {
							return;
						}
						updateOrder(order.id, "completed");
						updateOrder(order.paymentStatus, "completed");
					}}
				>
					{t("ordersPage:actions.chargeOrder")}
				</Button>
			),
		};
		return actionByStatus[order.status] ?? null;
	};

	const disabledKeys = [];
	if (order?.paymentStatus === "completed" || order?.paymentType === "external") {
		disabledKeys.push("createPaymentLink");
	}

	useEffect(() => {
		if (!id) return;

		appApi.admin.getOrder(id).then((res) => {
			if (res?.success) {
				setOrder(res.data);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	return (
		<div
			className={`min-h-screen bg-gray-50 p-4 md:p-6 ${isRTL ? "rtl" : "ltr"}`}
			dir={isRTL ? "rtl" : "ltr"}
		>
			{/* Header Section */}
			<div className="mb-6">
				<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
					{t("ordersPage:orderDetails.title")}
				</h1>
				<div
					className={`flex flex-col md:flex-row md:items-center gap-4 ${
						isRTL ? "md:flex-row-reverse md:justify-between" : "md:justify-between"
					}`}
				>
					<div
						className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ${
							isRTL ? "md:flex-row-reverse" : ""
						}`}
					>
						<div
							className={`flex items-center gap-2 text-gray-600 ${
								isRTL ? "flex-row-reverse" : ""
							}`}
						>
							<Calendar className="w-4 h-4" />
							<span className="text-sm md:text-base">{formatter.date(order?.date)}</span>
						</div>
						<div className="text-sm md:text-base text-gray-600">
							{t("ordersPage:orderDetails.orderId")}:{" "}
							<span className="font-semibold">{order?.id}</span>
						</div>
					</div>
					<div
						className={`flex items-center gap-2 md:gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<Dropdown>
							<DropdownTrigger>
								<Button
									variant="bordered"
									endContent={!isRTL ? <ChevronDown className="w-4 h-4" /> : undefined}
									startContent={isRTL ? <ChevronDown className="w-4 h-4" /> : undefined}
									className="text-sm md:text-base"
								>
									{t("common:actionsLabel")}
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disabledKeys={disabledKeys}
								onAction={async (key) => {
									if (!order) return;
									console.log("key", key);
									if (key === "cancelOrder") {
										const res = await appApi.admin.cancelOrder({ order });
										if (!res?.success) {
											return;
										}
										updateOrder(order.id, "cancelled");
									}
									if (key === "createPaymentLink") {
										const payment = await appApi.user.createPaymentLink({ order });
										window.location.href = payment.data.paymentLink;
									}
									if (key === "endOrder") {
										const res = await appApi.admin.endOrder({ order });
										if (!res?.success) {
											return;
										}
										updateOrder(order.id, "completed");
									}
								}}
								aria-label="actions"
							>
								{actions.map((action) => (
									<DropdownItem
										className={action.className}
										color={action.color}
										key={action.id}
									>
										{action.label}
									</DropdownItem>
								))}
							</DropdownMenu>
						</Dropdown>
						{mainActions()}
					</div>
				</div>
			</div>

			{/* Three Info Cards Section */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
				{/* Customer Card */}
				<Card className="shadow-sm">
					<CardBody className="p-4 md:p-6">
						<div className={`flex items-start gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
							<div className="p-2 bg-blue-100 rounded-lg">
								<User className="w-5 h-5 text-blue-600" />
							</div>
							<div className="flex-1 text-start">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">
									{t("ordersPage:orderDetails.customer.title")}
								</h3>
								<div className="space-y-2 text-sm text-gray-600">
									{order?.client?.displayName && (
										<p>
											<span className="font-medium">
												{t("ordersPage:orderDetails.customer.name")}:
											</span>{" "}
											{order.client.displayName}
										</p>
									)}
									{order?.client?.email && (
										<p>
											<span className="font-medium">
												{t("ordersPage:orderDetails.customer.email")}:
											</span>{" "}
											{order.client.email}
										</p>
									)}
									{order?.client?.phoneNumber && (
										<p>
											<span className="font-medium">
												{t("ordersPage:orderDetails.customer.phone")}:
											</span>{" "}
											{order.client.phoneNumber}
										</p>
									)}
									{order?.client?.companyName && (
										<p>
											<span className="font-medium">{t("common:companyName")}:</span>{" "}
											{order.client.companyName}
										</p>
									)}
									{organization && (
										<>
											<p>
												<span className="font-medium">{t("common:company")}:</span>{" "}
												{organization.name}
											</p>
											{organization.discountPercentage !== undefined && (
												<p>
													<span className="font-medium">{t("common:discount")}:</span>{" "}
													{organization.discountPercentage}%
												</p>
											)}
										</>
									)}
									{order?.billingAccount && (
										<>
											<p>
												<span className="font-medium">{t("common:accountName")}:</span>{" "}
												{order.billingAccount.name}
											</p>
											<p>
												<span className="font-medium">
													{t("common:accountNumber")}:
												</span>{" "}
												{order.billingAccount.number}
											</p>
										</>
									)}
									{!order?.client && !organization && !order?.billingAccount && (
										<p className="text-gray-400 italic">{t("common:emptyField")}</p>
									)}
								</div>
								{order?.client && (
									<Button
										color="primary"
										variant="light"
										size="sm"
										className="mt-4 text-sm"
									>
										{t("ordersPage:orderDetails.customer.viewProfile")}
									</Button>
								)}
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Order Info Card */}
				<Card className="shadow-sm">
					<CardBody className="p-4 md:p-6">
						<div className={`flex items-start gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
							<div className="p-2 bg-blue-100 rounded-lg">
								<Package className="w-5 h-5 text-blue-600" />
							</div>
							<div className="flex-1 text-start">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">
									{t("ordersPage:orderDetails.orderInfo.title")}
								</h3>
								<div className="space-y-2 text-sm text-gray-600">
									{order?.id && (
										<p>
											<span className="font-medium">
												{t("ordersPage:orderDetails.orderId")}:
											</span>{" "}
											{order.id}
										</p>
									)}
									{order?.status && (
										<p>
											<span className="font-medium">
												{t("ordersPage:orderDetails.orderInfo.status")}:
											</span>{" "}
											<Chip size="sm" color="primary" variant="flat">
												{t(`common:orderStatutes.${order.status}`)}
											</Chip>
										</p>
									)}
									{order?.deliveryDate && (
										<p>
											<span className="font-medium">{t("common:deliveryDate")}:</span>{" "}
											{formatter.date(order.deliveryDate)}
										</p>
									)}
									{order?.createdBy && (
										<p>
											<span className="font-medium">
												{t("ordersPage:columns.createdBy")}:
											</span>{" "}
											{t(`ordersPage:createdBy.${order.createdBy}`)}
										</p>
									)}
									{order?.nameOnInvoice && (
										<p>
											<span className="font-medium">{t("common:nameOnInvoice")}:</span>{" "}
											{order.nameOnInvoice}
										</p>
									)}
									{!order && (
										<p className="text-gray-400 italic">{t("common:emptyField")}</p>
									)}
								</div>
								<Button color="primary" variant="light" size="sm" className="mt-4 text-sm">
									{t("ordersPage:orderDetails.orderInfo.downloadInfo")}
								</Button>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Deliver to Card */}
				<Card className="shadow-sm">
					<CardBody className="p-4 md:p-6">
						<div className={`flex items-start gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
							<div className="p-2 bg-blue-100 rounded-lg">
								<MapPin className="w-5 h-5 text-blue-600" />
							</div>
							<div className="flex-1 text-start">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">
									{t("ordersPage:orderDetails.delivery.title")}
								</h3>
								<div className="space-y-2 text-sm text-gray-600">
									{(() => {
										const address = order?.address || order?.client?.address;
										if (!address) {
											return (
												<p className="text-gray-400 italic">{t("common:emptyField")}</p>
											);
										}
										return (
											<>
												{address.city && (
													<p>
														<span className="font-medium">
															{t("ordersPage:orderDetails.delivery.city")}:
														</span>{" "}
														{address.city}
													</p>
												)}
												{address.street && (
													<p>
														<span className="font-medium">{t("common:street")}:</span>{" "}
														{address.street}
														{address.streetNumber && ` ${address.streetNumber}`}
													</p>
												)}
												{(address.floor || address.apartmentNumber) && (
													<p>
														{address.floor && (
															<>
																<span className="font-medium">
																	{t("common:floor")}:
																</span>{" "}
																{address.floor}
																{address.apartmentNumber && ", "}
															</>
														)}
														{address.apartmentNumber && (
															<>
																<span className="font-medium">
																	{t("common:apartmentNumber")}:
																</span>{" "}
																{address.apartmentNumber}
															</>
														)}
													</p>
												)}
												{address.apartmentEnterNumber && (
													<p>
														<span className="font-medium">
															{t("common:apartmentEnterNumber")}:
														</span>{" "}
														{address.apartmentEnterNumber}
													</p>
												)}
												{address.country && (
													<p>
														<span className="font-medium">
															{t("common:country")}:
														</span>{" "}
														{address.country}
													</p>
												)}
											</>
										);
									})()}
								</div>
								{order?.client && (
									<Button
										color="primary"
										variant="light"
										size="sm"
										className="mt-4 text-sm"
									>
										{t("ordersPage:orderDetails.delivery.viewProfile")}
									</Button>
								)}
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Payment Info and Notes Section */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
				{/* Payment Info Card */}
				<Card className="shadow-sm">
					<CardBody className="p-4 md:p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4 text-start">
							{t("ordersPage:orderDetails.payment.title")}
						</h3>
						<div className="space-y-3 text-sm text-start">
							{order?.paymentType && (
								<p className="text-gray-600">
									<span className="font-medium">{t("common:paymentType")}:</span>{" "}
									{t(`common:paymentTypes.${order.paymentType}`)}
								</p>
							)}
							{order?.paymentStatus && (
								<p className="text-gray-600">
									<span className="font-medium">{t("common:paymentStatus")}:</span>{" "}
									<Chip size="sm" color="primary" variant="flat">
										{t(`common:paymentStatuses.${order.paymentStatus}`)}
									</Chip>
								</p>
							)}
							{!order?.paymentType && !order?.paymentStatus && (
								<p className="text-gray-400 italic">{t("common:emptyField")}</p>
							)}
						</div>
					</CardBody>
				</Card>

				{/* Notes Card */}
				<Card className="shadow-sm">
					<CardBody className="p-4 md:p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4 text-start">
							{t("ordersPage:orderDetails.notes.title")}
						</h3>
						<Textarea
							className="mb-4"
							minRows={4}
							variant="bordered"
							value={order?.clientComment || ""}
						/>
					</CardBody>
				</Card>
			</div>

			{/* Documents Section */}
			{(order?.deliveryNote?.link ||
				order?.invoice?.link ||
				order?.ezInvoice?.pdf_link ||
				order?.ezDeliveryNote?.pdf_link ||
				(order && ["completed", "delivered"].includes(order.status))) && (
				<Card className="shadow-sm mb-6">
					<CardBody className="p-4 md:p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4 text-start">
							{t("ordersPage:orderDetails.documents.title")}
						</h3>
						<div className="space-y-2 text-sm">
							{order?.deliveryNote?.link && (
								<div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
									<span className="text-gray-700">
										{t("ordersPage:orderDetails.documents.deliveryNote")}
									</span>
									<a
										href={order.deliveryNote.link}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 text-blue-600 hover:underline"
									>
										<Download className="w-4 h-4" />
										{t("ordersPage:orderDetails.documents.download")}
									</a>
								</div>
							)}
							{order?.invoice?.link && (
								<div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
									<span className="text-gray-700">
										{t("ordersPage:orderDetails.documents.invoice")}
									</span>
									<a
										href={order.invoice.link}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 text-blue-600 hover:underline"
									>
										<Download className="w-4 h-4" />
										{t("ordersPage:orderDetails.documents.download")}
									</a>
								</div>
							)}
							{order?.ezInvoice?.pdf_link && (
								<div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
									<span className="text-gray-700">
										{t("ordersPage:orderDetails.documents.ezInvoice")}
									</span>
									<a
										href={order.ezInvoice.pdf_link}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 text-blue-600 hover:underline"
									>
										<Download className="w-4 h-4" />
										{t("ordersPage:orderDetails.documents.download")}
									</a>
								</div>
							)}
							{order?.ezDeliveryNote?.pdf_link && (
								<div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
									<span className="text-gray-700">
										{t("ordersPage:orderDetails.documents.ezDeliveryNote")}
									</span>
									<a
										href={order.ezDeliveryNote.pdf_link}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 text-blue-600 hover:underline"
									>
										<Download className="w-4 h-4" />
										{t("ordersPage:orderDetails.documents.download")}
									</a>
								</div>
							)}
							{order &&
								["completed", "delivered"].includes(order.status) && (
									<>
										{!order?.deliveryNote?.link && !order?.ezDeliveryNote?.pdf_link && (
											<div className="flex items-center justify-between p-2 rounded border border-dashed border-gray-200">
												<span className="text-gray-600">
													{t("ordersPage:orderDetails.documents.deliveryNote")}
												</span>
												<Button
													size="sm"
													color="primary"
													variant="flat"
													isLoading={isCreatingDeliveryNote}
													isDisabled={isCreatingDeliveryNote}
													onPress={() => {
														if (!order) return;
														modalApi.openModal("selectDateForDocument", {
															documentType: "deliveryNote",
															onConfirm: async (date) => {
																setIsCreatingDeliveryNote(true);
																try {
																	const res = await appApi.admin.createDeliveryNote(order, {
																		date,
																	});
																	if (res?.success) await refetchOrder();
																} finally {
																	setIsCreatingDeliveryNote(false);
																}
															},
														});
													}}
												>
													{t("ordersPage:orderDetails.documents.createDeliveryNote")}
												</Button>
											</div>
										)}
										{!order?.invoice?.link && !order?.ezInvoice?.pdf_link && (
											<div className="flex items-center justify-between p-2 rounded border border-dashed border-gray-200">
												<span className="text-gray-600">
													{t("ordersPage:orderDetails.documents.invoice")}
												</span>
												<Button
													size="sm"
													color="primary"
													variant="flat"
													onPress={() => {
														if (!order) return;
														modalApi.openModal("selectDateForDocument", {
															documentType: "invoice",
															onConfirm: (date) => {
																modalApi.openModal("invoiceDetails", {
																	selectedOrders: [order],
																	initialInvoiceDate: date,
																	onInvoiceCreated: refetchOrder,
																});
															},
														});
													}}
												>
													{t("ordersPage:orderDetails.documents.createInvoice")}
												</Button>
											</div>
										)}
									</>
								)}
						</div>
					</CardBody>
				</Card>
			)}

			{/* Product List Section */}
			<Card className="shadow-sm mb-6">
				<CardBody className="p-4 md:p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold text-gray-900  text-start">
							{t("ordersPage:orderDetails.products.title")}
						</h3>
						{/* edit icon button */}
						<Button
							onPress={() => {
								navigate({
									to: "admin.pickOrder",
									params: { id: order?.id || "" },
								});
							}}
							isIconOnly
							color="primary"
							variant="light"
							size="sm"
							className="shrink-0 grow-0"
						>
							<Edit className="size-6" />
						</Button>
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
							</TableHeader>
							<TableBody>
								{(order?.cart.items ?? []).map((item, index) => (
									<TableRow key={item.product.id || index}>
										<TableCell className="text-start">
											<div className={`flex items-center gap-3`}>
												<div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center shrink-0">
													<Package className="w-6 h-6 text-gray-400" />
												</div>
												<span className="font-medium text-gray-900">
													{item.product.name?.[0]?.value || t("common:emptyField")}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-gray-700 text-start">
											{formatter.price(item.finalPrice || item.originalPrice || 0)}
										</TableCell>
										<TableCell className="text-gray-700 text-start">
											{item.amount}
										</TableCell>
										<TableCell className="font-semibold text-gray-900 text-start">
											{formatter.price(
												(item.finalPrice || item.originalPrice || 0) * item.amount
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardBody>
			</Card>

			{/* Order Summary Section */}
			<div className={`flex ${isRTL ? "justify-start" : "justify-end"}`}>
				<Card className="shadow-sm w-full md:w-auto min-w-[280px]">
					<CardBody className="p-4 md:p-6">
						<div className="space-y-3 text-sm text-start">
							{order?.cart && (
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
													<span className="font-medium">
														{formatter.price(subtotal)}
													</span>
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
			</div>
		</div>
	);
}
