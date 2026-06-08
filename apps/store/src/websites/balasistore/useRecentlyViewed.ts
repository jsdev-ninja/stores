/**
 * Reads the visitor's recently-viewed products (recorded on the product page)
 * for the current store, and exposes a clear action. Client-only, no fetch —
 * see utils/recentlyViewed.
 */

import { useEffect, useState } from "react";
import { TProduct } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";
import { clearRecentlyViewed, getRecentlyViewed } from "src/utils/recentlyViewed";

type UseRecentlyViewedResult = {
	products: TProduct[];
	clear: () => void;
};

export function useRecentlyViewed(): UseRecentlyViewedResult {
	const store = useStore();
	const [products, setProducts] = useState<TProduct[]>([]);

	useEffect(() => {
		if (store?.id) setProducts(getRecentlyViewed(store.id));
	}, [store?.id]);

	const clear = () => {
		if (store?.id) clearRecentlyViewed(store.id);
		setProducts([]);
	};

	return { products, clear };
}
