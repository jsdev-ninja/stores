import { cartSlice } from "src/domains/cart";
import { useAppSelector } from "src/infra/store";
import { Product, getProductFinalPrice } from "../Product";

import EmptyCartImg from ".././../assets/empty-cart.svg";
import classNames from "classnames";
import { Icon } from "src/components";
import { useTranslation } from "react-i18next";
import { TProduct } from "@jsdev_ninja/core";
import { EmptyState } from "src/components/EmptyState/EmptyState";

export function Badge({ children }: any) {
	return (
		<div className="relative inline-flex">
			{children}
			<div className="absolute -top-2 -right-2 size-4 rounded-full bg-red-400"></div>
		</div>
	);
}

export function Cart({ size = "sm" }: { size?: "sm" | "lg" }) {
	const cart = useAppSelector(cartSlice.selectors.selectCart);

	const { t } = useTranslation(["cart", "common"]);

	const isEmpty = !cart?.length;

	return (
		<div data-name="Cart" className="flex flex-col h-full p-4 shadow">
			<div className="flex items-center justify-between">
				<Icon name="cart" size="lg" />
				<div className="p-4 text-3xl font-bold">{t("cart:shoppingCart")}</div>
			</div>

			{isEmpty && (
				<div className="w-full h-full flex justify-center items-center">
					<EmptyState
						size="md"
						title={t("cart:emptyState.title")}
						img={EmptyCartImg}
						description={t("cart:emptyState.description")}
					/>
				</div>
			)}

			{!isEmpty && (
				<div className="flex flex-col gap-4 flex-grow overflow-y-auto">
					{cart?.map((cartItem) => (
						<CartItem size={size} key={cartItem.product.id} cartItem={cartItem} />
					))}
				</div>
			)}
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

	const totalPrice = Number((getProductFinalPrice(product) * amount).toFixed(2));

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
