import { useTranslation } from "react-i18next";
import { useAppSelector } from "src/infra";
import { getCartCost } from "@jsdev_ninja/core";
import { CartItem } from "./CartItem";
import { PaymentSummary } from "src/widgets/PaymentSummary";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";

function CartPage() {
	const { t } = useTranslation(["common", "cart"]);

	const user = useAppSelector((state) => state.user.user);

	const cartData = useAppSelector((state) => state.cart);
	const cart = cartData.currentCart;

	const store = useStore();
	const discounts = useDiscounts();

	if (!store) {
		return null;
	}

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts: discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

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
							onPress={() => {
								if (user?.admin) {
									navigate({ to: "admin.createOrder" });
								} else {
									navigate({ to: "store.checkout" });
								}
							}}
							fullWidth
						>
							{user?.admin
								? t("cart:createOrder", "Create Order")
								: t("cart:proceedToCheckout")}
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
