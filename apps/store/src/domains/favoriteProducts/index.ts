import { TFavoriteProduct } from "@jsdev_ninja/core";
import { createSlice } from "@reduxjs/toolkit";
import { useAppSelector } from "src/infra";

const initialState: { data: TFavoriteProduct[] } = {
	data: [],
};

export const favoriteProductsSlice = createSlice({
	name: "favoriteProducts",
	initialState,
	reducers: {
		setFavoriteProducts(state, action) {
			state.data = action.payload;
		},
	},
});

export const useFavoriteProducts = () => useAppSelector((state) => state.favoriteProducts.data);
