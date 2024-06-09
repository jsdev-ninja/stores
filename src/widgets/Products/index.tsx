import {
	Highlight,
	Hits,
	InstantSearch,
	Pagination,
	RefinementList,
	SearchBox,
} from "react-instantsearch";
import { TProduct } from "src/domains";
import { AlgoliaClient } from "src/services";
import { Product } from "../Product";
import { Button } from "src/components/Button/Button";
import { ReactNode } from "react";
import { navigate } from "src/navigation";

export function ProductsWidget({ children }: { children: ReactNode }) {
	return (
		<InstantSearch searchClient={AlgoliaClient} indexName={"products"}>
			{children}
		</InstantSearch>
	);
}

export function Products() {
	return <Hits hitComponent={HitComponent} />;
}

export function ProductsSearch() {
	return (
		<div className="">
			<SearchBox />
		</div>
	);
}

function HitComponent({ hit }: { hit: TProduct }) {
	return (
		<Product product={hit}>
			<div className="w-80 shadow p-4 flex flex-col ">
				<div className="h-40 w-40 mx-auto">
					<Product.Image />
				</div>

				<div className="my-2">
					<Product.Name />
					<Highlight attribute="brand" hit={hit} />
				</div>
				<Product.Description />
				<Product.Price />
				<div className="flex ga-1">
					Discount:
					<Product.Discount />
				</div>
				<Product.Sku />
				<Product.Vat />
				<div className="flex gap-1">
					type:
					<Product.Unit />
				</div>
				<div className="flex gap-1">
					Weight:
					<Product.Weight />
				</div>
				<div className="flex gap-1">
					Volume:
					<Product.Volume />
				</div>
				<div className="flex gap-4 justify-center my-4">
					<Button onClick={() => navigate("admin.editProduct", { id: hit.id })} fullWidth>
						Edit
					</Button>
					<Button fullWidth>Delete</Button>
				</div>
			</div>
		</Product>
	);
}
