import { authSlice } from "src/domains/auth";
import { modalsSlice } from "../modals";

export const reducer = {
	auth: authSlice.reducer,
	modals: modalsSlice.reducer,
};
