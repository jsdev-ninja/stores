/**
 * Fetches real products from Algolia for the home page sections.
 * Approach (a): direct AlgoliaClient.initIndex().search() — decouples the
 * sections from InstantSearch/InfiniteHits and lets the HomePage fetch once
 * and distribute slices to each section as props.
 */

import { useEffect, useState } from "react";
import { TProduct } from "@jsdev_ninja/core";
import { AlgoliaClient } from "src/services";
import { useStore } from "src/domains/Store";

const INDEX_NAME = "products";
const FETCH_COUNT = 24; // enough for hero(3) + trending(6) + featured(6) + products(8) + 1 buffer

type UseHomeProductsResult = {
	products: TProduct[];
	loading: boolean;
};

export function useHomeProducts(): UseHomeProductsResult {
	const store = useStore();
	const [products, setProducts] = useState<TProduct[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!store?.companyId || !store?.id) return;

		const filters = `companyId:${store.companyId} AND storeId:${store.id} AND isPublished:true`;

		const index = AlgoliaClient.initIndex(INDEX_NAME);
		let cancelled = false;

		setLoading(true);
		index
			.search<TProduct>("", { filters, hitsPerPage: FETCH_COUNT })
			.then((res) => {
				if (!cancelled) {
					setProducts(res.hits as TProduct[]);
				}
			})
			.catch(() => {
				if (!cancelled) setProducts([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [store?.companyId, store?.id]);

	return { products, loading };
}
