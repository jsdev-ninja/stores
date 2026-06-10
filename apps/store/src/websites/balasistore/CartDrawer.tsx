/**
 * Balasi storefront cart DRAWER — slide-out "הסל שלי" panel.
 *
 * Matches the Balasi design: dark header band with item count, item rows with
 * the shared +/- stepper, a free-shipping progress bar, an order summary
 * (סכום ביניים / משלוח / מע"ם / סה"כ) and a "המשך להזמנה" CTA.
 *
 * This is PRESENTATION + existing cart actions only. All add / remove / update
 * go through the same `appApi.user.*` methods the rest of the storefront uses,
 * and the totals come from the shared `getCartCost` — no business logic here.
 *
 * Rendered from the shared <AppBar/>; returns null for non-Balasi stores so it
 * is fully scoped to balasistore (+ the tester preview store).
 */

import { useEffect, useState } from "react";
import { getCartCost, TProduct } from "@jsdev_ninja/core";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";
import { useAppSelector } from "src/infra";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import { formatter } from "src/utils/formatter";
import { Product } from "src/widgets/Product";

const ORANGE = "var(--brand-secondary)";

const isBalasiStore = (id?: string) => id === "balasistore_store" || id === "tester_store";

/** Header trigger (cart icon + count badge) that opens the Balasi cart drawer. */
export function BalasiCartButton() {
	const store = useStore();
	const cart = useCart();
	const [open, setOpen] = useState(false);

	if (!isBalasiStore(store?.id)) return null;

	const itemCount = (cart?.items ?? []).reduce((sum, item) => sum + item.amount, 0);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="פתח את הסל"
				className="relative flex items-center justify-center p-1 text-[var(--foreground)] transition-opacity hover:opacity-70"
			>
				<Icon name="cart" size="md" />
				{itemCount > 0 && (
					<span
						className="absolute -top-1.5 -end-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-bold leading-none text-white"
						style={{ background: ORANGE }}
					>
						{itemCount}
					</span>
				)}
			</button>
			{open && <CartDrawerPanel onClose={() => setOpen(false)} />}
		</>
	);
}

function CartDrawerPanel({ onClose }: { onClose: () => void }) {
	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();
	const appApi = useAppApi();
	const user = useAppSelector((state) => state.user.user);

	// Esc to close + lock background scroll while the drawer is open.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [onClose]);

	if (!store) return null;

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	const items = cartCost.items;
	const itemCount = items.reduce((sum, item) => sum + item.amount, 0);
	const isEmpty = items.length === 0;

	const freeDeliveryPrice = store.freeDeliveryPrice ?? 0;
	const deliveryPrice = cartCost.deliveryPrice ?? 0;
	const hasFreeDeliveryGoal = freeDeliveryPrice > 0;
	const isFreeDelivery = hasFreeDeliveryGoal && cartCost.productsCost >= freeDeliveryPrice;
	const amountNeeded = Math.max(0, freeDeliveryPrice - cartCost.productsCost);
	const progress = hasFreeDeliveryGoal
		? Math.min(100, (cartCost.productsCost / freeDeliveryPrice) * 100)
		: 0;

	const goToCheckout = () => {
		onClose();
		if (user?.admin) {
			navigate({ to: "admin.createOrder" });
		} else {
			navigate({ to: "store.checkout" });
		}
	};

	return (
		<div dir="rtl" className="fixed inset-0 z-[100]">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-[var(--backdrop)]"
				onClick={onClose}
				aria-hidden
			/>

			{/* Panel — slides from the start (right in RTL) */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label="הסל שלי"
				className="absolute inset-y-0 end-0 flex h-full w-full max-w-[420px] flex-col bg-[var(--background)] shadow-2xl"
			>
				{/* Dark header band */}
				<div className="flex items-center justify-between bg-[var(--foreground)] px-5 py-5 text-white">
					<button
						type="button"
						onClick={onClose}
						aria-label="סגור"
						className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
					>
						<Icon name="close" size="md" />
					</button>
					<div className="text-right">
						<div className="text-[12px] font-bold tracking-[0.12em]" style={{ color: ORANGE }}>
							הסל שלי
						</div>
						<div className="text-[22px] font-black leading-tight">{itemCount} פריטים</div>
					</div>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-5 py-4">
					{isEmpty ? (
						<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
							<Icon name="cart" size="lg" />
							<p className="text-[15px] font-semibold text-[var(--foreground)]">הסל שלך ריק</p>
							<button
								type="button"
								onClick={onClose}
								className="mt-1 rounded-md bg-[var(--foreground)] px-5 py-2.5 text-[13px] font-bold text-white"
							>
								המשך לקנייה
							</button>
						</div>
					) : (
						<>
							<div className="mb-3 flex justify-start">
								<button
									type="button"
									onClick={() => appApi.user.clearCart()}
									className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
								>
									<Icon name="trash" size="sm" />
									ניקוי הסל
								</button>
							</div>

							<div className="divide-y divide-[var(--border)]">
								{items.map((item) => (
									<CartRow
										key={item.product.id}
										product={item.product}
										lineTotal={Number((item.finalPrice * item.amount).toFixed(2))}
										onRemove={() =>
											appApi.user.updateCartItemAmount({ product: item.product, amount: 0 })
										}
									/>
								))}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				{!isEmpty && (
					<div className="shrink-0 space-y-4 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4">
						{hasFreeDeliveryGoal &&
							(isFreeDelivery ? (
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
							) : (
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
							))}

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

						<button
							type="button"
							onClick={goToCheckout}
							className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--foreground)] py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
						>
							<span>המשך להזמנה</span>
							<span aria-hidden>←</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function CartRow({
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
					{subtitle && (
						<div className="text-[12px] text-[var(--muted)]">{subtitle}</div>
					)}
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
