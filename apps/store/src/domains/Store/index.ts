import { TStore } from "@jsdev_ninja/core";
import { createSlice } from "@reduxjs/toolkit";

const initialState: { data: TStore | null } = {
	data: null,
};

export const StoreSlice = createSlice({
	name: "store",
	initialState,
	reducers: {
		setStore(state, action) {
			state.data = action.payload;
		},
	},
	selectors: {
		selectStore: (state) => state.data,
	},
});

export * from "./selectors";
