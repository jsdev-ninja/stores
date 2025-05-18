import { Configure, InstantSearch, useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { AlgoliaClient } from "src/services";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ProductFilter } from "./ProductFilter/ProductFilter";
import { SearchBox } from "./SearchBox";
import { useStore } from "src/domains/Store";
import { TProduct } from "@jsdev_ninja/core";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { useTranslation } from "react-i18next";

export function ProductsWidget({
	children,
	filter = "",
}: {
	children: ReactNode;
	filter?: string;
}) {
	const store = useStore();

	if (!store?.companyId || !store.id) return null;

	const _filter = filter ? `AND ${filter}` : "";

	const filters = `companyId:${store.companyId} AND storeId:${store.id} ${_filter}`;

	return (
		<InstantSearch
			searchClient={AlgoliaClient}
			indexName={"products"}
			future={{
				preserveSharedStateOnUnmount: true,
				persistHierarchicalRootCount: true,
			}}
		>
			<Configure
				queryLanguages={["he", "en"]}
				{...(filters ? { filters: filters } : {})}
				attributesToHighlight={[]}
			/>
			{children}
		</InstantSearch>
	);
}
// filters: categoryNames:"קפה שחור"
// filters: categoryNames:"קפה שחור"

ProductsWidget.Filter = ProductFilter;
ProductsWidget.Products = Products;
ProductsWidget.SearchBox = SearchBox;

export function Products({
	children,
	emptyStateAction,
}: {
	// AlgoliaHit<TProduct>
	children: (products: any[]) => ReactNode;
	emptyStateAction: () => void;
}) {
	const { showMore, items, isLastPage } = useInfiniteHits<TProduct>({});
	const { status } = useInstantSearch();

	const [ready, setReady] = useState(false);

	const { t } = useTranslation(["emptyState"]);

	const sentinelRef = useRef(null);

	useEffect(() => {
		setReady(true);
	}, []);

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

	if (status === "loading" || status === "stalled" || !ready) return null; //todo

	console.log("items", items);

	if (!items.length) {
		return (
			<div className="mx-auto self-center">
				<EmptyState
					title={t("emptyState:productsList.title")}
					description={t("emptyState:productsList.description")}
					action={{
						onClick: emptyStateAction,
						title: t("emptyState:productsList.action"),
					}}
				/>
			</div>
		);
	}

	return (
		<>
			{children(items)}
			{/* <div aria-hidden="true" className="w-full" ref={sentinelRef}></div> */}
		</>
	);
}
