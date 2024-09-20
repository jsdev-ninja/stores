import { createSlice } from "@reduxjs/toolkit";

export const uiSlice = createSlice({
	name: "ui",
	initialState: {
		appReady: false,
	},
	reducers: {
		setAppReady(state, action) {
			state.appReady = action.payload;
		},
	},
});
