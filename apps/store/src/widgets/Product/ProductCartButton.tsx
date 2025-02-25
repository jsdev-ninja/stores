import { Button } from "src/components/button";
import { useProduct } from "./useProduct";
import { useAppSelector } from "src/infra/store";
import { cartSlice } from "src/domains/cart";
import { useAppApi } from "src/appApi";
import { ButtonGroup, ButtonProps } from "@nextui-org/react";
import { useTranslation } from "react-i18next";

type Props = Omit<ButtonProps, "value" | "onChange">;

export function ProductCartButton(props: Props) {
	const { product } = useProduct();

	const { t } = useTranslation(["common"]);

	const appApi = useAppApi();

	const cartProduct = useAppSelector((state) =>
		cartSlice.selectors.selectProduct(state, product?.id)
	);

	if (!product) return null;

	if (!cartProduct?.amount) {
		return (
			<Button
				color="primary"
				fullWidth
				onPress={() => {
					appApi.user.addItemToCart({ product });
				}}
				{...props}
			>
				{t("addToCart")}
			</Button>
		);
	}

	return (
		<InputButton
			value={cartProduct.amount}
			onChange={(_, type) => {
				if (type === "decrease") return appApi.user.removeItemFromCart({ product });
				if (type === "increase") return appApi.user.addItemToCart({ product });
			}}
			{...props}
		/>
	);
}

type InputButtonProps = Omit<ButtonProps, "value" | "onChange"> & {
	value: number;
	onChange: (value: number, type: "increase" | "decrease") => void;
};
export function InputButton(props: InputButtonProps) {
	const { onChange, value, size, ...rest } = props;

	return (
		<ButtonGroup size={size} color="primary" className="mx-auto w-full">
			<Button
				className="rounded-none rounded-s-lg"
				onClick={() => onChange(value - 1, "decrease")}
				isIconOnly
				{...rest}
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
				{...rest}
			>
				+
			</Button>
		</ButtonGroup>
	);
}
