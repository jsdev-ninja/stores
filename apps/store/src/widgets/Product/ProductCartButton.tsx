import { Button } from "src/components/button";
import { useProduct } from "./useProduct";
import { useAppSelector } from "src/infra/store";
import { cartSlice } from "src/domains/cart";
import { useAppApi } from "src/appApi";
import { ButtonGroup } from "@nextui-org/react";

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
			<Button color="primary" fullWidth onClick={() => appApi.user.addItemToCart({ product })}>
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
	const { onChange, value, size } = props;

	return (
		<ButtonGroup size={size} color="primary" className="mx-auto w-full">
			<Button
				className="rounded-none rounded-s-lg"
				onClick={() => onChange(value - 1, "decrease")}
				isIconOnly
			>
				-
			</Button>
			<Button fullWidth onClick={(e) => e.stopPropagation()} disableRipple disabled>
				{value}
			</Button>
			<Button
				className=" rounded-none rounded-e-lg"
				onClick={() => onChange(value + 1, "increase")}
				isIconOnly
			>
				+
			</Button>
		</ButtonGroup>
	);
}
