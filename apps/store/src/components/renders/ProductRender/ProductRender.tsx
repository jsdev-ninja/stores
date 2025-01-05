import { TProduct } from "@jsdev_ninja/core";
import { ComponentType, LazyExoticComponent, Suspense, lazy } from "react";
import { useStore } from "src/domains/Store";

import { TStore } from "src/domains/Store";

export const RENDER_CONFIG: Record<
	TStore["id"],
	{ productCard?: LazyExoticComponent<ComponentType<{ product: TProduct }>> }
> = {
	"tester-store": {
		// productCard: lazy(() => import("../../../websites/tester/index")),
	},
	"opal-market-store": {
		productCard: lazy(() => import("../../../websites/opal-market/index")),
	},
} as const;

const DefaultProductCard = lazy(() => import("../../../websites/default/DefaultProductCard"));

export function ProductRender({ product }: { product: TProduct }) {
	const store = useStore();

	if (!store) return null;
	const Component = RENDER_CONFIG[store.id]?.productCard;

	return (
		<Suspense fallback="loading">
			{!!Component ? <Component product={product} /> : <DefaultProductCard product={product} />}
		</Suspense>
	);
}
