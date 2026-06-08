/**
 * Balasi-specific checkout PRESENTATION.
 *
 * IMPORTANT: this is layout/markup only. It renders INSIDE the shared
 * <Form> in CheckoutPage and reuses the EXACT same field `name`s, so the data
 * submitted and the payment flow are unchanged. No business/payment logic here.
 *
 * Ported to match the original Balasi "פרטי המשלוח" design: dark header band,
 * numbered sections, warm theme, and a styled order-summary card.
 */

import { ReactNode } from "react";
import { TFunction } from "i18next";
import { getCartCost, TOrder } from "@jsdev_ninja/core";
import { Form } from "src/components/Form";
import { Button } from "src/components/button";
import { MinimumOrderAlert } from "src/widgets/MinimumOrderAlert/MinimumOrderAlert";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { formatter } from "src/utils/formatter";

const ORANGE = "var(--brand-secondary)";

type Props = {
	t: TFunction<["common", "checkout"]>;
	minDate: string;
	maxDate: string;
	isSubmitting: boolean;
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
					סיכום הזמנה
				</p>

				<div className="space-y-2.5 border-t border-[var(--border)] pt-3 text-[14px]">
					<Row label="סכום ביניים" value={formatter.price(cartCost.cost)} />
					{cartCost.discount > 0 && (
						<Row label="הנחה" value={`- ${formatter.price(cartCost.discount)}`} />
					)}
					<Row
						label="משלוח"
						value={deliveryPrice > 0 ? formatter.price(deliveryPrice) : "חינם"}
					/>
					<Row label='מע"מ (18%)' value={formatter.price(cartCost.vat)} />
				</div>

				<div className="mt-3 flex items-center justify-between border-t-2 border-[var(--foreground)] pt-3">
					<span className="text-[16px] font-extrabold text-[var(--foreground)]">
						סה"כ (כולל מע"מ ומשלוח)
					</span>
					<span className="text-[18px] font-black text-[var(--foreground)]">
						{formatter.price(cartCost.finalCost)}
					</span>
				</div>

				<div className="mt-5">{children}</div>
			</div>
		</div>
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

export default function BalasiCheckoutLayout({ t, minDate, maxDate, isSubmitting }: Props) {
	const tomorrow = minDate;

	return (
		<div dir="rtl">
			{/* Dark header band — matches the original "פרטי המשלוח" modal head */}
			<div className="mb-6 rounded-[12px] bg-[var(--foreground)] px-6 py-5 text-white">
				<div
					className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]"
					style={{ color: ORANGE }}
				>
					השלמת הזמנה
				</div>
				<h1 className="text-[26px] font-black tracking-tight">פרטי המשלוח</h1>
			</div>

			<div className="md:gap-6 lg:flex lg:items-start xl:gap-8">
				<div className="min-w-0 flex-1 space-y-5">
					{/* 01 — customer / contact */}
					<Section>
						<SectionHead num="01" title="פרטי לקוח" />
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

					{/* 02 — delivery address */}
					<Section>
						<SectionHead num="02" title="כתובת למשלוח" />
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

					{/* 03 — delivery time + notes */}
					<Section>
						<SectionHead num="03" title="מועד אספקה והערות" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Form.Input<TOrder>
								name="deliveryDate"
								type="date"
								label={t("common:deliveryDate")}
								min={minDate}
								max={maxDate}
								defaultValue={tomorrow}
							/>
							<div className="sm:col-span-2">
								<Form.TextArea<TOrder> name="clientComment" label={t("common:clientComment")} />
							</div>
						</div>
					</Section>

					<MinimumOrderAlert />
				</div>

				<OrderSummary>
					<Button fullWidth type="submit" isPending={isSubmitting} isDisabled={isSubmitting}>
						אשרו ושלחו הזמנה
					</Button>
				</OrderSummary>
			</div>
		</div>
	);
}
