import { ComponentType, LazyExoticComponent, Suspense, lazy } from "react";
import type { TStore } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";
import DefaultProfilePage from "./DefaultProfilePage";

// Store-specific personal-area designs. Falls back to DefaultProfilePage.
const PROFILE_PAGE_CONFIG: Record<
	TStore["id"],
	{ profilePage?: LazyExoticComponent<ComponentType<object>> }
> = {
	balasistore_store: {
		profilePage: lazy(() => import("../../../websites/balasistore/ProfilePage")),
	},
	// tester is the dev-preview of the Balasi storefront — shares the same design
	tester_store: {
		profilePage: lazy(() => import("../../../websites/balasistore/ProfilePage")),
	},
} as const;

const ProfilePage = () => {
	const store = useStore();

	const Component = store ? PROFILE_PAGE_CONFIG[store.id]?.profilePage : undefined;

	if (Component) {
		return (
			<Suspense fallback={null}>
				<Component />
			</Suspense>
		);
	}

	return <DefaultProfilePage />;
};

export default ProfilePage;
