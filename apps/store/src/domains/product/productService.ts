import { FirebaseApi } from "src/lib/firebase";
import { TProduct } from ".";

export const ProductService = {
	get(id: string) {
		return FirebaseApi.firestore.get<TProduct>(id, "products");
	},
};
