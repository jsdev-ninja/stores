import { Configure, InstantSearch, useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { AlgoliaClient } from "src/services";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProductFilter } from "./ProductFilter/ProductFilter";
import { SearchBox } from "./SearchBox";
import { useStore } from "src/domains/Store";
import { TProduct } from "@jsdev_ninja/core";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { useTranslation } from "react-i18next";
import { useParams } from "src/navigation";
import { useAppApi } from "src/appApi";

function Middleware() {
	const { addMiddlewares } = useInstantSearch();

	const appApi = useAppApi();
	useLayoutEffect(() => {
		addMiddlewares(() => {
			return {
				onStateChange({ uiState }) {
					const index = "products";
					const state = uiState[index];
					appApi.logger({
						message: "products state change",
						severity: "INFO",
						query: state?.query,
						filters: state?.configure?.filters,
					});
				},
			};
		});
	}, []);
	return null;
}
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

	const categoryName = params[`category${(index + 1) as 1 | 2 | 3 | 4 | 5}`];

	const filter = categoryName
		? `(categoryIds:'${decodeURIComponent(categoryName)}' AND isPublished:true)`
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
			<Middleware />
			<RestPage filters={filters} />
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

	const _filter = filter ? `AND ${filter}` : "";

	const filters = `companyId:${store?.companyId} AND storeId:${store?.id} ${_filter}`;

	if (!store?.companyId || !store.id) return null;

	return (
		<InstantSearch
			searchClient={AlgoliaClient}
			indexName={"products"}
			future={{
				preserveSharedStateOnUnmount: true,
				persistHierarchicalRootCount: true,
			}}
		>
			<RestPage filters={filters} />
			<Middleware />
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

// todo
function RestPage({ filters }: { filters: string }) {
	const { setUiState } = useInstantSearch();

	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (!ready) return setReady(true);
		setUiState((prev) => ({
			...prev,
			products: {
				...prev.products,
				page: 0, // reset page when filters change
			},
		}));
	}, [filters]);
	return null;
}

export function Products({
	children,
	emptyStateAction,
}: {
	// AlgoliaHit<TProduct>
	children: (products: any[]) => ReactNode;
	emptyStateAction: () => void;
}) {
	const { showMore, items, isLastPage } = useInfiniteHits<TProduct>({});

	const { t } = useTranslation(["emptyState"]);

	const sentinelRef = useRef(null);

	useEffect(() => {
		if (sentinelRef.current !== null) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !isLastPage) {
							showMore();
						}
					});
				},
				{ threshold: 1 },
			);

			observer.observe(sentinelRef.current);

			return () => {
				observer.disconnect();
			};
		}
	}, [isLastPage, items.length, showMore]);

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
			<div aria-hidden="true" className="w-full" ref={sentinelRef}></div>
		</>
	);
}
