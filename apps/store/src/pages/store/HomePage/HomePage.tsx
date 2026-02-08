import { ComponentType, LazyExoticComponent, Suspense, lazy } from "react";
import type { TStore } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";

const HOME_PAGE_CONFIG: Record<
	TStore["id"],
	{ homePage?: LazyExoticComponent<ComponentType<object>> }
> = {
	balasistore_store: {
		homePage: lazy(() => import("../../../websites/balasistore/HomePage")),
	},
} as const;

const DefaultHomePage = lazy(() => import("../../../websites/default/DefaultHomePage"));

export default function HomePage() {
	const store = useStore();

	if (!store) return null;

	const Component = HOME_PAGE_CONFIG[store.id]?.homePage;

	return <Suspense fallback={null}>{Component ? <Component /> : <DefaultHomePage />}</Suspense>;
}
