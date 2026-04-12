import { TOrganization } from "@jsdev_ninja/core";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: { organizations: TOrganization[]; activeOrganization: TOrganization | null } = {
	organizations: [],
	activeOrganization: null,
};

export const UserOrganizationSlice = createSlice({
	name: "userOrganization",
	initialState,
	reducers: {
		setOrganizations(state, action: PayloadAction<TOrganization[]>) {
			state.organizations = action.payload;
		},
		setActiveOrganization(state, action: PayloadAction<TOrganization>) {
			state.activeOrganization = action.payload;
		},
		clearActiveOrganization(state) {
			state.activeOrganization = null;
		},
	},
});
