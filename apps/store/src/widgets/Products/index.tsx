import { Configure, InstantSearch, useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { AlgoliaClient } from "src/services";
import { ReactNode, useEffect, useRef } from "react";
import { ProductFilter } from "./ProductFilter/ProductFilter";
import { SearchBox } from "./SearchBox";
import { useStore } from "src/domains/Store";
import { TProduct } from "@jsdev_ninja/core";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { useTranslation } from "react-i18next";
import { useParams } from "src/navigation";

export function ProductsWidget({
	children,
}: // filter = "",
{
	children: ReactNode;
	filter?: string;
}) {
	const store = useStore();

	const params = useParams("store.catalog");

	const topCategory = Object.values(params);
	const index = topCategory.findLastIndex((el) => !!el);

	console.log("topCategory", topCategory);

	const categoryName = params[`category${(index + 1) as 1 | 2 | 3 | 4 | 5}`];

	console.log("categoryName", categoryName);

	const filter = categoryName
		? `(categoryIds:'${decodeURIComponent(categoryName)}'  AND isPublished:true)`
		: "isPublished:true";

	if (!store?.companyId || !store.id) return null;

	const _filter = filter ? `AND ${filter}` : "";

	console.log("_filter", _filter);

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

export function ProductsWidgetAdmin({
	children,
}: // filter = "",
{
	children: ReactNode;
	filter?: string;
}) {
	const store = useStore();

	const params = useParams("admin.products");

	const topCategory = Object.values(params);
	const index = topCategory.findLastIndex((el) => !!el);

	const categoryName = params[`category${(index + 1) as 1 | 2 | 3 | 4 | 5}`];

	const filter = categoryName
		? `(categoryIds:'${decodeURIComponent(categoryName)}'  AND isPublished:true)`
		: "isPublished:true";

	if (!store?.companyId || !store.id) return null;

	const _filter = filter ? `AND ${filter}` : "";

	console.log("_filter", _filter);

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

ProductsWidgetAdmin.Filter = ProductFilter;
ProductsWidgetAdmin.Products = Products;
ProductsWidgetAdmin.SearchBox = SearchBox;

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

	const { t } = useTranslation(["emptyState"]);

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

	if (status === "loading" || status === "stalled") return null; //todo

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
