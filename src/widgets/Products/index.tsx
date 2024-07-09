import { Configure, InstantSearch, SearchBox, useHits } from "react-instantsearch";
import { TProduct } from "src/domains";
import { AlgoliaClient } from "src/services";
import { ReactNode } from "react";

import type { Hit as AlgoliaHit } from "instantsearch.js";

export function ProductsWidget({
	children,
	categories,
}: {
	children: ReactNode;
	categories?: string;
}) {
	const filter = categories ? `categories.tag:${categories}` : "";
	return (
		<InstantSearch searchClient={AlgoliaClient} indexName={"products"}>
			<Configure filters={filter} attributesToHighlight={[]} />
			{children}
		</InstantSearch>
	);
}

ProductsWidget.Products = Products;

export function Products({
	children,
}: {
	children: (products: AlgoliaHit<TProduct>[]) => ReactNode;
}) {
	const result = useHits<TProduct>();
	console.log("result", result.items);

	return children(result.items);
}

export function ProductsSearch() {
	return (
		<div className="w-full">
			<SearchBox />
		</div>
	);
}
