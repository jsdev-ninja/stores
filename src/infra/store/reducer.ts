import { authSlice } from "src/domains/auth";
import { modalsSlice } from "../modals";
import { cartSlice } from "src/domains/cart";
import { CompanySlice } from "src/domains/Company";
import { StoreSlice } from "src/domains/Store";
import { CategorySlice } from "src/domains/Category";

export const reducer = {
	[CompanySlice.name]: CompanySlice.reducer,
	[StoreSlice.name]: StoreSlice.reducer,
	[CategorySlice.name]: CategorySlice.reducer,
	auth: authSlice.reducer,
	cart: cartSlice.reducer,
	modals: modalsSlice.reducer,
};
