import { TOrganization } from "@jsdev_ninja/core";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: { organization: TOrganization | null } = {
	organization: null,
};

export const UserOrganizationSlice = createSlice({
	name: "userOrganization",
	initialState,
	reducers: {
		setOrganization(state, action: PayloadAction<TOrganization | null>) {
			state.organization = action.payload;
		},
	},
});
