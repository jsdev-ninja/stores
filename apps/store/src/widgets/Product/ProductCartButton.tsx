import { Button } from "src/components/button";
import { useProduct } from "./useProduct";
import { useAppSelector } from "src/infra/store";
import { cartSlice } from "src/domains/cart";
import { useAppApi } from "src/appApi";
import { ButtonProps } from "@heroui/react";
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
				variant="primary"
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
			{...props}
		/>
	);
}

type InputButtonProps = Omit<ButtonProps, "value" | "onChange"> & {
	value: number;
	onChange: (value: number, type: "increase" | "decrease" | "update") => void;
};

/**
 * Quantity stepper. Plain flex bar (NOT HeroUI ButtonGroup — that injects an
 * internal `__button_group_child` prop that breaks non-button children). The
 * `-` / `+` are the same `primary` buttons as the add-to-cart button; the qty
 * in the middle is a solid (non-faded) segment in the same accent color. The
 * group's `rounded-md overflow-hidden` gives one clean outer radius.
 *
 * `stopPropagation` on the qty/input keeps a tap on it from bubbling to the
 * product card's navigate-to-product click.
 */
export function InputButton(props: InputButtonProps) {
	const { onChange, value, size = "md", ...rest } = props;

	// Quantities are whole numbers on the storefront — including weight products
	// (e.g. a customer orders 5 kg). The exact weight (e.g. 4.9 kg) is corrected
	// later in the admin order-edit screen, not by the customer here.
	const groupClass = "flex w-full items-stretch rounded-md overflow-hidden max-md:touch-manipulation";
	const edgeBtn = "rounded-none shrink-0 max-md:min-w-11 max-md:min-h-11";
	const valueClass =
		"flex-1 min-w-8 grid place-items-center tabular-nums text-sm font-semibold select-none";
	const valueStyle = { background: "var(--accent)", color: "var(--accent-foreground)" } as const;

	return (
		<div className={groupClass}>
			<Button
				variant="primary"
				size={size}
				className={edgeBtn}
				onPress={() => onChange(value - 1, "decrease")}
				isIconOnly
				{...rest}
			>
				-
			</Button>
			<div className={valueClass} style={valueStyle} onClick={(e) => e.stopPropagation()}>
				{value}
			</div>
			<Button
				variant="primary"
				size={size}
				className={edgeBtn}
				onPress={() => onChange(value + 1, "increase")}
				isIconOnly
				{...rest}
			>
				+
			</Button>
		</div>
	);
}
