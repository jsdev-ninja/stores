import { cartSlice } from "src/domains/cart";
import { useAppSelector } from "src/infra/store";
import { Product, getProductFinalPrice } from "../Product";

import EmptyCartImg from ".././../assets/empty-cart.svg";
import classNames from "classnames";
import { Icon } from "src/components";
import { useTranslation } from "react-i18next";
import { TProduct } from "@jsdev_ninja/core";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { useStore } from "src/domains/Store";

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
				<div className="p-4  text-3xl font-bold">{t("cart:shoppingCart")}</div>
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
				<div className="flex flex-col gap-4 grow overflow-y-auto">
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

	const store = useStore();

	if (!store) return null;

	const totalPrice = Number((getProductFinalPrice(product, store) * amount).toFixed(2));

	return (
		<Product product={product}>
			<div className="flex flex-col shadow py-2 justify-start">
				<div className="flex my-2 gap-2">
					<div className="w-16 h-16">
						<Product.Image />
					</div>
					<div
						className={classNames("flex-grow", {
							"w-24": size === "sm",
						})}
					>
						<Product.Name size="sm" />
						<div className="flex gap-1">
							<Product.Price />
							<div className="flex items-center gap-2">
								<span>X</span>
								<span>{amount}</span>
								<span>{totalPrice}</span>
							</div>
						</div>
					</div>
				</div>
				<div className="flex flex-col">
					<div className="flex items-center gap-4">
						<Product.Weight />
						<Product.CartButton size="sm" />
					</div>
				</div>
			</div>
		</Product>
	);
}
