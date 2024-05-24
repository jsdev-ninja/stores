import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "firebase/auth";

// Define a type for the slice state
interface AuthState {
	user: User | null;
}

// Define the initial state using that type
const initialState: AuthState = {
	user: null,
};

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {},
	selectors: {
		setUser(state, action: PayloadAction<User | null>) {
			state.user = action.payload;
		},
	},
});
