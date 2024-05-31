import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { TProduct } from "..";

type TCart = {
	items: Array<{ product: TProduct; amount: number }>;
};

const initialState: TCart = {
	items: [],
};

export const cartSlice = createSlice({
	name: "cart",
	initialState: initialState,
	reducers: {
		addItem: (state, action: PayloadAction<TProduct>) => {
			const product = action.payload;
			const productIndex = state.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (productInCart) {
				state.items[productIndex].amount += 1;
				return;
			}
			state.items.push({
				amount: 1,
				product,
			});
		},
		removeItem: (state, action) => {
			const product = action.payload;
			const productIndex = state.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (!productInCart) return;

			if (state.items[productIndex].amount > 1) {
				state.items[productIndex].amount -= 1;
				return;
			}
			state.items.splice(productIndex, 1);
		},
		clear: (state) => {
			state.items = [];
		},
	},
	selectors: {
		selectCart: (state) => {
			return state.items;
		},
		selectProduct: (state, productId?: string) => {
			return state.items.find((item) => item.product.id === productId);
		},
		selectCost: (state) => {
			return state.items.reduce(
				(acc, item) => {
					const { product, amount } = item;
					const productPrice = getPriceAfterDiscount(product);
					const discount = calculateDiscount(product);

					acc.cost += amount * product.price;
					acc.discount += discount ? amount * discount : discount;
					acc.finalCost += amount * productPrice;

					return acc;
				},
				{
					discount: 0,
					cost: 0,
					finalCost: 0,
				}
			);
		},
	},
});

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
