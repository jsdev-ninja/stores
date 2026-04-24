import admin from "firebase-admin";

export const profileService = {
	async deleteProfile(uid: string): Promise<void> {
		// TODO(todo.md BUGS): root-level "profiles" is legacy. Should be tenant-scoped.
		await admin.firestore().collection("profiles").doc(uid).delete();
	},
};
