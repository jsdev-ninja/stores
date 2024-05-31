import { Button, InputButton } from "src/components/Button/Button";
import { useProduct } from "./useProduct";
import { useAppSelector, useStoreActions } from "src/infra/store";
import { cartSlice } from "src/domains/cart";

type Props = {
	size: "sm" | "md";
};

export function ProductCartButton(props: Props) {
	const { size } = props;

	const { product } = useProduct();

	const cartProduct = useAppSelector((state) =>
		cartSlice.selectors.selectProduct(state, product?.id)
	);

	const actions = useStoreActions();

	if (!product) return null;

	if (!cartProduct?.amount) {
		return (
			<Button fullWidth onClick={() => actions.dispatch(actions.cart.addItem(product))}>
				Add to cart
			</Button>
		);
	}

	return (
		<InputButton
			size={size}
			value={cartProduct.amount}
			onChange={(_, type) => {
				if (type === "decrease") return actions.dispatch(actions.cart.removeItem(product));
				if (type === "increase") return actions.dispatch(actions.cart.addItem(product));
			}}
		/>
	);
}
