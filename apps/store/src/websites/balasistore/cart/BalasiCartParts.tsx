/**
 * Shared Balasi cart PRESENTATION parts — one source of truth for the cart
 * look across the storefront: the slide-out drawer (CartDrawer), the desktop
 * side cart (CatalogPage aside) and the /cart page (BalasiCartPage).
 *
 * Presentation + existing cart actions only. Totals come from the shared
 * `getCartCost`; item mutations go through the same `appApi.user.*` methods —
 * no business logic here.
 */

import { ReactNode } from "react";
import { getCartCost, TProduct } from "@jsdev_ninja/core";
import { Icon } from "src/components";
import { formatter } from "src/utils/formatter";
import { Product } from "src/widgets/Product";

const ORANGE = "var(--brand-secondary)";

type CartCost = ReturnType<typeof getCartCost>;

/** One cart line: image · name/subtitle/stepper · price + remove. */
export function CartRow({
	product,
	lineTotal,
	onRemove,
}: {
	product: TProduct;
	lineTotal: number;
	onRemove: () => void;
}) {
	const subtitle =
		product.weight?.unit !== "none" ? (
			<Product.Weight />
		) : product.volume?.unit !== "none" ? (
			<Product.Volume />
		) : null;

	return (
		<Product product={product}>
			<div className="flex items-start gap-3 py-4">
				{/* Image (right in RTL) */}
				<div className="size-16 shrink-0 overflow-hidden rounded-[10px] bg-[var(--foreground)]">
					<Product.Image />
				</div>

				{/* Name + subtitle + stepper */}
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<div className="text-[14px] font-bold leading-snug text-[var(--foreground)]">
						<Product.Name size="sm" />
					</div>
					{subtitle && <div className="text-[12px] text-[var(--muted)]">{subtitle}</div>}
					<div className="mt-1 w-[124px]">
						<Product.CartButton size="sm" />
					</div>
				</div>

				{/* Price + remove (left in RTL) */}
				<div className="flex shrink-0 flex-col items-end text-left">
					<div className="text-[17px] font-black text-[var(--foreground)]">
						{formatter.price(lineTotal)}
					</div>
					<button
						type="button"
						onClick={onRemove}
						className="mt-1 text-[12px] text-[var(--muted)] underline underline-offset-2 transition-colors hover:text-[var(--danger)]"
					>
						הסר
					</button>
				</div>
			</div>
		</Product>
	);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="font-normal text-[var(--muted)]">{label}</span>
			<span className="font-semibold text-[var(--foreground)]">{value}</span>
		</div>
	);
}

/** The divided list of cart lines (assumes a non-empty cart). */
export function BalasiCartItemList({
	items,
	onRemove,
}: {
	items: CartCost["items"];
	onRemove: (product: TProduct) => void;
}) {
	return (
		<div className="divide-y divide-[var(--border)]">
			{items.map((item) => (
				<CartRow
					key={item.product.id}
					product={item.product}
					lineTotal={Number((item.finalPrice * item.amount).toFixed(2))}
					onRemove={() => onRemove(item.product)}
				/>
			))}
		</div>
	);
}

/** Free-shipping progress bar (only when the store has a free-shipping goal). */
export function BalasiFreeShippingBar({
	cartCost,
	freeDeliveryPrice,
}: {
	cartCost: CartCost;
	freeDeliveryPrice: number;
}) {
	const hasGoal = freeDeliveryPrice > 0;
	if (!hasGoal) return null;

	const isFree = cartCost.productsCost >= freeDeliveryPrice;
	const amountNeeded = Math.max(0, freeDeliveryPrice - cartCost.productsCost);
	const progress = Math.min(100, (cartCost.productsCost / freeDeliveryPrice) * 100);

	if (isFree) {
		return (
			<div className="rounded-[10px] border-2 border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] px-4 py-3">
				<div className="flex items-center justify-between gap-2">
					<span className="text-[14px] font-bold text-[var(--foreground)]">
						🎉 משלוח חינם זכאי לך!
					</span>
					<span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--success)] text-white">
						<Icon name="checkCircle" size="sm" />
					</span>
				</div>
				<div className="mt-2.5 h-2 w-full rounded-full bg-[var(--success)]" />
			</div>
		);
	}

	return (
		<div className="rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-4 py-3">
			<div className="text-right text-[13px] font-medium text-[var(--foreground)]">
				עוד {formatter.price(amountNeeded)} למשלוח חינם
			</div>
			<div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--default)]">
				<div
					className="h-full rounded-full bg-[var(--success)] transition-all"
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	);
}

/** Free-shipping bar + price summary + total + a CTA slot (`children`). */
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
		<div className="space-y-4">
			<BalasiFreeShippingBar cartCost={cartCost} freeDeliveryPrice={freeDeliveryPrice} />

			<div className="space-y-2.5 text-[14px]">
				<SummaryRow label="סכום ביניים" value={formatter.price(cartCost.cost)} />
				{cartCost.discount > 0 && (
					<SummaryRow label="הנחה" value={`- ${formatter.price(cartCost.discount)}`} />
				)}
				<SummaryRow
					label="משלוח"
					value={deliveryPrice > 0 ? formatter.price(deliveryPrice) : "חינם"}
				/>
				<SummaryRow label='מע"מ (18%)' value={formatter.price(cartCost.vat)} />
			</div>

			<div className="flex items-center justify-between border-t-2 border-[var(--foreground)] pt-3">
				<span className="text-[16px] font-extrabold text-[var(--foreground)]">סה"כ</span>
				<span className="text-[20px] font-black text-[var(--foreground)]">
					{formatter.price(cartCost.finalCost)}
				</span>
			</div>

			{children}
		</div>
	);
}

/** Shared empty-cart block. */
export function BalasiCartEmpty({ onContinue }: { onContinue?: () => void }) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
			<Icon name="cart" size="lg" />
			<p className="text-[15px] font-semibold text-[var(--foreground)]">הסל שלך ריק</p>
			{onContinue && (
				<button
					type="button"
					onClick={onContinue}
					className="mt-1 rounded-md bg-[var(--foreground)] px-5 py-2.5 text-[13px] font-bold text-white"
				>
					המשך לקנייה
				</button>
			)}
		</div>
	);
}

export { ORANGE as BALASI_ORANGE };
