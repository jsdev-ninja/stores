import { TProduct } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { useAppSelector } from "src/infra";
import { Product } from "src/widgets/Product";

export function CartItem({ cartItem }: { cartItem: { amount: number; product: TProduct } }) {
	const { product, amount } = cartItem;

	const { t } = useTranslation(["common", "cart"]);

	const user = useAppSelector((state) => state.user.user);

	const isNotAnonymous = !user?.isAnonymous;

	const totalPrice = Number(product.price * amount).toFixed(2);

	return (
		<Product product={product}>
			<div className="rounded-lg border-b border-gray-200 bg-white p-4  dark:border-gray-700 dark:bg-gray-800 md:p-6">
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
