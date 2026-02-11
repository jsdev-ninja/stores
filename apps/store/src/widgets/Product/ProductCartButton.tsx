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

	// Desktop: original heights only. Small screen: touch-friendly mins via max-md:
	const sizeToHeight = {
		sm: "h-8",
		md: "h-10",
		lg: "h-12",
	};
	const heightClass = sizeToHeight[size] || sizeToHeight.md;

	const isKgProduct = product?.priceType?.type === "kg";

	// Desktop unchanged. Small screen only: touch-friendly min height
	const groupClass =
		"mx-auto w-full rounded-lg overflow-hidden max-md:min-h-11 max-md:touch-manipulation";
	const btnClass = "rounded-none rounded-s-lg shrink-0 max-md:min-w-11 max-md:min-h-11";
	const btnClassEnd = "rounded-none rounded-e-lg shrink-0 max-md:min-w-11 max-md:min-h-11";

	if (isKgProduct) {
		return (
			<ButtonGroup size={size} color="primary" className={groupClass}>
				<Button
					className={btnClass}
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
					className={`flex-1 text-center border-none outline-none bg-primary text-primary-foreground m-0 px-1 align-middle min-w-[60px] max-md:min-w-0 max-md:w-14 max-md:text-sm ${heightClass}`}
				/>
				<Button
					className={btnClassEnd}
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
		<ButtonGroup size={size} color="primary" className={groupClass}>
			<Button
				className={btnClass}
				onPress={() => onChange(value - 1, "decrease")}
				isIconOnly
				{...rest}
			>
				-
			</Button>
			<Button
				fullWidth
				disableRipple
				disableAnimation
				disabled
				className={`min-w-8 flex-1 tabular-nums max-md:text-sm ${heightClass}`}
			>
				{value}
			</Button>
			<Button
				className={btnClassEnd}
				onPress={() => onChange(value + 1, "increase")}
				isIconOnly
				{...rest}
			>
				+
			</Button>
		</ButtonGroup>
	);
}
