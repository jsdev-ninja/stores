//...
import * as Sentry from "@sentry/react";

export const SentryApi = {
	init: () => {
		Sentry.init({
			dsn: "https://a8da1526d763fe7c4b8fd9c18e48fe4e@o4507773250764800.ingest.de.sentry.io/4507773252862032",
			integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
			// Tracing
			tracesSampleRate: 1.0, //  Capture 100% of the transactions
			// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
			tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
			// Session Replay
			replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
			replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
		});
	},
};
