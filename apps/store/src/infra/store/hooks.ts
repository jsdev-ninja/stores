import { cartSlice } from "src/domains/cart";
import { useAppDispatch, useAppSelector } from "./store";
import { CategorySlice } from "src/domains/Category";
import { userSlice } from "src/domains/user";
import { useMemo } from "react";
import { uiSlice } from "src/domains/ui";
import { CompanySlice } from "src/domains/Company";
import { StoreSlice } from "src/domains/Store";
import { profileSlice } from "src/domains/profile";
import { favoriteProductsSlice } from "src/domains/favoriteProducts";

const actions = {
	cart: cartSlice.actions,
	category: CategorySlice.actions,
	company: CompanySlice.actions,
	store: StoreSlice.actions,
	user: userSlice.actions,
	ui: uiSlice.actions,
	profile: profileSlice.actions,
	favoriteProducts: favoriteProductsSlice.actions,
};
export const useStoreActions = () => {
	const dispatch = useAppDispatch();

	const result = useMemo(() => {
		return {
			...actions,
			dispatch,
		};
	}, [dispatch]);

	return result;
};
