import { TDiscount } from "@jsdev_ninja/core";
import { createSlice } from "@reduxjs/toolkit";
import { useAppSelector } from "src/infra";

const initialState: { discounts: TDiscount[] } = {
	discounts: [],
};

export const DiscountsSlice = createSlice({
	name: "discounts",
	initialState: initialState,
	reducers: {
		setDiscounts: (state, action) => {
			state.discounts = action.payload;
		},
	},
});

export const useDiscounts = () => useAppSelector((state) => state.discounts.discounts);
