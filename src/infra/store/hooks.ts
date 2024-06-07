import { cartSlice } from "src/domains/cart";
import { useAppDispatch } from "./store";
import { CategorySlice } from "src/domains/Category";

const actions = {
	cart: cartSlice.actions,
	category: CategorySlice.actions,
};
export const useStoreActions = () => {
	const dispatch = useAppDispatch();

	return {
		...actions,
		dispatch,
	};
};
