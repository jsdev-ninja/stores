import { TProduct } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { cartSlice } from "src/domains/cart";
import { useAppSelector } from "src/infra";
import { navigate } from "src/navigation";
import { PaymentSummary } from "src/widgets/PaymentSummary";
import { Product } from "src/widgets/Product";

function CartItem({ cartItem }: { cartItem: { amount: number; product: TProduct } }) {
	const { product, amount } = cartItem;

	const { t } = useTranslation(["common", "cart"]);

	const user = useAppSelector((state) => state.user.user);

	const isNotAnonymous = !user?.isAnonymous;

	const totalPrice = Number(product.price * amount).toFixed(2);

	return (
		<Product product={product}>
			<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-6">
				<div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
					<div className="size-20">
						<Product.Image />
					</div>

					<div className="flex items-center justify-between md:order-3 md:justify-end">
						<div className="">
							<Product.CartButton size="sm" />
						</div>

						<div className="text-end md:order-4 md:w-32 flex items-center gap-2 px-4">
							<Product.Price />
							<div className="flex items-center gap-2 font-bold text-xl text-primary">
								<span>{totalPrice}</span>
							</div>
						</div>
					</div>
					<div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
						<Product.Name />

						<div className="flex items-center">
							{isNotAnonymous && (
								<Button size={"sm"} type="button" variant={"ghost"}>
									<svg
										className="me-1.5 h-5 w-5"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width={24}
										height={24}
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"
										/>
									</svg>
									{t("addToFavorite")}
								</Button>
							)}
							<Button size={"sm"} type="button" variant={"ghost"}>
								<svg
									className="me-1.5 h-5 w-5"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									width={24}
									height={24}
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18 17.94 6M18 18 6.06 6"
									/>
								</svg>
								{t("remove")}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Product>
	);
}
function CartPage() {
	const { t } = useTranslation(["common", "cart"]);

	const cart = useAppSelector(cartSlice.selectors.selectCart);

	return (
		<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
					{t("cart:shoppingCart")}
				</h2>
				<div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
					<div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl">
						<div className="space-y-6">
							{cart?.map((cartItem) => (
								<CartItem key={cartItem.product.id} cartItem={cartItem} />
							))}
						</div>
					</div>
					<PaymentSummary>
						<Button
							onClick={() =>
								navigate({
									to: "store.checkout",
								})
							}
							fullWidth
						>
							{t("cart:proceedToCheckout")}
						</Button>
						<Button
							onClick={() =>
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
