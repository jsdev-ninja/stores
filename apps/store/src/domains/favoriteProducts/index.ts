import { createSlice } from "@reduxjs/toolkit";
import { useAppSelector } from "src/infra";

const initialState: { data: any | null } = {
	data: null,
};

export const favoriteProductsSlice = createSlice({
	name: "favoriteProducts",
	initialState,
	reducers: {
		setProfile(state, action) {
			state.data = action.payload;
		},
	},
});

export const useFavoriteProducts = () => useAppSelector((state) => state.profile.data);
