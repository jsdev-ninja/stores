import { TProduct } from "@jsdev_ninja/core";
import { Suspense, lazy } from "react";
import { useStore } from "src/domains/Store";
import { RENDER_CONFIG } from "src/websites/config";

const TesterProduct = lazy(() => import("../../../websites/tester/index"));
const DefaultProductCard = lazy(() => import("../../../websites/default/DefaultProductCard"));
const OpalMarketProductCart = lazy(() => import("../../../websites/opal-market/index"));

export function ProductRender({ product }: { product: TProduct }) {
	const store = useStore();

	if (!store) return null;

	return (
		<Suspense fallback="loading">
			{!!RENDER_CONFIG[store.id].productCard ? (
				<TesterProduct />
			) : (
				<OpalMarketProductCart product={product} />
			)}
		</Suspense>
	);
}
