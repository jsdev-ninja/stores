/**
 * Balasi-specific ADMIN "create order" PRESENTATION.
 *
 * Layout/markup only. Rendered INSIDE the shared <Form> in AdminCreateOrderPage
 * and reuses the EXACT same field `name`s, the same org/billing Selects, and the
 * same submit button — so order creation logic is unchanged. No business logic
 * here. The org-change side effects live in the parent FormContent and run
 * regardless of which layout renders.
 */

import { ReactNode } from "react";
import { Select, ListBox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useFormContext } from "react-hook-form";
import type { Key } from "react-aria-components";
import { TFunction } from "i18next";
import { getCartCost, TOrder, TOrganization } from "@jsdev_ninja/core";
import { Form } from "src/components/Form";
import { Button } from "src/components/button";
import { MinimumOrderAlert } from "src/widgets/MinimumOrderAlert/MinimumOrderAlert";
import { navigate } from "src/navigation";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { formatter } from "src/utils/formatter";

const ORANGE = "var(--brand-secondary)";

type Props = {
	t: TFunction<["common", "checkout"]>;
	organizations: TOrganization[];
	selectedOrganization: TOrganization | null;
	loading: boolean;
	onOrganizationSelect: (organizationId: string) => void;
	minDate: string;
	maxDate: string;
};

function SectionHead({ num, title }: { num: string; title: string }) {
	return (
		<div className="mb-4 flex items-center gap-3 border-b border-[var(--border)] pb-2">
			<span className="text-[15px] font-black tracking-tight" style={{ color: ORANGE }}>
				{num}
			</span>
			<h3 className="text-[15px] font-bold tracking-tight text-[var(--foreground)]">{title}</h3>
		</div>
	);
}

function Section({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
			{children}
		</div>
	);
}

function FieldLabel({ children }: { children: ReactNode }) {
	return (
		<label className="block text-[13px] font-medium text-[var(--foreground)]">{children}</label>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="font-normal text-[var(--muted)]">{label}</span>
			<span className="font-semibold text-[var(--foreground)]">{value}</span>
		</div>
	);
}

function OrderSummary({ children }: { children?: ReactNode }) {
	const cart = useCart();
	const discounts = useDiscounts();
	const store = useStore();

	if (!cart || !store) return null;

	const cartCost = getCartCost({
		cart: cart.items,
		discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	const deliveryPrice = cartCost.deliveryPrice ?? 0;

	return (
		<div className="mx-auto mt-6 w-full max-w-[380px] lg:mt-0">
			<div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
				<p className="mb-4 text-[18px] font-extrabold tracking-tight text-[var(--foreground)]">
					סיכום ההזמנה
				</p>
				<div className="space-y-2.5 border-t border-[var(--border)] pt-3 text-[14px]">
					<Row label="מוצרים" value={formatter.price(cartCost.cost)} />
					{cartCost.discount > 0 && (
						<Row label="הנחה" value={`- ${formatter.price(cartCost.discount)}`} />
					)}
					<Row label="משלוח" value={deliveryPrice > 0 ? formatter.price(deliveryPrice) : "חינם"} />
					<Row label='מע"מ' value={formatter.price(cartCost.vat)} />
				</div>
				<div className="mt-3 flex items-center justify-between border-t-2 border-[var(--foreground)] pt-3">
					<span className="text-[16px] font-extrabold text-[var(--foreground)]">מחיר סופי</span>
					<span className="text-[18px] font-black text-[var(--foreground)]">
						{formatter.price(cartCost.finalCost)}
					</span>
				</div>
				<div className="mt-5">{children}</div>
			</div>
		</div>
	);
}

export default function BalasiAdminCreateOrderLayout({
	t,
	organizations,
	selectedOrganization,
	loading,
	onOrganizationSelect,
	minDate,
	maxDate,
}: Props) {
	const { watch, setValue } = useFormContext<TOrder>();

	const organizationId = watch("organizationId");
	const billingAccount = watch("billingAccount");
	const billingAccountId = billingAccount?.id;

	const orgItems: Array<{ id: string; name: string; discountPercentage?: number }> = [
		{ id: "none", name: t("admin:createOrder.noOrganization", "ללא חברה") },
		...organizations,
	];

	return (
		<div dir="rtl">
			{/* Dark header band */}
			<div className="mb-6 rounded-[12px] bg-[var(--foreground)] px-6 py-5 text-white">
				<div
					className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]"
					style={{ color: ORANGE }}
				>
					ניהול הזמנות
				</div>
				<h1 className="text-[26px] font-black tracking-tight">צור הזמנה</h1>
			</div>

			<div className="md:gap-6 lg:flex lg:items-start xl:gap-8">
				<div className="min-w-0 flex-1 space-y-5">
					{/* 01 — company + billing account */}
					<Section>
						<SectionHead num="01" title="חברה וחשבון חיוב" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<FieldLabel>{t("admin:createOrder.selectOrganization", "בחר חברה")}</FieldLabel>
								<Select
									placeholder={t("admin:createOrder.selectOrganizationPlaceholder", "בחר חברה")}
									selectedKey={organizationId || null}
									onSelectionChange={(key: Key | null) => {
										const value = key ? String(key) : "";
										setValue("organizationId", value);
										onOrganizationSelect(value);
									}}
									isDisabled={loading}
								>
									<Select.Trigger>
										<Icon icon="lucide:building-2" className="text-default-400 mr-2" />
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{orgItems.map((org) => (
												<ListBox.Item id={org.id} key={org.id} textValue={org.name}>
													{org.name}
													{org.discountPercentage != null &&
														` (${org.discountPercentage}% ${t("admin:createOrder.discount", "הנחה")})`}
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>

							<div className="flex flex-col gap-2">
								<FieldLabel>
									{t("admin:createOrder.selectBillingAccount", "בחר חשבון חיוב")}
								</FieldLabel>
								<Select
									placeholder={t("admin:createOrder.selectBillingAccountPlaceholder", "בחר חשבון חיוב")}
									selectedKey={billingAccountId || null}
									onSelectionChange={(key: Key | null) => {
										const id = key ? String(key) : "";
										const account = selectedOrganization?.billingAccounts.find((a) => a.id === id);
										if (account) {
											setValue("billingAccount", account);
										}
									}}
									isDisabled={!selectedOrganization || loading}
								>
									<Select.Trigger>
										<Icon icon="lucide:credit-card" className="text-default-400 mr-2" />
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{(selectedOrganization?.billingAccounts || []).map((account) => (
												<ListBox.Item id={account.id} key={account.id} textValue={account.name}>
													{account.name} ({account.number})
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						</div>
					</Section>

					{/* 02 — customer details */}
					<Section>
						<SectionHead num="02" title="פרטי לקוח" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Form.Input<TOrder>
								placeholder={t("fullName")}
								name="client.displayName"
								label={t("fullName")}
							/>
							<Form.Input<TOrder>
								placeholder={t("common:phone")}
								name="client.phoneNumber"
								label={t("common:phone")}
							/>
							<Form.Input<TOrder>
								placeholder={t("common:email")}
								name="client.email"
								label={t("common:email")}
							/>
							<Form.Input<TOrder> name="nameOnInvoice" label={t("common:nameOnInvoice")} />
						</div>
					</Section>

					{/* 03 — delivery address */}
					<Section>
						<SectionHead num="03" title="כתובת למשלוח" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Form.Input<TOrder>
								name="client.address.street"
								placeholder={t("common:street")}
								label={t("common:street")}
							/>
							<Form.Input<TOrder>
								name="client.address.streetNumber"
								placeholder={t("common:streetNumber")}
								label={t("common:streetNumber")}
							/>
							<Form.Input<TOrder>
								placeholder={t("common:city")}
								name="client.address.city"
								label={t("common:city")}
							/>
							<Form.Input<TOrder>
								name="client.address.apartmentEnterNumber"
								placeholder={t("common:apartmentEnterNumber")}
								label={t("common:apartmentEnterNumber")}
							/>
							<Form.Input<TOrder>
								name="client.address.floor"
								placeholder={t("common:floor")}
								label={t("common:floor")}
							/>
							<Form.Input<TOrder>
								name="client.address.apartmentNumber"
								placeholder={t("common:apartmentNumber")}
								label={t("common:apartmentNumber")}
							/>
						</div>
					</Section>

					{/* 04 — delivery date + notes */}
					<Section>
						<SectionHead num="04" title="מועד אספקה והערות" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Form.Input<TOrder>
								name="deliveryDate"
								type="date"
								label={t("common:deliveryDate")}
								min={minDate}
								max={maxDate}
								defaultValue={minDate}
							/>
							<div className="sm:col-span-2">
								<Form.TextArea<TOrder> name="clientComment" label={t("common:clientComment")} />
							</div>
						</div>
					</Section>

					<MinimumOrderAlert />
				</div>

				<OrderSummary>
					<div className="space-y-3">
						<Button fullWidth type="submit">
							{t("admin:createOrder.createOrder", "צור הזמנה")}
						</Button>
						<Button fullWidth variant="ghost" onPress={() => navigate({ to: "admin.orders" })}>
							{t("common:cancel", "ביטול")}
						</Button>
					</div>
				</OrderSummary>
			</div>
		</div>
	);
}
