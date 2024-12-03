import { FirebaseApi } from "src/lib/firebase";
import { SentryApi } from "src/lib/sentry";
import { TProfile } from "src/types";

type TNewUser = {
	email: string;
	password: string;
	fullName: string;
};
export async function signup({
	newUser,
	newProfile,
}: {
	newUser: TNewUser;
	newProfile: Partial<TProfile>;
}) {
	try {
		const res = await FirebaseApi.auth.createUser(newUser.email, newUser.password);
		if (!res.success) {
			// todo: handle
			return res;
		}

		const profile = await FirebaseApi.firestore.setV2<Partial<TProfile>>({
			collection: "profiles",
			doc: newProfile,
		});

		return { user: res.user, profile, success: true, error: null };
	} catch (error) {
		SentryApi.captureException(error);
		return { user: null, success: false, error };
	}
}
