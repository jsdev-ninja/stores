/**
 * Shared Balasi cart PRESENTATION parts — one source of truth for the cart
 * look across the storefront: the slide-out drawer (CartDrawer), the docked
 * side cart (CatalogPage aside) and the /cart page (BalasiCartPage).
 *
 * Styled 1:1 to the owner's prototype (בלסי סטור/index.html + styles.css):
 * sharp corners, 60px dark thumbnails, bordered qty stepper, uppercase micro
 * labels, "ci-row" item layout and "t-row" totals. Presentation + existing
 * cart actions only — totals come from `getCartCost`, mutations go through
 * `appApi.user.*`. No business logic here.
 */

import { ReactNode } from "react";
import { getCartCost } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";
import { formatter } from "src/utils/formatter";
import { Product } from "src/widgets/Product";

const ORANGE = "var(--brand-secondary)";

type CartCost = ReturnType<typeof getCartCost>;
type CartLine = CartCost["items"][number];

/** One cart line — matches the prototype `.ci-row` (grid 60px · 1fr · auto). */
function CartRow({ item }: { item: CartLine }) {
	const appApi = useAppApi();
	const { product, amount } = item;
	const lineTotal = Number((item.finalPrice * amount).toFixed(2));

	const subtitle =
		product.weight?.unit !== "none" ? (
			<Product.Weight />
		) : product.volume?.unit !== "none" ? (
			<Product.Volume />
		) : null;

	const setAmount = (next: number) =>
		appApi.user.updateCartItemAmount({ product, amount: Math.max(0, next) });

	return (
		<Product product={product}>
			<div className="grid grid-cols-[60px_1fr_auto] items-center gap-4 border-b border-[var(--border)] py-5">
				{/* Thumbnail — 60×60 dark square */}
				<div className="grid size-[60px] place-items-center overflow-hidden bg-[var(--foreground)]">
					<Product.Image />
				</div>

				{/* Name · unit · bordered qty stepper */}
				<div className="min-w-0">
					<div className="mb-[3px] block text-[14px] font-extrabold leading-[1.25] tracking-[-0.02em] text-[var(--foreground)]">
						<Product.Name size="sm" />
					</div>
					{subtitle && (
						<div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
							{subtitle}
						</div>
					)}
					<div className="mt-2 inline-flex items-center border border-[var(--foreground)]">
						<button
							type="button"
							aria-label="הפחת"
							onClick={() => setAmount(amount - 1)}
							className="grid size-6 place-items-center text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-white"
						>
							−
						</button>
						<span className="min-w-[26px] border-x border-[var(--foreground)] py-[3px] text-center text-[12px] font-bold tracking-[0.05em]">
							{amount}
						</span>
						<button
							type="button"
							aria-label="הוסף"
							onClick={() => setAmount(amount + 1)}
							className="grid size-6 place-items-center text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-white"
						>
							+
						</button>
					</div>
				</div>

				{/* Price + remove (left in RTL) */}
				<div className="text-left">
					<div className="text-[18px] font-black tracking-[-0.03em] text-[var(--foreground)]">
						{formatter.price(lineTotal)}
					</div>
					<button
						type="button"
						onClick={() => setAmount(0)}
						className="mt-2 block text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--brand-secondary)]"
					>
						הסר
					</button>
				</div>
			</div>
		</Product>
	);
}

/** "ניקוי הסל" clear-cart action (prototype `.cart-clear-btn`). */
export function BalasiCartClear() {
	const appApi = useAppApi();
	return (
		<div className="pt-5">
			<button
				type="button"
				onClick={() => appApi.user.clearCart()}
				aria-label="נקה את הסל"
				className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
			>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
				<span>ניקוי הסל</span>
			</button>
		</div>
	);
}

/** The list of cart lines (assumes a non-empty cart). */
export function BalasiCartItemList({ items }: { items: CartCost["items"] }) {
	return (
		<div>
			{items.map((item) => (
				<CartRow key={item.product.id} item={item} />
			))}
		</div>
	);
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex items-center justify-between py-[5px] text-[13px] tracking-[0.02em] text-[var(--foreground)]">
			<span>{label}</span>
			<span>{value}</span>
		</div>
	);
}

/** Free-shipping progress bar — matches the prototype `.ship-progress`. */
export function BalasiFreeShippingBar({
	cartCost,
	freeDeliveryPrice,
}: {
	cartCost: CartCost;
	freeDeliveryPrice: number;
}) {
	if (freeDeliveryPrice <= 0) return null;

	const isFree = cartCost.productsCost >= freeDeliveryPrice;
	const remaining = Math.max(0, freeDeliveryPrice - cartCost.productsCost);
	const percent = isFree
		? 100
		: Math.min(100, Math.round((cartCost.productsCost / freeDeliveryPrice) * 100));

	return (
		<div
			className="mb-4 rounded-[2px] border px-4 py-3"
			style={{
				borderColor: isFree ? "var(--success)" : "var(--border)",
				background: isFree ? "color-mix(in oklab, var(--success) 8%, transparent)" : "var(--background)",
			}}
		>
			<div className="flex items-center justify-between gap-2">
				<span className="text-[13px] font-medium text-[var(--foreground)]">
					{isFree ? (
						<>משלוח חינם זכאי לך! 🎉</>
					) : (
						<>
							עוד <b>{formatter.price(remaining)}</b> ויש לך משלוח חינם
						</>
					)}
				</span>
				<span aria-hidden>{isFree ? "✓" : "🚚"}</span>
			</div>
			<div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--default)]">
				<div
					className="h-full rounded-full bg-[var(--success)] transition-all"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}

/** Free-shipping bar + `.totals` (t-rows) + bold total + a CTA slot. */
export function BalasiCartFooter({
	cartCost,
	freeDeliveryPrice,
	children,
}: {
	cartCost: CartCost;
	freeDeliveryPrice: number;
	children?: ReactNode;
}) {
	const deliveryPrice = cartCost.deliveryPrice ?? 0;

	return (
		<div>
			<BalasiFreeShippingBar cartCost={cartCost} freeDeliveryPrice={freeDeliveryPrice} />

			<div className="mb-[18px]">
				{cartCost.discount > 0 && (
					<div className="flex items-center justify-between py-[5px] text-[13px] tracking-[0.02em]">
						<span className="text-[var(--foreground)]">הנחות מבצעים</span>
						<span className="font-bold text-[#1b7a3d]">- {formatter.price(cartCost.discount)}</span>
					</div>
				)}
				<SummaryRow label="סכום ביניים" value={formatter.price(cartCost.cost)} />
				<SummaryRow
					label="משלוח"
					value={deliveryPrice > 0 ? formatter.price(deliveryPrice) : "חינם"}
				/>
				<SummaryRow label={'מע"מ (18%)'} value={formatter.price(cartCost.vat)} />

				<div className="mt-2 flex items-center justify-between border-t border-[var(--foreground)] pt-[14px] text-[22px] font-black tracking-[-0.03em] text-[var(--foreground)]">
					<span>סה"כ</span>
					<span>{formatter.price(cartCost.finalCost)}</span>
				</div>
			</div>

			{children}
		</div>
	);
}

/** Dark "המשך להזמנה" CTA (prototype `.btn-dark btn-block`). */
export function BalasiCheckoutCta({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-center gap-2 bg-[var(--foreground)] py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
		>
			<span>המשך להזמנה</span>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
		</button>
	);
}

/** Shared empty-cart block (prototype `.cart-empty`). */
export function BalasiCartEmpty({ onContinue }: { onContinue?: () => void }) {
	return (
		<div className="px-5 py-20 text-center text-[var(--muted)]">
			<div className="mx-auto mb-[18px] grid size-[70px] place-items-center rounded-full bg-[var(--foreground)] text-white">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
					<circle cx="9" cy="21" r="1" />
					<circle cx="20" cy="21" r="1" />
					<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
				</svg>
			</div>
			<h3 className="mb-1.5 text-[22px] font-black tracking-[-0.025em] text-[var(--foreground)]">
				הסל ריק
			</h3>
			<p className="text-[13px]">הוסיפו מוצרים מהקטלוג כדי להתחיל הזמנה</p>
			{onContinue && (
				<button
					type="button"
					onClick={onContinue}
					className="mt-4 bg-[var(--foreground)] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-white"
				>
					המשך לקנייה
				</button>
			)}
		</div>
	);
}

export { ORANGE as BALASI_ORANGE };
