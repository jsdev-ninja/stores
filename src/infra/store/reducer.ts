import { authSlice } from "src/domains/auth";
import { modalsSlice } from "../modals";
import { cartSlice } from "src/domains/cart";
import { CompanySlice } from "src/domains/Company";
import { StoreSlice } from "src/domains/Store";

export const reducer = {
	[CompanySlice.name]: CompanySlice.reducer,
	[StoreSlice.name]: StoreSlice.reducer,
	auth: authSlice.reducer,
	modals: modalsSlice.reducer,
	cart: cartSlice.reducer,
};
