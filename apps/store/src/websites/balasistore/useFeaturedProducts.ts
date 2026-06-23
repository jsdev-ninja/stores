/**
 * Resolves the products shown in the home "מבחר השבוע" / trending strip.
 *
 * If the store owner has curated a list in the admin panel
 * ({companyId}/{storeId}/settings/homeFeatured), those products are
 * fetched by id and shown in the chosen order. Otherwise — or if none of the
 * curated products are still published — it falls back to the first N of the
 * products already loaded for the home page. So the strip is never empty and
 * there is no storefront regression when no selection exists.
 */

import { useEffect, useState } from "react";
import { FirebaseAPI, TProduct } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { useStore } from "src/domains/Store";

const FEATURED_COUNT = 6;

export function useFeaturedProducts(fallback: TProduct[]): TProduct[] {
	const store = useStore();
	const [featured, setFeatured] = useState<TProduct[] | null>(null);

	useEffect(() => {
		const companyId = store?.companyId;
		const storeId = store?.id;
		if (!companyId || !storeId) return;

		let cancelled = false;

		(async () => {
			const configRes = await FirebaseApi.firestore.getV2<{
				productIds: string[];
			}>({
				collection: FirebaseAPI.firestore.getPath({
					companyId,
					storeId,
					collectionName: "settings",
				}),
				id: "homeFeatured",
			});

			const ids = configRes?.success
				? configRes.data?.productIds ?? []
				: [];

			if (!ids.length) {
				if (!cancelled) setFeatured(null);
				return;
			}

			const productsPath = FirebaseAPI.firestore.getPath({
				companyId,
				storeId,
				collectionName: "products",
			});

			// eslint-disable-next-line compat/compat
			const results = await Promise.all(
				ids
					.slice(0, FEATURED_COUNT)
					.map((id) =>
						FirebaseApi.firestore.getV2<TProduct>({
							collection: productsPath,
							id,
						}),
					),
			);

			const picked = results
				.map((r) => (r?.success ? r.data : null))
				.filter((p): p is TProduct => !!p && p.isPublished);

			if (!cancelled) setFeatured(picked.length ? picked : null);
		})();

		return () => {
			cancelled = true;
		};
	}, [store?.companyId, store?.id]);

	return featured ?? fallback.slice(0, FEATURED_COUNT);
}
