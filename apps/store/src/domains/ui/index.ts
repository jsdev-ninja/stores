import { createSlice } from "@reduxjs/toolkit";

export const uiSlice = createSlice({
	name: "ui",
	initialState: {
		appReady: false,
		isCartDrawerOpen: false,
	},
	reducers: {
		setAppReady(state, action) {
			state.appReady = action.payload;
		},
		openCartDrawer(state) {
			state.isCartDrawerOpen = true;
		},
		closeCartDrawer(state) {
			state.isCartDrawerOpen = false;
		},
	},
});
