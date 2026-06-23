/**
 * Balasi storefront /cart page — same design language as the cart drawer and
 * the B2B checkout (dark header band, shared cart rows + summary). Presentation
 * only; reuses the shared cart parts and the existing `appApi.user.*` actions.
 */

import { getCartCost } from "@jsdev_ninja/core";
import { useAppSelector } from "src/infra";
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

export default function BalasiCartPage() {
	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();
	const user = useAppSelector((state) => state.user.user);

	if (!store) return null;

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	const isEmpty = !cartCost.items?.length;
	const freeDeliveryPrice = store.freeDeliveryPrice ?? 0;

	const goToCheckout = () => {
		if (user?.admin) {
			navigate({ to: "admin.createOrder" });
		} else {
			navigate({ to: "store.checkout" });
		}
	};

	return (
		<section dir="rtl" className="bg-[var(--background)] py-8 md:py-12">
			<div className="mx-auto max-w-screen-lg px-4">
				{/* Dark header band — matches the cart drawer / checkout */}
				<div className="mb-6 border-b border-[var(--border)] bg-[var(--foreground)] p-7 text-white">
					<span
						className="text-[10px] font-bold uppercase tracking-[0.18em]"
						style={{ color: BALASI_ORANGE }}
					>
						סל קניות
					</span>
					<h1 className="mt-1 text-[26px] font-black tracking-[-0.03em]">הסל שלי</h1>
				</div>

				{isEmpty ? (
					<div className="border border-[var(--border)] bg-[var(--surface)] p-6">
						<BalasiCartEmpty onContinue={() => navigate({ to: "store" })} />
					</div>
				) : (
					<div className="md:flex md:items-start md:gap-6">
						{/* Items */}
						<div className="min-w-0 flex-1 border border-[var(--border)] bg-[var(--surface)] px-6">
							<BalasiCartClear />
							<BalasiCartItemList items={cartCost.items} />
						</div>

						{/* Summary */}
						<div className="mt-6 w-full md:mt-0 md:w-[360px] md:shrink-0">
							<div className="border border-[var(--border)] bg-[var(--surface)] p-6">
								<BalasiCartFooter cartCost={cartCost} freeDeliveryPrice={freeDeliveryPrice}>
									<BalasiCheckoutCta onClick={goToCheckout} />
									<button
										type="button"
										onClick={() => navigate({ to: "store" })}
										className="mt-2 w-full border border-[var(--border)] py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
									>
										המשך לקנייה
									</button>
								</BalasiCartFooter>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
