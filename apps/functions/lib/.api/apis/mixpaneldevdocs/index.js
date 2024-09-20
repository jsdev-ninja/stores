"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oas_1 = __importDefault(require("oas"));
const core_1 = __importDefault(require("api/dist/core"));
const openapi_json_1 = __importDefault(require("./openapi.json"));
class SDK {
    constructor() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, "mixpaneldevdocs/1.0.0 (api/6.1.2)");
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config) {
        this.core.setConfig(config);
    }
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values) {
        this.core.setAuth(...values);
        return this;
    }
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url, variables = {}) {
        this.core.setServer(url, variables);
    }
    /**
     * Get data from your Insights reports. The Query API has a rate limit of 60 queries per
     * hour and a maximum of 5 concurrent queries.
     *
     * @summary Query Saved Report
     */
    insightsQuery(metadata) {
        return this.core.fetch("/insights", "get", metadata);
    }
    /**
     * Get data for a funnel. The Query API has a rate limit of 60 queries per hour and a
     * maximum of 5 concurrent queries.
     *
     * @summary Query Saved Report
     */
    funnelsQuery(metadata) {
        return this.core.fetch("/funnels", "get", metadata);
    }
    /**
     * Get the names and funnel_ids of your funnels.
     *
     * @summary List Saved Funnels
     */
    funnelsListSaved(metadata) {
        return this.core.fetch("/funnels/list", "get", metadata);
    }
    /**
     * Query Retention Report
     *
     */
    retentionQuery(metadata) {
        return this.core.fetch("/retention", "get", metadata);
    }
    /**
     * Query Frequency Report
     *
     */
    retentionFrequencyQuery(metadata) {
        return this.core.fetch("/retention/addiction", "get", metadata);
    }
    /**
     * Get data for an event, segmented and filtered by properties. The Query API has a rate
     * limit of 60 queries per hour and a maximum of 5 concurrent queries.
     *
     * @summary Query Segmentation Report
     */
    segmentationQuery(metadata) {
        return this.core.fetch("/segmentation", "get", metadata);
    }
    /**
     * Get data for an event, segmented and filtered by properties, with values placed into
     * numeric buckets.
     * The Query API has a rate limit of 60 queries per hour and a maximum of 5 concurrent
     * queries.
     *
     * @summary Numerically Bucket
     */
    segmentationNumericQuery(metadata) {
        return this.core.fetch("/segmentation/numeric", "get", metadata);
    }
    /**
     * Sums an expression for events per unit time. The Query API has a rate limit of 60
     * queries per hour and a maximum of 5 concurrent queries.
     *
     * @summary Numerically Sum
     */
    segmentationSumQuery(metadata) {
        return this.core.fetch("/segmentation/sum", "get", metadata);
    }
    /**
     * Averages an expression for events per unit time. The Query API has a rate limit of 60
     * queries per hour and a maximum of 5 concurrent queries.
     *
     * @summary Numerically Average
     */
    segmentationQueryAverage(metadata) {
        return this.core.fetch("/segmentation/average", "get", metadata);
    }
    /**
     * This endpoint returns the activity feed for specified users. The Query API has a rate
     * limit of 60 queries per hour and a maximum of 5 concurrent queries.
     *
     * @summary Profile Event Activity
     */
    activityStreamQuery(metadata) {
        return this.core.fetch("/stream/query", "get", metadata);
    }
    /**
     * The list endpoint returns all of the cohorts in a given project. The JSON formatted
     * return contains the cohort name, id, count, description, creation date, and visibility
     * for every cohort in the project.
     *
     * If you're trying to get a list of users in a cohort, you can use the [`/engage` endpoint
     * with the `filter_by_cohort` parameter](ref:engage#engage-query).
     * The Query API has a rate limit of 60 queries per hour and a maximum of 5 concurrent
     * queries.
     *
     *
     * @summary List Saved Cohorts
     */
    cohortsList(metadata) {
        return this.core.fetch("/cohorts/list", "post", metadata);
    }
    engageQuery(body, metadata) {
        return this.core.fetch("/engage", "post", body, metadata);
    }
    /**
     * Get unique, total, or average data for a set of events over N days, weeks, or months.
     * The Query API has a rate limit of 60 queries per hour and a maximum of 5 concurrent
     * queries.
     *
     * @summary Aggregate Event Counts
     */
    listRecentEvents(metadata) {
        return this.core.fetch("/events", "get", metadata);
    }
    /**
     * Get the top events for today, with their counts and the normalized percent change from
     * yesterday.
     * The Query API has a rate limit of 60 queries per hour and a maximum of 5 concurrent
     * queries.
     *
     * @summary Today's Top Events
     */
    queryTopEvents(metadata) {
        return this.core.fetch("/events/top", "get", metadata);
    }
    /**
     * Get a list of the most common events over the last 31 days. The Query API has a rate
     * limit of 60 queries per hour and a maximum of 5 concurrent queries.
     *
     * @summary Top Events
     */
    queryMonthsTopEventNames(metadata) {
        return this.core.fetch("/events/names", "get", metadata);
    }
    /**
     * Get unique, total, or average data for of a single event and property over days, weeks,
     * or months.
     * The Query API has a rate limit of 60 queries per hour and a maximum of 5 concurrent
     * queries.
     *
     * @summary Aggregrated Event Property Values
     */
    queryEventProperties(metadata) {
        return this.core.fetch("/events/properties", "get", metadata);
    }
    /**
     * Get the top property names for an event. The Query API has a rate limit of 60 queries
     * per hour and a maximum of 5 concurrent queries.
     *
     * @summary Top Event Properties
     */
    queryEventsTopProperties(metadata) {
        return this.core.fetch("/events/properties/top", "get", metadata);
    }
    /**
     * Get the top values for a property. The Query API has a rate limit of 60 queries per hour
     * and a maximum of 5 concurrent queries.
     *
     * @summary Top Event Property Values
     */
    queryEventsTopPropertyValues(metadata) {
        return this.core.fetch("/events/properties/values", "get", metadata);
    }
    /**
     * Custom JQL Query
     *
     */
    queryJql(body, metadata) {
        return this.core.fetch("/jql", "post", body, metadata);
    }
}
const createSDK = (() => {
    return new SDK();
})();
exports.default = createSDK;
//# sourceMappingURL=index.js.map