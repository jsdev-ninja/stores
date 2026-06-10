/**
 * Balasi storefront /cart page — same design language as the cart drawer and
 * the B2B checkout (dark header band, shared cart rows + summary). Presentation
 * only; reuses the shared cart parts and the existing `appApi.user.*` actions.
 */

import { getCartCost } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";
import { useAppSelector } from "src/infra";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import {
	BALASI_ORANGE,
	BalasiCartEmpty,
	BalasiCartFooter,
	BalasiCartItemList,
} from "./cart/BalasiCartParts";

export default function BalasiCartPage() {
	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();
	const appApi = useAppApi();
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
				<div className="mb-6 rounded-[12px] bg-[var(--foreground)] px-6 py-5 text-white">
					<div
						className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]"
						style={{ color: BALASI_ORANGE }}
					>
						סל קניות
					</div>
					<h1 className="text-[26px] font-black tracking-tight">הסל שלי</h1>
				</div>

				{isEmpty ? (
					<div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6">
						<BalasiCartEmpty onContinue={() => navigate({ to: "store" })} />
					</div>
				) : (
					<div className="md:flex md:items-start md:gap-6">
						{/* Items */}
						<div className="min-w-0 flex-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
							<div className="mb-2 flex justify-start">
								<button
									type="button"
									onClick={() => appApi.user.clearCart()}
									className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
								>
									ניקוי הסל
								</button>
							</div>
							<BalasiCartItemList
								items={cartCost.items}
								onRemove={(product) =>
									appApi.user.updateCartItemAmount({ product, amount: 0 })
								}
							/>
						</div>

						{/* Summary */}
						<div className="mt-6 w-full md:mt-0 md:w-[360px] md:shrink-0">
							<div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
								<BalasiCartFooter cartCost={cartCost} freeDeliveryPrice={freeDeliveryPrice}>
									<button
										type="button"
										onClick={goToCheckout}
										className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--foreground)] py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
									>
										<span>המשך להזמנה</span>
										<span aria-hidden>←</span>
									</button>
									<button
										type="button"
										onClick={() => navigate({ to: "store" })}
										className="w-full rounded-md border border-[var(--border)] py-3 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
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
