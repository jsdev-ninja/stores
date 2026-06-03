import { Modal, Select, ListBox } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { TOrder } from "@jsdev_ninja/core";
import { Button } from "src/components/button";
import { formatter } from "src/utils/formatter";
import { useAdminCreateOrderModal } from "./useAdminCreateOrderModal";

type Props = { onOrderCreated?: (order: TOrder) => void };

export function AdminCreateOrderModal({ onOrderCreated }: Props) {
	const { t } = useTranslation(["common", "ordersPage"]);
	const vm = useAdminCreateOrderModal(onOrderCreated);

	const canSubmit = vm.lines.length > 0 && !!vm.selectedOrgId && !vm.submitting;

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) vm.close();
			}}
		>
			<Modal.Container size="lg" scroll="inside" placement="center">
				<Modal.Dialog className="max-h-[90vh] flex flex-col">
					<Modal.Header>
						<Modal.Heading>
							<div className="text-start">
								{t("ordersPage:createOrder", "הזמנה חדשה")}
							</div>
						</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="space-y-5 flex-1 min-h-0 overflow-y-auto">
						{/* Organization selector */}
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-semibold text-gray-700">
								{t("ordersPage:orderDetails.company", "חברה")}{" "}
								<span className="text-red-500">*</span>
							</label>
							<Select
								placeholder={t("admin:createOrder.selectOrganizationPlaceholder", "בחרו חברה")}
								selectedKey={vm.selectedOrgId || null}
								onSelectionChange={vm.handleOrgChange}
							>
								<Select.Trigger>
									<Icon icon="lucide:building-2" className="text-default-400 mr-2" />
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{vm.organizations.map((org) => (
											<ListBox.Item key={org.id} id={org.id} textValue={org.name}>
												{org.name}
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>

						{/* Billing account selector — shown only when org has >1 accounts */}
						{vm.showBillingAccountSelector && (
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-semibold text-gray-700">
									{t("ordersPage:orderDetails.billingAccount", "כרטיס חשבון")}{" "}
									<span className="text-red-500">*</span>
								</label>
								<small className="text-gray-400 text-xs">
									{`ללקוח זה ${vm.selectedOrg?.billingAccounts.length} כרטיסי חשבון - בחרו את הכרטיס לחיוב`}
								</small>
								<Select
									placeholder={t("admin:createOrder.selectBillingAccountPlaceholder", "בחרו כרטיס חשבון")}
									selectedKey={vm.selectedAccountId || null}
									onSelectionChange={vm.handleAccountChange}
								>
									<Select.Trigger>
										<Icon icon="lucide:credit-card" className="text-default-400 mr-2" />
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{(vm.selectedOrg?.billingAccounts ?? []).map((acc) => (
												<ListBox.Item key={acc.id} id={acc.id} textValue={acc.name}>
													{acc.name} ({acc.number})
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						)}

						{/* Delivery date */}
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-semibold text-gray-700">
								{t("common:deliveryDate", "תאריך אספקה")}
							</label>
							<input
								type="date"
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								value={vm.deliveryDate}
								onChange={(e) => vm.setDeliveryDate(e.target.value)}
							/>
						</div>

						{/* Notes */}
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-semibold text-gray-700">
								{t("ordersPage:orderDetails.notes.title", "הערות")}
							</label>
							<textarea
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
								rows={2}
								placeholder="מועד אספקה מועדף, הוראות מיוחדות..."
								value={vm.notes}
								onChange={(e) => vm.setNotes(e.target.value)}
							/>
						</div>

						{/* Product adder */}
						<div className="flex flex-col gap-2">
							<label className="text-sm font-semibold text-gray-700">
								{t("ordersPage:orderDetails.products.product", "הוסף מוצר")}
							</label>
							<input
								type="text"
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="חיפוש לפי שם / מק״ט..."
								value={vm.productSearchQuery}
								onChange={(e) => vm.setProductSearchQuery(e.target.value)}
							/>
							<div className="flex gap-2">
								<select
									className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									value={vm.selectedProductId}
									onChange={(e) => vm.setSelectedProductId(e.target.value)}
								>
									<option value="">בחרו מוצר</option>
									{vm.filteredProducts.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name?.[0]?.value} — {formatter.price(p.price)}
										</option>
									))}
								</select>
								<input
									type="number"
									min={1}
									className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
									value={vm.qty}
									onChange={(e) => vm.setQty(Math.max(1, Number(e.target.value)))}
								/>
								<Button variant="ghost" onPress={vm.addLine}>
									<Icon icon="lucide:plus" width={18} height={18} />
								</Button>
							</div>
						</div>

						{/* Order lines */}
						{vm.lines.length > 0 && (
							<div className="space-y-1">
								{vm.lines.map((line, i) => (
									<div
										key={line.product.id}
										className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-50"
									>
										<span className="text-sm text-gray-800">
											{line.product.name?.[0]?.value} × {line.qty}
										</span>
										<div className="flex items-center gap-3">
											<span className="text-sm font-bold text-gray-900">
												{formatter.price(line.product.price * line.qty)}
											</span>
											<button
												type="button"
												className="text-red-400 hover:text-red-600 text-base leading-none"
												onClick={() => vm.removeLine(i)}
												aria-label="הסר מוצר"
											>
												×
											</button>
										</div>
									</div>
								))}
								<div className="text-end text-base font-black pt-1 text-gray-900">
									{`סה"כ: ${formatter.price(vm.cartTotal)}`}
								</div>
							</div>
						)}

						{/* Inline error */}
						{vm.error && (
							<p className="text-sm text-red-500 text-start">{vm.error}</p>
						)}
					</Modal.Body>

					<Modal.Footer>
						<Button variant="ghost" onPress={vm.close}>
							{t("common:cancel", "ביטול")}
						</Button>
						<Button
							variant="primary"
							isDisabled={!canSubmit}
							isPending={vm.submitting}
							onPress={vm.handleSubmit}
						>
							{t("ordersPage:createOrder", "צור הזמנה")}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
