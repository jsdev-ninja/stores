import { TProfile } from "@jsdev_ninja/core";
import { ReactNode, createContext, useContext } from "react";

const ProfileContext = createContext<TProfile | null>(null);

export function Profile({ profile, children }: { profile: TProfile; children: ReactNode }) {
	return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

const useProfileHook = () => useContext(ProfileContext);

Profile.Address = function Address() {
	const profile = useProfileHook();

	if (!profile) return null;

	const { city } = profile.address ?? {};

	return <div className="">{city}</div>;
};
