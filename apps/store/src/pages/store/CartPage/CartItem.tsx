import { TProduct } from "@jsdev_ninja/core";
import { Product } from "src/widgets/Product";

export function CartItem({ cartItem }: { cartItem: { amount: number; product: TProduct } }) {
	const { product, amount } = cartItem;

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
					</div>
				</div>
			</div>
		</Product>
	);
}
