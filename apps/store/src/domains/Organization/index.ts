import { TOrganization } from "@jsdev_ninja/core";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: { organizations: TOrganization[] } = {
	organizations: [],
};

export const OrganizationSlice = createSlice({
	name: "organization",
	initialState,
	reducers: {
		setOrganizations(state, action: PayloadAction<TOrganization[]>) {
			state.organizations = action.payload;
		},
	},
});
