import { cartSlice } from "src/domains/cart";
import { useAppDispatch } from "./store";
import { CategorySlice } from "src/domains/Category";
import { userSlice } from "src/domains/user";
import { useMemo } from "react";
import { uiSlice } from "src/domains/ui";
import { CompanySlice } from "src/domains/Company";
import { StoreSlice } from "src/domains/Store";
import { profileSlice } from "src/domains/profile";
import { favoriteProductsSlice } from "src/domains/favoriteProducts";
import { ordersSlice } from "src/domains/Order";
import { DiscountsSlice } from "src/domains/Discounts/Discounts";

const actions = {
	cart: cartSlice.actions,
	category: CategorySlice.actions,
	company: CompanySlice.actions,
	store: StoreSlice.actions,
	user: userSlice.actions,
	ui: uiSlice.actions,
	profile: profileSlice.actions,
	favoriteProducts: favoriteProductsSlice.actions,
	orders: ordersSlice.actions,
	discounts: DiscountsSlice.actions,
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
