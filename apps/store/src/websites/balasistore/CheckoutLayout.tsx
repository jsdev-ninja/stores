/**
 * Balasi-specific checkout PRESENTATION (B2B redesign — Phase 1, UI only).
 *
 * IMPORTANT: this is layout/markup only. It renders INSIDE the shared
 * <Form> in CheckoutPage and reuses the EXACT same field `name`s for every
 * field that is actually submitted, so the data submitted and the payment flow
 * are 100% unchanged. No business/payment/schema logic here.
 *
 * Matches the owner's new "פרטי המשלוח" B2B mockup (5 sections). The new B2B
 * elements (company number selector, company name, tax id, contact role, PO,
 * payment-method choice, out-of-stock policy, consent) are VISUAL-ONLY in this
 * phase — they are plain elements NOT registered with the form, so they neither
 * persist nor affect validation. Wiring + persistence land in Phase 2/3 once the
 * Order schema + payment work is approved. See docs/plans/b2b-checkout.md.
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

// Shared input look for VISUAL-ONLY (non-registered) fields, mirrors Form.Input.
const FIELD_CLASS =
	"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

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

/** Label + control wrapper for VISUAL-ONLY fields (matches Form.Input spacing). */
function VisualField({
	label,
	required,
	hint,
	children,
}: {
	label: string;
	required?: boolean;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex w-full flex-col gap-2">
			<label className="block text-start text-sm font-medium text-[var(--foreground)]">
				{label}
				{required && <span style={{ color: ORANGE }}> *</span>}
				{hint && <span className="font-normal text-[var(--muted)]"> {hint}</span>}
			</label>
			{children}
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
					{/* Auto-fill banner (VISUAL-ONLY) */}
					<div className="flex items-start justify-between gap-3 rounded-[10px] border-r-4 border-[#1b7a3d] bg-[#eef7f0] px-4 py-3">
						<div>
							<p className="text-[14px] font-bold text-[#1b7a3d]">
								⚡ השלמה אוטומטית מהפעם הקודמת
							</p>
							<p className="text-[12px] text-[var(--muted)]">
								מילאנו עבורך פרטים שזכרנו מההזמנה האחרונה. אפשר לערוך כל שדה.
							</p>
						</div>
						<button
							type="button"
							className="shrink-0 text-[12px] font-medium text-[var(--muted)] underline"
						>
							נקה
						</button>
					</div>

					{/* 01 — customer / company */}
					<Section>
						<SectionHead num="01" title="פרטי לקוח" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{/* VISUAL-ONLY: customer-number / billing-account selector (Phase 2) */}
							<VisualField label="מספר לקוח" hint="(לפי החברה שלכם)">
								<select className={FIELD_CLASS} defaultValue="main" disabled>
									<option value="main">C-NEW-9 — חשבון ראשי (ראשי)</option>
								</select>
								<span className="text-[12px] text-[var(--muted)]">
									1 חשבון רשום בחברה שלכם
								</span>
							</VisualField>

							{/* VISUAL-ONLY: company name (Phase 2 — needs Order schema) */}
							<VisualField label="שם החברה" required>
								<input className={FIELD_CLASS} placeholder="שם החברה" />
							</VisualField>

							{/* VISUAL-ONLY: tax id (Phase 2 — needs Order schema) */}
							<VisualField label="ח.פ / עוסק מורשה" required>
								<input className={FIELD_CLASS} placeholder="מספר ח.פ / עוסק מורשה" />
							</VisualField>

							{/* WIRED: name on invoice (unchanged field) */}
							<Form.Input<TOrder> name="nameOnInvoice" label={t("common:nameOnInvoice")} />
						</div>
					</Section>

					{/* 02 — contact person */}
					<Section>
						<SectionHead num="02" title="איש קשר" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{/* WIRED */}
							<Form.Input<TOrder>
								placeholder={t("fullName")}
								name="client.displayName"
								label={t("fullName")}
							/>
							{/* VISUAL-ONLY: role/title (Phase 2) */}
							<VisualField label="תפקיד">
								<input className={FIELD_CLASS} placeholder="לדוגמה: מנהלת משרד" />
							</VisualField>
							{/* WIRED */}
							<Form.Input<TOrder>
								placeholder={t("common:phone")}
								name="client.phoneNumber"
								label={t("common:phone")}
							/>
							{/* WIRED */}
							<Form.Input<TOrder>
								placeholder={t("common:email")}
								name="client.email"
								label={t("common:email")}
							/>
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
								name="client.address.floor"
								placeholder={t("common:floor")}
								label={t("common:floor")}
							/>
							<Form.Input<TOrder>
								name="client.address.apartmentEnterNumber"
								placeholder={t("common:apartmentEnterNumber")}
								label={t("common:apartmentEnterNumber")}
							/>
							<Form.Input<TOrder>
								name="client.address.apartmentNumber"
								placeholder={t("common:apartmentNumber")}
								label={t("common:apartmentNumber")}
							/>
							{/* WIRED: delivery notes (unchanged clientComment field) */}
							<div className="sm:col-span-2">
								<Form.TextArea<TOrder>
									name="clientComment"
									label="הערות למשלוח"
								/>
							</div>
						</div>
					</Section>

					{/* 04 — delivery slot & payment */}
					<Section>
						<SectionHead num="04" title="מועד אספקה ותשלום" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{/* WIRED: delivery date */}
							<Form.Input<TOrder>
								name="deliveryDate"
								type="date"
								label={t("common:deliveryDate")}
								min={minDate}
								max={maxDate}
								defaultValue={tomorrow}
							/>
						</div>

						{/* VISUAL-ONLY: payment method (Phase 3 — credit-terms / net-30) */}
						<div className="mt-5">
							<p className="mb-2 text-sm font-medium text-[var(--foreground)]">
								אופן תשלום <span style={{ color: ORANGE }}>*</span>
							</p>
							<div className="space-y-3">
								<PaymentOption
									title="💳 כרטיס אשראי"
									subtitle="אישור מיידי · עיבוד מאובטח"
									badge="מומלץ"
									defaultChecked
								/>
								<PaymentOption
									title="🏦 העברה בנקאית"
									subtitle="פרטי חשבון יישלחו לאחר אישור ההזמנה"
								/>
								{/* "שוטף + 30" (net-30) is intentionally NOT shown on the public
								    site — owner's request. It belongs to Phase 3 (credit-terms
								    payment), pending approval. Do not re-add here. */}
							</div>
						</div>

						<div className="mt-5 grid grid-cols-1 gap-4">
							{/* VISUAL-ONLY: PO number (Phase 2) */}
							<VisualField label="הזמנת רכש (PO)">
								<input className={FIELD_CLASS} placeholder="מספר הזמנת רכש" />
							</VisualField>
						</div>
					</Section>

					{/* 05 — out-of-stock policy + consent */}
					<Section>
						<SectionHead num="05" title="אם חסר במלאי" />
						<p className="mb-3 text-[13px] text-[var(--muted)]">
							איך לנהוג אם מוצר אינו זמין בעת ההכנה?
						</p>
						{/* VISUAL-ONLY: substitution policy (Phase 2) */}
						<div className="space-y-3">
							<StockOption
								title="✅ החליפו למוצר דומה"
								subtitle="אם מוצר חסר, נשלח לכם תחליף קרוב באותו מחיר או זול יותר"
								badge="מומלץ"
								defaultChecked
							/>
							<StockOption
								title="❌ אל תחליפו — הסירו את הפריט"
								subtitle="אם מוצר חסר, פשוט אל תכללו אותו במשלוח. תקבלו זיכוי על הסכום"
							/>
						</div>

						{/* VISUAL-ONLY: consent (Phase 2) */}
						<label className="mt-4 flex items-start gap-2 text-[13px] text-[var(--foreground)]">
							<input type="checkbox" className="mt-0.5" />
							<span>
								אני מאשר/ת את{" "}
								<span className="underline" style={{ color: ORANGE }}>
									תנאי השימוש ומדיניות הפרטיות
								</span>
							</span>
						</label>
						<label className="mt-2 flex items-start gap-2 text-[13px] text-[var(--muted)]">
							<input type="checkbox" className="mt-0.5" />
							<span>
								אני מסכים/ה לקבל דיוור פרסומי על מבצעים ומוצרים חדשים (אופציונלי)
							</span>
						</label>
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

/* ---------- VISUAL-ONLY presentational sub-components (Phase 2/3) ---------- */

function PaymentOption({
	title,
	subtitle,
	badge,
	highlighted,
	defaultChecked,
}: {
	title: string;
	subtitle: string;
	badge?: string;
	highlighted?: boolean;
	defaultChecked?: boolean;
}) {
	return (
		<label
			className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border px-4 py-3"
			style={{
				borderColor: highlighted ? "#1b7a3d" : "var(--border)",
				borderStyle: highlighted ? "dashed" : "solid",
				background: highlighted ? "#eef7f0" : "transparent",
			}}
		>
			<div>
				<div className="flex items-center gap-2">
					<span className="text-[14px] font-bold text-[var(--foreground)]">{title}</span>
					{badge && (
						<span
							className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
							style={{ background: "#1b7a3d" }}
						>
							{badge}
						</span>
					)}
				</div>
				<p className="text-[12px] text-[var(--muted)]">{subtitle}</p>
			</div>
			<input type="radio" name="balasi-payment-visual" defaultChecked={defaultChecked} />
		</label>
	);
}

function StockOption({
	title,
	subtitle,
	badge,
	defaultChecked,
}: {
	title: string;
	subtitle: string;
	badge?: string;
	defaultChecked?: boolean;
}) {
	return (
		<label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] px-4 py-3">
			<div>
				<div className="flex items-center gap-2">
					<span className="text-[14px] font-bold text-[var(--foreground)]">{title}</span>
					{badge && (
						<span className="text-[11px] font-semibold text-[#1b7a3d]">({badge})</span>
					)}
				</div>
				<p className="text-[12px] text-[var(--muted)]">{subtitle}</p>
			</div>
			<input type="radio" name="balasi-stock-visual" defaultChecked={defaultChecked} />
		</label>
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
