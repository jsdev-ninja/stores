/**
 * Balasi storefront cart DRAWER — slide-out "הסל שלי" panel.
 *
 * Styled 1:1 to the owner's prototype: 460px wide, dark `.dr-head` band
 * (eyebrow + "{N} פריטים" + close), `.dr-body` with the shared item rows and
 * a "ניקוי הסל" action, and a `.dr-foot` with the free-shipping bar, totals
 * and the "המשך להזמנה" CTA.
 *
 * PRESENTATION + existing cart actions only (totals from `getCartCost`,
 * mutations via `appApi.user.*`). Returns null for non-Balasi stores.
 */

import { useEffect } from "react";
import { getCartCost } from "@jsdev_ninja/core";
import { Icon } from "src/components";
import { useAppSelector, useStoreActions } from "src/infra";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import {
	BALASI_ORANGE,
	BalasiCartClear,
	BalasiCartEmpty,
	BalasiCartFooter,
	BalasiCartItemList,
	BalasiCheckoutCta,
} from "./cart/BalasiCartParts";

const isBalasiStore = (id?: string) => id === "balasistore_store" || id === "tester_store";

/** Header trigger — the prototype `.hdr-cart` pill: sharp dark button with an
 *  orange count bubble. The "הסל" label hides on small screens. */
export function BalasiCartButton() {
	const store = useStore();
	const cart = useCart();
	// Drive the drawer from the global ui flag so every entry point — the AppBar
	// button, the catalog buttons, and auto-open on add-to-cart — opens the same drawer.
	const actions = useStoreActions();
	const open = useAppSelector((state) => state.ui.isCartDrawerOpen);

	if (!isBalasiStore(store?.id)) return null;

	const itemCount = (cart?.items ?? []).reduce((sum, item) => sum + item.amount, 0);

	return (
		<>
			<button
				type="button"
				onClick={() => actions.dispatch(actions.ui.openCartDrawer())}
				aria-label="פתח את הסל"
				className="inline-flex items-center gap-2.5 border-[1.5px] border-[var(--foreground)] bg-[var(--foreground)] px-[18px] py-[11px] text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]"
			>
				<Icon name="cart" size="sm" />
				<span className="hidden md:inline">הסל</span>
				<span
					className="grid h-[22px] min-w-[22px] place-items-center rounded-full px-[7px] text-[11px] font-bold leading-none text-white"
					style={{ background: BALASI_ORANGE }}
				>
					{itemCount}
				</span>
			</button>
			{open && <CartDrawerPanel onClose={() => actions.dispatch(actions.ui.closeCartDrawer())} />}
		</>
	);
}

function CartDrawerPanel({ onClose }: { onClose: () => void }) {
	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();
	const user = useAppSelector((state) => state.user.user);
	const activeOrganization = useAppSelector(
		(state) => state.userOrganization.activeOrganization
	);

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
		freeShipping: activeOrganization?.freeShipping ?? false,
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
			{/* Backdrop — dimmed + blurred, like the prototype `.overlay` */}
			<div
				className="absolute inset-0 bg-[rgba(13,13,11,0.6)] backdrop-blur-[4px]"
				onClick={onClose}
				aria-hidden
			/>

			{/* Panel — 460px, slides from the start (right in RTL) */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label="הסל שלי"
				className="absolute inset-y-0 end-0 flex h-full w-full max-w-[460px] flex-col bg-[var(--background)] shadow-2xl"
			>
				{/* Dark header band (.dr-head, padding 28) */}
				<div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--foreground)] p-7 text-white">
					<div>
						<span
							className="text-[10px] font-bold uppercase tracking-[0.18em]"
							style={{ color: BALASI_ORANGE }}
						>
							הסל שלי
						</span>
						<h3 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.03em]">
							{itemCount} פריטים
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="סגור"
						className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-[var(--brand-secondary)]"
					>
						<Icon name="close" size="md" />
					</button>
				</div>

				{/* Body (.dr-body, padding 0 28) */}
				<div className="flex-1 overflow-y-auto px-7">
					{isEmpty ? (
						<BalasiCartEmpty onContinue={onClose} />
					) : (
						<>
							<BalasiCartClear />
							<BalasiCartItemList items={items} />
						</>
					)}
				</div>

				{/* Footer (.dr-foot, padding 24 28) */}
				{!isEmpty && (
					<div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-7 py-6">
						<BalasiCartFooter cartCost={cartCost} freeDeliveryPrice={freeDeliveryPrice}>
							<BalasiCheckoutCta onClick={goToCheckout} />
						</BalasiCartFooter>
					</div>
				)}
			</div>
		</div>
	);
}
