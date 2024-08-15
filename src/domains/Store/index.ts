import { createSlice } from "@reduxjs/toolkit";

import { z } from "zod";

const StoreSchema = z.object({
	id: z.string(),
	companyId: z.string(),
	urls: z.array(z.string()),
	logoUrl: z.string(),
	tenantId: z.string(), // firebase auth tenantId
});

export type TStore = z.infer<typeof StoreSchema>;

// todo: make sure load company safe!!!
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
