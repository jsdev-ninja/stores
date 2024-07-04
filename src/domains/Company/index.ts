import { createSlice } from "@reduxjs/toolkit";

import { z } from "zod";

export const CompanySchema = z.object({
	id: z.string(),
	name: z.string(),
	websiteDomains: z.array(z.string()),
	owner: z.object({}),
});

export type TCompany = z.infer<typeof CompanySchema>;

// todo: make sure load company safe!!!
const initialState: { data: TCompany | null } = {
	data: null,
};

export const CompanySlice = createSlice({
	name: "company",
	initialState,
	reducers: {
		setCompany(state, action) {
			state.data = action.payload;
		},
	},
	selectors: {
		selectCompany: (state) => state.data,
	},
});

export * from "./selectors";
