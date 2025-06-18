import { TProduct, TStore } from "@jsdev_ninja/core";
import { ComponentType, LazyExoticComponent, Suspense, lazy } from "react";
import { useStore } from "src/domains/Store";

const RENDER_CONFIG: Record<
	TStore["id"],
	{ productCard?: LazyExoticComponent<ComponentType<{ product: TProduct }>> }
> = {
	tester_store: {
		// productCard: lazy(() => import("../../../websites/balasistore/index")),
	},
	"balasistore_store": {
		productCard: lazy(() => import("../../../websites/balasistore/index")),
	},
} as const;

const DefaultProductCard = lazy(() => import("../../../websites/default/DefaultProductCard"));

export function ProductRender({ product }: { product: TProduct }) {
	const store = useStore();

	if (!store) return null;
	const Component = RENDER_CONFIG[store.id]?.productCard;

	console.log("Component", Component, store.id);

	// todo
	return (
		<Suspense fallback="">
			<DefaultProductCard product={product} />
			{/* {Component ? <Component product={product} /> : <DefaultProductCard product={product} />} */}
		</Suspense>
	);
}
