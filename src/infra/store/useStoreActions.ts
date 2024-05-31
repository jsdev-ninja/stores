import { cartSlice } from "src/domains/cart";
import { useAppDispatch } from ".";

const actions = {
	cart: cartSlice.actions,
};
export const useStoreActions = () => {
	const dispatch = useAppDispatch();

	return {
		...actions,
		dispatch,
	};
};
