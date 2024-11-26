import { Button } from "src/components/button";
import { useProduct } from "./useProduct";
import { useAppSelector } from "src/infra/store";
import { cartSlice } from "src/domains/cart";

import classNames from "classnames";
import { useAppApi } from "src/appApi";

type Props = {
	size: "sm" | "md";
};

export function ProductCartButton(props: Props) {
	const { size } = props;

	const { product } = useProduct();

	const appApi = useAppApi();

	const cartProduct = useAppSelector((state) =>
		cartSlice.selectors.selectProduct(state, product?.id)
	);

	if (!product) return null;

	if (!cartProduct?.amount) {
		return (
			<Button fullWidth onClick={() => appApi.user.addItemToCart({ product })}>
				Add to cart
			</Button>
		);
	}

	return (
		<InputButton
			size={size}
			value={cartProduct.amount}
			onChange={(_, type) => {
				if (type === "decrease") return appApi.user.removeItemFromCart({ product });
				if (type === "increase") return appApi.user.addItemToCart({ product });
			}}
		/>
	);
}

export function InputButton(props: {
	value: number;
	onChange: (value: number, type: "increase" | "decrease") => void;
	size?: "sm" | "md";
}) {
	const { onChange, value } = props;

	return (
		<div className="flex w-full items-center">
			<Button
				className="rounded-none rounded-s-lg"
				onClick={() => onChange(value - 1, "decrease")}
				size={"icon"}
			>
				-
			</Button>
			<div
				className={classNames([
					"flex-grow text-white bg size-9 flex items-center justify-center bg-primary",
				])}
				onClick={(e) => e.stopPropagation()}
			>
				{value}
			</div>
			<Button
				className=" rounded-none rounded-e-lg"
				onClick={() => onChange(value + 1, "increase")}
				size={"icon"}
			>
				+
			</Button>
		</div>
	);
}
