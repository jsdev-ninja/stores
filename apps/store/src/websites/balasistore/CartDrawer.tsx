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
import { getCartCost } from "@jsdev_ninja/core";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";
import { useAppSelector } from "src/infra";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import { BalasiCartEmpty, BalasiCartFooter, BalasiCartItemList } from "./cart/BalasiCartParts";

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
			{/* "הסל [count]" pill — dark button with an orange count badge. */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="פתח את הסל"
				className="flex items-center gap-2 rounded-md bg-[var(--foreground)] px-3 py-2 text-white transition-opacity hover:opacity-90"
			>
				<Icon name="cart" size="sm" />
				<span className="text-[14px] font-bold leading-none">הסל</span>
				<span
					className="grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[12px] font-bold leading-none text-white"
					style={{ background: ORANGE }}
				>
					{itemCount}
				</span>
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
						<BalasiCartEmpty onContinue={onClose} />
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

							<BalasiCartItemList
								items={items}
								onRemove={(product) =>
									appApi.user.updateCartItemAmount({ product, amount: 0 })
								}
							/>
						</>
					)}
				</div>

				{/* Footer */}
				{!isEmpty && (
					<div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4">
						<BalasiCartFooter cartCost={cartCost} freeDeliveryPrice={freeDeliveryPrice}>
							<button
								type="button"
								onClick={goToCheckout}
								className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--foreground)] py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
							>
								<span>המשך להזמנה</span>
								<span aria-hidden>←</span>
							</button>
						</BalasiCartFooter>
					</div>
				)}
			</div>
		</div>
	);
}
