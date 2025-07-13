import { Button } from "src/components/button";
import { useProduct } from "./useProduct";
import { useAppSelector } from "src/infra/store";
import { cartSlice } from "src/domains/cart";
import { useAppApi } from "src/appApi";
import { ButtonGroup, ButtonProps } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { TProduct } from "@jsdev_ninja/core";

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
			onChange={(amount, type) => {
				if (type === "decrease") return appApi.user.removeItemFromCart({ product });
				if (type === "increase") return appApi.user.addItemToCart({ product });
				if (type === "update") return appApi.user.updateCartItemAmount({ product, amount });
			}}
			product={product}
			{...props}
		/>
	);
}

type InputButtonProps = Omit<ButtonProps, "value" | "onChange"> & {
	value: number;
	onChange: (value: number, type: "increase" | "decrease" | "update") => void;
	product?: TProduct;
};
export function InputButton(props: InputButtonProps) {
	const { onChange, value, size = "md", product, ...rest } = props;

	// Map size prop to height class
	const sizeToHeight = {
		sm: "h-8",
		md: "h-10",
		lg: "h-12",
	};
	const heightClass = sizeToHeight[size] || "h-10";

	// Check if product is kg type and should allow decimal input
	const isKgProduct = product?.priceType?.type === "kg";

	if (isKgProduct) {
		return (
			<ButtonGroup size={size} color="primary" className="mx-auto w-full">
				<Button
					className="rounded-none rounded-s-lg"
					onPress={() => {
						const newAmount = Math.max(0, value - 0.5);
						onChange(newAmount, "update");
					}}
					isIconOnly
					{...rest}
				>
					-
				</Button>
				<input
					type="number"
					step="0.1"
					min="0"
					value={value}
					onClick={(e) => e.stopPropagation()}
					onChange={(e) => {
						const newAmount = parseFloat(e.target.value) || 0;
						onChange(newAmount, "update");
					}}
					className={`flex-1 text-center border-none outline-none bg-primary text-primary-foreground m-0 p-0 align-middle ${heightClass}`}
					style={{ minWidth: "60px" }}
				/>
				<Button
					className="rounded-none rounded-e-lg"
					onPress={() => {
						const newAmount = value + 0.5;
						onChange(newAmount, "update");
					}}
					isIconOnly
					{...rest}
				>
					+
				</Button>
			</ButtonGroup>
		);
	}

	return (
		<ButtonGroup size={size} color="primary" className="mx-auto w-full">
			<Button
				className="rounded-none rounded-s-lg"
				onPress={() => onChange(value - 1, "decrease")}
				isIconOnly
				{...rest}
			>
				-
			</Button>
			<Button fullWidth disableRipple disableAnimation disabled>
				{value}
			</Button>
			<Button
				className=" rounded-none rounded-e-lg"
				onPress={() => onChange(value + 1, "increase")}
				isIconOnly
				{...rest}
			>
				+
			</Button>
		</ButtonGroup>
	);
}
