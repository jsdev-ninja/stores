import { Button, InputButton } from "src/components/Button/Button";
import { useProduct } from "./useProduct";
import { useAppSelector, useFullID } from "src/infra/store";
import { cartSlice } from "src/domains/cart";
import { CartService } from "src/domains/cart/CartService";
import { ProductSchema } from "src/domains";
import { mixPanelApi } from "src/lib/mixpanel";

type Props = {
	size: "sm" | "md";
};

export function ProductCartButton(props: Props) {
	const { size } = props;

	const cartItems = useAppSelector(cartSlice.selectors.selectCart);

	const { product } = useProduct();

	const fullID = useFullID();

	const cartProduct = useAppSelector((state) =>
		cartSlice.selectors.selectProduct(state, product?.id)
	);

	function addItem() {
		if (!product) return;

		const result = ProductSchema.safeParse(product);

		if (!result.success) {
			console.log(result.error.errors);

			return null; // todo
		}

		const _product = result.data;

		const productIndex = cartItems.findIndex((cartItem) => cartItem.product.id === product?.id);
		const productInCart = productIndex !== -1;
		if (productInCart) {
			const items = structuredClone(cartItems);
			items[productIndex].amount += 1;
			CartService.updateCart(fullID, { items });

			return;
		}

		const items = [
			...cartItems,
			{
				amount: 1,
				product: _product,
			},
		];

		CartService.updateCart(fullID, { items: items });
		mixPanelApi.track("USER_ADD_ITEM_TO_CART", {
			productId: product.id,
			productName: product.locales[0].value, //todo get correct lang
		});
	}

	function removeItem() {
		if (!product) return;

		const productIndex = cartItems.findIndex((cartItem) => cartItem.product.id === product.id);
		const productInCart = productIndex !== -1;
		if (!productInCart) return;

		const items = structuredClone(cartItems);

		if (items[productIndex].amount > 1) {
			items[productIndex].amount -= 1;
			CartService.updateCart(fullID, { items });

			return;
		}
		items.splice(productIndex, 1);

		CartService.updateCart(fullID, { items });
	}

	if (!product) return null;

	if (!cartProduct?.amount) {
		return (
			<Button fullWidth onClick={() => addItem()}>
				Add to cart
			</Button>
		);
	}

	return (
		<InputButton
			size={size}
			value={cartProduct.amount}
			onChange={(_, type) => {
				if (type === "decrease") return removeItem();
				if (type === "increase") return addItem();
			}}
		/>
	);
}
