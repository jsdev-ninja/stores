import { authSlice } from "src/domains/Auth";
import { modalsSlice } from "../modals";
import { cartSlice } from "src/domains/Cart";

export const reducer = {
	auth: authSlice.reducer,
	modals: modalsSlice.reducer,
	cart: cartSlice.reducer,
};
