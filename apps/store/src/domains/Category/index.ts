import { z } from "zod";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { FirebaseApi } from "src/lib/firebase";
import { BaseCategorySchema, CategorySchema, FirebaseAPI, TCategory } from "@jsdev_ninja/core";

// export type TCategory = z.infer<typeof CategorySchema>;

export const TFlattenCategorySchema = BaseCategorySchema.extend({
	index: z.number(),
	collapsed: z.boolean().optional(),
	children: z.array(CategorySchema),
});

export type TFlattenCategory = z.infer<typeof TFlattenCategorySchema>;

export type TNewCategory = Omit<TCategory, "id">;

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
	list(storeId: string, companyId: string) {
		return FirebaseApi.firestore
			.get(
				storeId,
				FirebaseAPI.firestore.getPath({
					storeId,
					companyId,
					collectionName: "categories",
				})
			)
			.then((res) => {
				console.log("AAAAA", res);

				return (res.data as any)?.categories ?? [];
			})
			.catch((er) => {
				console.log("er", er.message);
			});
	},
	subscribe(storeId: string, callback: any) {
		return FirebaseApi.firestore.subscribeDoc("categories", storeId, callback);
	},
};
