import { FirebaseApi } from "src/lib/firebase";

export const ProductApi = {
	get(id: string) {
		return FirebaseApi.firestore.get(id, "products");
	},
};
