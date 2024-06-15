import { cartSlice } from "src/domains/cart";
import { useAppDispatch, useAppSelector } from "./store";
import { CategorySlice } from "src/domains/Category";
import { userSlice } from "src/domains/user";

const actions = {
	cart: cartSlice.actions,
	category: CategorySlice.actions,
	user: userSlice.actions,
};
export const useStoreActions = () => {
	const dispatch = useAppDispatch();

	return {
		...actions,
		dispatch,
	};
};

export const useFullID = () => {
	const company = useAppSelector((state) => state.company);
	const store = useAppSelector((state) => state.store);
	const user = useAppSelector((state) => state.user);

	if (!company.data?.id || !store.data?.id || !user.user?.uid) return "";

	return `${company.data?.id}_${store.data?.id}_${user.user?.uid}`;
};
