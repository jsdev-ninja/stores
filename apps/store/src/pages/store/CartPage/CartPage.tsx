import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { cartSlice } from "src/domains/cart";
import { useAppSelector } from "src/infra";
import { navigate } from "src/navigation";
import { PaymentSummary } from "src/widgets/PaymentSummary";
import { CartItem } from "./CartItem";
import { useDiscounts } from "src/domains/Discounts/Discounts";
// import { TCart, TDiscount } from "@jsdev_ninja/core";
import { getCartCost } from "src/utils/calculateCartPrice";

function CartPage() {
	const { t } = useTranslation(["common", "cart"]);

	const cart = useAppSelector(cartSlice.selectors.selectCart);

	const discounts = useDiscounts();

	const cartCost = getCartCost({ cart, discounts: discounts });

	console.log("cartCost", cartCost);

	return (
		<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
					{t("cart:shoppingCart")}
				</h2>
				<div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
					<div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl">
						<div className="space-y-6">
							{cartCost.items?.map((cartItem) => (
								<CartItem key={cartItem.product.id} cartItem={cartItem} />
							))}
						</div>
					</div>
					<PaymentSummary>
						<Button
							onPress={() =>
								navigate({
									to: "store.checkout",
								})
							}
							fullWidth
						>
							{t("cart:proceedToCheckout")}
						</Button>
						<Button
							onPress={() =>
								navigate({
									to: "store",
								})
							}
							fullWidth
							variant={"ghost"}
						>
							{t("cart:backToShop")}
							<svg
								className="h-5 w-5 rotate-180"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 12H5m14 0-4 4m4-4-4-4"
								/>
							</svg>
						</Button>
					</PaymentSummary>
				</div>
			</div>
		</section>
	);
}

export default CartPage;
