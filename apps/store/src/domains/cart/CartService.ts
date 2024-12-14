import { FirebaseApi } from "src/lib/firebase";

import type { TCart } from "./types";
export const CartService = {
	async updateCart(id: string, cart: Partial<Omit<TCart, "id">>) {
		return await FirebaseApi.firestore.set(`cart/${id}`, cart);
	},
	async createCart(cart: Omit<TCart, "id">) {
		return await FirebaseApi.firestore.set(
			"cart/" + FirebaseApi.firestore.generateDocId("cart"),
			cart
		);
	},
};
