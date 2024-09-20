import { FirebaseApi } from "src/lib/firebase";

import type { TCart } from "./types";
export const CartService = {
	updateCart(id: string, cart: Omit<TCart, "id">) {
		FirebaseApi.firestore.set(`cart/${id}`, cart);
	},
};
