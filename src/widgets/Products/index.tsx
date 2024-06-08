import { InstantSearch, RefinementList, SearchBox } from "react-instantsearch";
import { AlgoliaClient } from "src/services";

export function Products() {
	return (
		<InstantSearch searchClient={AlgoliaClient} indexName={"products"}>
			<SearchBox />
			<RefinementList attribute="brand" />
            <hr />
			<RefinementList attribute="price" />
		</InstantSearch>
	);
}
