import { FirebaseApi } from "src/lib/firebase";
import { SentryApi } from "src/lib/sentry";

export async function uploadLogo({ storeId, logo }: { storeId: string; logo: File }) {
	try {
		const path = `logo/${storeId}`;
		const fileRef = await FirebaseApi.storage.upload(path, logo);
		const newLogo = { id: path, url: fileRef.url };
		await FirebaseApi.firestore.update(
			storeId,
			{
				logoUrl: newLogo.url,
			},
			"stores"
		);
		return { success: true, data: newLogo };
	} catch (error) {
		SentryApi.captureException(error);
		return { success: false };
	}
}
