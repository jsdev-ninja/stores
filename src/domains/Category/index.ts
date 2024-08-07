import { z } from "zod";
import { LocaleSchema } from "src/shared/types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { FirebaseApi } from "src/lib/firebase";

export const BaseCategorySchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	parentId: z.string().nullish(),
	tag: z.string().min(1),
	locales: z.array(LocaleSchema),
});

type Category = z.infer<typeof BaseCategorySchema> & {
	children: Category[];
};

export const CategorySchema: z.ZodType<Category> = BaseCategorySchema.extend({
	children: z.lazy(() => CategorySchema.array()),
});

// export type TCategory = z.infer<typeof CategorySchema>;
export type TCategory = z.infer<typeof BaseCategorySchema> & {
	children: TCategory[];
};
export const TFlattenCategory = BaseCategorySchema.extend({
	index: z.number(),
	depth: z.number(),
	collapsed: z.boolean().optional(),
});

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
	list() {
		return FirebaseApi.firestore
			.get("dhXXgvpn1wyTfqxoQfr0", FirebaseApi.firestore.collections.categories)
			.then((res) => {
				console.log("res", (res.data as any).categories);
				return (res.data as any).categories;
			});
	},
	subscribe(storeId: string, callback: any) {
		return FirebaseApi.firestore.subscribeDoc("categories", storeId, callback);
	},
};
