import { Configure, InstantSearch, useInfiniteHits } from "react-instantsearch";
import { TProduct } from "src/domains";
import { AlgoliaClient } from "src/services";
import { ReactNode, useEffect, useRef } from "react";

import type { Hit as AlgoliaHit } from "instantsearch.js";
import { ProductFilter } from "./ProductFilter/ProductFilter";
import { SearchBox } from "./SearchBox";

export function ProductsWidget({ children }: { children: ReactNode }) {
	// const filter = categories ? `categories.tag:${categories}` : "";
	return (
		<InstantSearch
			searchClient={AlgoliaClient}
			indexName={"products"}
			future={{
				preserveSharedStateOnUnmount: false,
				// persistHierarchicalRootCount: true,
			}}
		>
			<Configure
				//  filters={filter}
				attributesToHighlight={[]}
			/>
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
	console.log("useInfiniteHits", items);

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

	return (
		<>
			{children(items)}
			<div ref={sentinelRef} aria-hidden="true" />
		</>
	);
}
