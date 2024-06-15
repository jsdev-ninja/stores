import { FirebaseApi } from "src/lib/firebase";

export const CartService = {
	updateCart(id, item) {
		FirebaseApi.firestore.set(`cart/${id}`, item);
	},
};
