import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { TProduct } from "../product";
import { CONFIG } from "src/config";
import { useAppSelector } from "src/infra";
import { TCart } from "./types";

const initialState: { cart: TCart | null } = {
	cart: null,
};

export const cartSlice = createSlice({
	name: "cart",
	initialState: initialState,
	reducers: {
		setCart: (state, action: PayloadAction<TCart | null>) => {
			state.cart = action.payload;
		},
		addItem: (state, action: PayloadAction<TProduct>) => {
			if (!state.cart) return;
			const product = action.payload;
			const productIndex = state.cart.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (productInCart) {
				state.cart.items[productIndex].amount += 1;
				return;
			}
			state.cart.items.push({
				amount: 1,
				product,
			});
		},
		removeItem: (state, action) => {
			if (!state.cart) return;

			const product = action.payload;
			const productIndex = state.cart.items.findIndex(
				(cartItem) => cartItem.product.id === product.id
			);
			const productInCart = productIndex !== -1;
			if (!productInCart) return;

			if (state.cart.items[productIndex].amount > 1) {
				state.cart.items[productIndex].amount -= 1;
				return;
			}
			state.cart.items.splice(productIndex, 1);
		},
		clear: (state) => {
			if (!state.cart) return;

			state.cart.items = [];
		},
	},
	selectors: {
		selectCart: (state) => {
			return state.cart?.items;
		},
		selectProduct: (state, productId?: string) => {
			return state.cart?.items?.find((item) => item.product.id === productId);
		},
		selectCost: (state) => {
			if (!state.cart?.items)
				return {
					discount: 0,
					cost: 0,
					finalCost: 0,
					vat: 0,
				};
			return state.cart?.items.reduce(
				(acc, item) => {
					const { product, amount } = item;
					const productPrice = getPriceAfterDiscount(product);
					const discount = calculateDiscount(product);
					console.log("product", product.vat);

					let productVatValue: number = 0;
					if (product.vat) {
						productVatValue = (product.price * CONFIG.VAT) / 100;
						productVatValue = productVatValue * amount;
						console.log("productVatValue", productVatValue);
						acc.vat += +productVatValue.toFixed(2);
					}
					acc.cost += amount * product.price;
					acc.discount += discount ? amount * discount : discount;
					acc.finalCost += amount * productPrice + productVatValue;

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

export const useCart = () => useAppSelector((state) => state.cart.cart);

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
