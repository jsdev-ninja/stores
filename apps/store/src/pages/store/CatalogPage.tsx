import { ComponentType, LazyExoticComponent, Suspense, lazy } from "react";
import type { TStore } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";

/**
 * Per-store catalog registry. A store listed here renders its own catalog
 * component (lazy-loaded from `src/websites/<store>/`); every other store falls
 * back to `DefaultCatalogPage`. Mirrors HOME_PAGE_CONFIG / RENDER_CONFIG —
 * store-specific UI lives under `src/websites`, never as an inline branch here.
 */
const CATALOG_PAGE_CONFIG: Record<
	TStore["id"],
	{ catalogPage?: LazyExoticComponent<ComponentType<object>> }
> = {
	tester_store: {
		catalogPage: lazy(() => import("src/websites/tester/CatalogPage")),
	},
} as const;

const DefaultCatalogPage = lazy(() => import("src/websites/default/DefaultCatalogPage"));

export function CatalogPage() {
	const store = useStore();

	if (!store) return null;

	const Component = CATALOG_PAGE_CONFIG[store.id]?.catalogPage;

	return (
		<Suspense fallback={null}>
			{Component ? <Component /> : <DefaultCatalogPage />}
		</Suspense>
	);
}
