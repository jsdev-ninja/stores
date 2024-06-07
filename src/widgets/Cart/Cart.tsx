import { TProduct } from "src/domains";
import { cartSlice } from "src/domains/cart";
import { useAppSelector } from "src/infra/store";
import { Product } from "../Product";

export function Cart() {
	const cart = useAppSelector(cartSlice.selectors.selectCart);

	const isEmpty = cart.length === 0;

	return (
		<div className="flex flex-col h-full p-4">
			<div className="p-4 text-3xl font-bold">Cart</div>

			{isEmpty && <div className="">Empty Cart</div>}

			<div className="">
				{cart.map((cartItem) => (
					<CartItem key={cartItem.product.id} cartItem={cartItem} />
				))}
			</div>
		</div>
	);
}

function CartItem({ cartItem }: { cartItem: { amount: number; product: TProduct } }) {
	const { product } = cartItem;
	return (
		<Product product={product}>
			<div className="h-20 flex items-center gap-3 justify-start">
				<div className="w-16 h-16">
					<Product.Image />
				</div>
				<div className="flex flex-col">
					<Product.Name />
					<div className="flex gap-1">
						<Product.Price />
					</div>
					<div className="">
						<Product.Weight />
					</div>
				</div>
				<div className="ms-auto">
					<Product.CartButton size="sm" />
				</div>
			</div>
		</Product>
	);
}
