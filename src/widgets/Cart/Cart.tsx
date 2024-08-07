import { TProduct } from "src/domains";
import { cartSlice } from "src/domains/cart";
import { useAppSelector } from "src/infra/store";
import { Product } from "../Product";

import EmptyCartImg from ".././../assets/empty-cart.png";
import classNames from "classnames";

export function Cart({ size = "sm" }: { size?: "sm" | "lg" }) {
	const cart = useAppSelector(cartSlice.selectors.selectCart);

	const isEmpty = cart.length === 0;

	return (
		<div className="flex flex-col h-full p-4 shadow">
			<div className="p-4 text-3xl font-bold">Cart</div>

			{isEmpty && (
				<div className="w-full h-full flex justify-center items-center">
					<img src={EmptyCartImg} className="w-full auto" alt="empty cart" />
				</div>
			)}

			<div className="flex flex-col gap-4 flex-grow overflow-y-auto">
				{cart.map((cartItem) => (
					<CartItem size={size} key={cartItem.product.id} cartItem={cartItem} />
				))}
			</div>
		</div>
	);
}

function CartItem({
	cartItem,
	size,
}: {
	cartItem: { amount: number; product: TProduct };
	size: "sm" | "lg";
}) {
	const { product, amount } = cartItem;

	const totalPrice = Number(product.price * amount).toFixed(2);

	return (
		<Product product={product}>
			<div className="h-20 flex items-center gap-3 justify-start">
				<div className="w-16 h-16">
					<Product.Image />
				</div>
				<div className="flex flex-col">
					<div
						className={classNames("ellipsis", {
							"w-24": size === "sm",
						})}
					>
						<Product.Name />
					</div>
					<div className="flex gap-1">
						<Product.Price />
					</div>
					<div className="">
						<Product.Weight />
					</div>
				</div>
				{size === "lg" && (
					<div className="flex items-center gap-2">
						<span>X</span>
						<span>{amount}</span>
						<span>{totalPrice}</span>
					</div>
				)}
				<div className="ms-auto flex-shrink-0">
					<Product.CartButton size="sm" />
				</div>
			</div>
		</Product>
	);
}
