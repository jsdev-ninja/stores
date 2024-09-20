import { TProduct } from "src/domains";
import { FirebaseApi } from "src/lib/firebase";
import { SentryApi } from "src/lib/sentry";

export async function productDelete({ product }: { product: TProduct }) {
	try {
		return await FirebaseApi.firestore.remove({
			id: product.id,
			collectionName: "products",
		});
	} catch (error) {
		SentryApi.captureException(error);
	}
}
