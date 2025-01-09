import { TProduct } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";

export const ProductService = {
	get(id: string) {
		return FirebaseApi.firestore.get<TProduct>(id, "products");
	},
};
