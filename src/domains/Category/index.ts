import { z } from "zod";
import { LocaleSchema } from "src/shared/types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { FirebaseApi } from "src/lib/firebase";

export const CategorySchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	parentId: z.string().min(1),
	tag: z.string().min(1),
	locales: z.array(LocaleSchema),
});

export type TCategory = z.infer<typeof CategorySchema>;

//  STORE
type TCategoryState = {
	categories: Array<TCategory>;
};

const initialState: TCategoryState = {
	categories: [],
};

export const CategorySlice = createSlice({
	name: "category",
	initialState,
	reducers: {
		setCategories(state, action: PayloadAction<Array<TCategory>>) {
			state.categories = action.payload;
		},
	},
	selectors: {
		selectCategories: (state) => state.categories,

		selectsSubCategories: (state, parentId: TCategory["id"]) =>
			state.categories.filter((c) => c.parentId === parentId),
	},
});

export const CategoryService = {
	list() {
		return FirebaseApi.firestore.list(FirebaseApi.firestore.collections.categories);
	},
};
