import { Button } from "src/components/button";
import { useProduct } from "./useProduct";
import { useAppSelector } from "src/infra/store";
import { TCart, cartSlice, useCart } from "src/domains/cart";
import { CartService } from "src/domains/cart/CartService";
import { ProductSchema } from "src/domains";
import { mixPanelApi } from "src/lib/mixpanel";
import { useStore } from "src/domains/Store";
import { FirebaseApi } from "src/lib/firebase";
import classNames from "classnames";

type Props = {
	size: "sm" | "md";
};

export function ProductCartButton(props: Props) {
	const { size } = props;

	const cartItems = useAppSelector(cartSlice.selectors.selectCart) ?? [];

	const { product } = useProduct();

	const user = useAppSelector((state) => state.user.user);

	const cart = useCart();

	const store = useStore();

	const cartId = cart?.id ?? FirebaseApi.firestore.generateDocId("cart");

	const actualCart: Omit<TCart, "id"> = cart ?? {
		companyId: store?.companyId ?? "",
		items: [],
		storeId: store?.id ?? "",
		userId: user?.uid ?? "",
		type: "Cart",
		status: "active",
	};

	const cartProduct = useAppSelector((state) =>
		cartSlice.selectors.selectProduct(state, product?.id)
	);

	function addItem() {
		if (!product || !user || !store) return;

		const result = ProductSchema.safeParse(product);

		if (!result.success) {
			console.log(result.error.errors);

			return null; // todo
		}

		const _product = result.data;

		const productIndex = (cartItems ?? []).findIndex(
			(cartItem) => cartItem.product.id === product?.id
		);
		const productInCart = productIndex !== -1;
		if (productInCart) {
			const items = structuredClone(cartItems ?? []);
			items[productIndex].amount += 1;
			CartService.updateCart(cartId, {
				...actualCart,
				items,
			});

			return;
		}

		const items = [
			...cartItems,
			{
				amount: 1,
				product: _product,
			},
		];

		CartService.updateCart(cartId, {
			...actualCart,
			items,
		});
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
			CartService.updateCart(cartId, {
				...actualCart,
				items,
			});

			return;
		}
		items.splice(productIndex, 1);

		CartService.updateCart(cartId, {
			...actualCart,
			items,
		});
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
