import { modalsSlice } from "../modals";
import { cartSlice } from "src/domains/cart";
import { CompanySlice } from "src/domains/Company";
import { StoreSlice } from "src/domains/Store";
import { CategorySlice } from "src/domains/Category";
import { userSlice } from "src/domains/user";
import { uiSlice } from "src/domains/ui";
import { profileSlice } from "src/domains/profile";
import { favoriteProductsSlice } from "src/domains/favoriteProducts";
import { ordersSlice } from "src/domains/Order";
import { DiscountsSlice } from "src/domains/Discounts/Discounts";
import { OrganizationSlice } from "src/domains/Organization";

export const reducer = {
	[uiSlice.name]: uiSlice.reducer,
	[userSlice.name]: userSlice.reducer,
	[profileSlice.name]: profileSlice.reducer,
	[CompanySlice.name]: CompanySlice.reducer,
	[StoreSlice.name]: StoreSlice.reducer,
	[CategorySlice.name]: CategorySlice.reducer,
	[favoriteProductsSlice.name]: favoriteProductsSlice.reducer,
	cart: cartSlice.reducer,
	modals: modalsSlice.reducer,
	[ordersSlice.name]: ordersSlice.reducer,
	[DiscountsSlice.name]: DiscountsSlice.reducer,
	[OrganizationSlice.name]: OrganizationSlice.reducer,
};
