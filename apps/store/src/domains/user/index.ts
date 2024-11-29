import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { useAppSelector } from "src/infra";
import { TUser } from "src/types";

const initialState: { user: TUser | null } = {
	user: null,
};
export const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setUser(state, action: PayloadAction<TUser | null>) {
			state.user = action.payload ? Object.assign({}, action.payload) : null;
		},
	},
	selectors: {
		selectUser: (state) => state.user,
	},
});

export const useUser = () => useAppSelector(userSlice.selectors.selectUser);
