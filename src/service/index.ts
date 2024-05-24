// hello_algolia.js
import algoliasearch from "algoliasearch";

// Connect and authenticate with your Algolia app
const client = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

// Create a new index and add a record
const index = client.initIndex("test_index");
const record = { objectID: 1, name: "test_record" };
// index.saveObject(record).wait();

// Search the index and print the results
// index.search("test_record").then(({ hits }) => console.log(hits[0]));

export const Service = {};
