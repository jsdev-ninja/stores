import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";
import { CONFIG } from "src/config";
import { useAppSelector } from "src/infra";
import { TCart } from "./types";
import { TProduct } from "@jsdev_ninja/core";

const initialState: { currentCart: TCart | null; carts: TCart[]; isReady: boolean } = {
	currentCart: null,
	carts: [],
	isReady: false,
};

export const cartSlice = createSlice({
	name: "cart",
	initialState: initialState,
	reducers: {
		setCart: (state, action: PayloadAction<{ cart: TCart | null; isReady?: boolean }>) => {
			state.currentCart = action.payload.cart;
			state.isReady = action.payload.isReady ?? false;
		},
		addItem: (state, action: PayloadAction<TProduct>) => {
			if (!state.currentCart) return;
			const product = action.payload;
			const productIndex = state.currentCart.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (productInCart) {
				state.currentCart.items[productIndex].amount += 1;
				return;
			}
			state.currentCart.items.push({
				amount: 1,
				product,
			});
		},
		removeItem: (state, action) => {
			if (!state.currentCart) return;

			const product = action.payload;
			const productIndex = state.currentCart.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (!productInCart) return;

			if (state.currentCart.items[productIndex].amount > 1) {
				state.currentCart.items[productIndex].amount -= 1;
				return;
			}
			state.currentCart.items.splice(productIndex, 1);
		},
		updateItemAmount: (state, action: PayloadAction<{ product: TProduct; amount: number }>) => {
			if (!state.currentCart) return;

			const { product, amount } = action.payload;
			const productIndex = state.currentCart.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (!productInCart) return;

			if (amount <= 0) {
				// Remove item if amount is 0 or negative
				state.currentCart.items.splice(productIndex, 1);
			} else {
				// Update amount
				state.currentCart.items[productIndex].amount = amount;
			}
		},
		clear: (state) => {
			if (!state.currentCart) return;

			state.currentCart.items = [];
		},
	},
	selectors: {
		selectCart: (state) => {
			return state.currentCart?.items ?? [];
		},
		selectCurrentCart: (state) => {
			return state.currentCart;
		},
		selectProduct: (state, productId?: string) => {
			return state.currentCart?.items?.find((item) => item.product.id === productId);
		},
		selectProductInCart: (state, productId?: string) => {
			return !!state.currentCart?.items?.find((item) => item.product.id === productId);
		},
		selectCost: (state) => {
			if (!state.currentCart?.items)
				return {
					discount: 0,
					cost: 0,
					finalCost: 0,
					vat: 0,
				};
			return state.currentCart?.items.reduce(
				(acc, item) => {
					const { product, amount } = item;
					const productPrice = getPriceAfterDiscount(product);
					const discount = calculateDiscount(product);

					let productVatValue: number = 0;
					if (product.vat) {
						productVatValue = (product.price * CONFIG.VAT) / 100;
						productVatValue = productVatValue * amount;
						acc.vat += +productVatValue.toFixed(2);
					}
					acc.cost += amount * product.price;
					acc.discount += discount ? amount * discount : discount;
					acc.finalCost += amount * productPrice + productVatValue;

					// Round all values to 2 decimal places
					acc.cost = Number(acc.cost.toFixed(2));
					acc.discount = Number(acc.discount.toFixed(2));
					acc.finalCost = Number(acc.finalCost.toFixed(2));
					acc.vat = Number(acc.vat.toFixed(2));

					return acc;
				},
				{
					discount: 0,
					cost: 0,
					finalCost: 0,
					vat: 0,
				}
			);
		},
	},
});

export const useCart = () => useAppSelector((state) => state.cart.currentCart);
export const useCartCost = () =>
	useAppSelector(
		createSelector(cartSlice.selectors.selectCart, (items) => {
			if (!items?.length) {
				return {
					discount: 0,
					cost: 0,
					finalCost: 0,
					vat: 0,
				};
			}
			return items.reduce(
				(acc, item) => {
					const { product, amount } = item;
					const productPrice = getPriceAfterDiscount(product);
					const discount = calculateDiscount(product);

					let productVatValue: number = 0;
					if (product.vat) {
						productVatValue = (product.price * CONFIG.VAT) / 100;
						productVatValue = productVatValue * amount;

						acc.vat += +productVatValue.toFixed(2);
					}
					acc.cost += amount * product.price;
					acc.discount += discount ? amount * discount : discount;
					acc.finalCost += amount * productPrice + productVatValue;

					// Round all values to 2 decimal places
					acc.cost = Number(acc.cost.toFixed(2));
					acc.discount = Number(acc.discount.toFixed(2));
					acc.finalCost = Number(acc.finalCost.toFixed(2));
					acc.vat = Number(acc.vat.toFixed(2));

					return acc;
				},
				{
					discount: 0,
					cost: 0,
					finalCost: 0,
					vat: 0,
				}
			);
		})
	);

function calculateDiscount(product: TProduct) {
	if (product.discount?.type === "percent") {
		return (product.price * product.discount.value) / 100;
	}
	if (product.discount?.type === "number") {
		return product.price - product.discount.value;
	}
	return 0;
}

function getPriceAfterDiscount(product: TProduct) {
	if (product.discount?.type === "percent") {
		const dscountAmount = (product.price * product.discount.value) / 100;
		return product.price - dscountAmount;
	}
	if (product.discount?.type === "number") {
		const dscountAmount = product.price - product.discount.value;
		return dscountAmount;
	}
	return product.price;
}
