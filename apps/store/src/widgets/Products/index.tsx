import { Configure, InstantSearch, useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { AlgoliaClient } from "src/services";
import { ReactNode, useEffect, useRef } from "react";

import type { Hit as AlgoliaHit } from "instantsearch.js";
import { ProductFilter } from "./ProductFilter/ProductFilter";
import { SearchBox } from "./SearchBox";
import { useStore } from "src/domains/Store";
import { TProduct } from "@jsdev_ninja/core";

export function ProductsWidget({
	children,
	filter = "",
}: {
	children: ReactNode;
	filter?: string;
}) {
	const store = useStore();

	if (!store?.companyId || !store.id) return null;

	const _filter = filter ? ` AND (${filter})` : "";
	console.log("_filter", _filter);

	const filters = `(companyId:${store.companyId} AND storeId:${store.id}) ${_filter}`;
	// const filters = ``;
	console.log("filters", filters);

	return (
		<InstantSearch
			searchClient={AlgoliaClient}
			indexName={"products"}
			future={{
				preserveSharedStateOnUnmount: false,
				persistHierarchicalRootCount: false,
			}}
		>
			<Configure filters={filters} attributesToHighlight={[]} />
			{children}
		</InstantSearch>
	);
}

ProductsWidget.Filter = ProductFilter;
ProductsWidget.Products = Products;
ProductsWidget.SearchBox = SearchBox;

export function Products({
	children,
}: {
	children: (products: AlgoliaHit<TProduct>[]) => ReactNode;
}) {
	const { showMore, items, isLastPage } = useInfiniteHits<TProduct>();
	const { status } = useInstantSearch();

	const sentinelRef = useRef(null);

	useEffect(() => {
		if (sentinelRef.current !== null) {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isLastPage) {
						showMore();
					}
				});
			});

			observer.observe(sentinelRef.current);

			return () => {
				observer.disconnect();
			};
		}
	}, [isLastPage, showMore]);

	if (status === "loading") return null; //todo

	return (
		<>
			{children(items)}
			<div ref={sentinelRef} aria-hidden="true" />
		</>
	);
}
