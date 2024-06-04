import { createSlice } from "@reduxjs/toolkit";

import { z } from "zod";

const StoreSchema = z.object({
	id: z.string(),
	companyId: z.string(),
	websiteDomain: z.string(),
	logoUrl: z.string(),
});

export type TStore = z.infer<typeof StoreSchema>;

// todo: make sure load company safe!!!
const initialState: { data: TStore | null } = {
	data: {
		id: "dhXXgvpn1wyTfqxoQfr0",
		companyId: "HpxoL3sSMqNmo3rAzGVk",
		logoUrl: "",
		websiteDomain: "",
	},
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
