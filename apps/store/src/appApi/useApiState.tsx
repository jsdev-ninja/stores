import { useCompany } from "src/domains/Company";
import { useStore } from "src/domains/Store";
import { useAppSelector } from "src/infra";

export const useApiState = () => {
	const appReady = useAppSelector((state) => state.ui.appReady);
	const company = useCompany();
	const store = useStore();
	const user = useAppSelector((state) => state.user.user);
	const cart = useAppSelector((state) => state.cart.currentCart);

	return { cart, appReady, company, store, user };
};
