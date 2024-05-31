import { authSlice } from "src/domains/auth";
import { modalsSlice } from "../modals";
import { cartSlice } from "src/domains/cart";

export const reducer = {
	auth: authSlice.reducer,
	modals: modalsSlice.reducer,
	cart: cartSlice.reducer,
};
