// hello_algolia.js
import algoliasearch from "algoliasearch";

// Connect and authenticate with your Algolia app
export const AlgoliaClient = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

// Create a new index and add a record
export const productIndex = AlgoliaClient.initIndex("products");
// const record = { objectID: 1, name: "test_record" };
// index.saveObject(record).wait();

function init() {
	productIndex.setSettings({
		// attributesForFaceting: ["categories"],
	});
}

async function getProducts() {
	try {
		const result = await productIndex.search("", {
			attributesToHighlight: [],
			facetFilters: "price>110.9",
		});
		console.log("result", result.hits);
	} catch (error) {
		console.error(error);
	}
}

// // Search the index and print the results
// index.search("test_record").then(({ hits }) => console.log(hits[0]));

export const AlgoliaService = {
	getProducts,
	init,
};
