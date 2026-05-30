// allow admin create company user
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

export const createCompanyClient = functions.https.onCall(async (newCompany, context) => {
	const iAdmin = context.auth?.token.admin;
	const storeId = context.auth?.token.storeId;
	console.log("createCompanyClient", iAdmin, storeId);
	console.log("createCompanyClient new company", newCompany.storeId);

	if (!newCompany) {
		return { success: false };
	}

	// todo:
	// check if user is admin
	// check user storeId equal to client storeId and profile storeId

	const newUser = await admin.auth().createUser({
		email: newCompany.email,
		password: newCompany.password,
		emailVerified: true,
		displayName: newCompany.fullName ?? newCompany.email,
	});

	const { password, ...profileData } = newCompany;

	await admin.firestore().collection("profile").doc(newUser.uid).set(profileData);

	return { success: true, user: newUser, profile: profileData };
});
