import * as functions from "firebase-functions/v1";
import { customersModule } from "../modules/customers";

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
	console.info("user deleted", user.uid, user.displayName, user.email);
	try {
		await customersModule.onAuthUserDeleted({ uid: user.uid });
		console.log("User document deleted in Firestore");
	} catch (err) {
		console.error("Error deleting user document in Firestore", err);
	}
});
