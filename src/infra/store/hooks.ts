import { cartSlice } from "src/domains/cart";
import { useAppDispatch } from "./store";
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
