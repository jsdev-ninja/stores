import { FirebaseApi } from "src/lib/firebase";

export const CartService = {
	updateCart(id: string, item: any) {
		FirebaseApi.firestore.set(`cart/${id}`, item);
	},
};
