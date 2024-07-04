import { cartSlice } from "src/domains/cart";
import { useAppDispatch, useAppSelector } from "./store";
import { CategorySlice } from "src/domains/Category";
import { userSlice } from "src/domains/user";
import { useMemo } from "react";
import { uiSlice } from "src/domains/ui";
import { CompanySlice } from "src/domains/Company";
import { StoreSlice } from "src/domains/Store";

const actions = {
	cart: cartSlice.actions,
	category: CategorySlice.actions,
	company: CompanySlice.actions,
	store: StoreSlice.actions,
	user: userSlice.actions,
	ui: uiSlice.actions,
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

export const useFullID = () => {
	const company = useAppSelector((state) => state.company);
	const store = useAppSelector((state) => state.store);
	const user = useAppSelector((state) => state.user);

	if (!company.data?.id || !store.data?.id || !user.user?.uid) return "";

	return `${company.data?.id}_${store.data?.id}_${user.user?.uid}`;
};
