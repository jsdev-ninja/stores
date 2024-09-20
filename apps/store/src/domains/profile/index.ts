import { createSlice } from "@reduxjs/toolkit";
import { useAppSelector } from "src/infra";
import { TProfile } from "src/types";

const initialState: { data: TProfile | null } = {
	data: null,
};

export const profileSlice = createSlice({
	name: "profile",
	initialState,
	reducers: {
		setProfile(state, action) {
			state.data = action.payload;
		},
	},
});

export const useProfile = () => useAppSelector((state) => state.profile.data);
