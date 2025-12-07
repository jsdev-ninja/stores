//...
import { init, captureException, replayIntegration, setUser, User } from "@sentry/react";
import { CONFIG } from "src/config";

export const SentryApi = {
	init: () => {
		init({
			dsn: "https://be5a6d671215b40fdd29efb1bff8bdf5@o4507773250764800.ingest.de.sentry.io/4507773252862032",
			// integrations: [Sentry.browserTracingIntegration(), replayIntegration()],
			environment: CONFIG.MODE,
			// Tracing
			tracesSampleRate: 1.0, //  Capture 100% of the transactions
			// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
			tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
			// Session Replay
			replaysSessionSampleRate: CONFIG.DEV ? 0.1 : 1.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
			replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
			integrations: [
				replayIntegration({
					maskAllInputs: false,
					maskAllText: false,
					blockAllMedia: false,
				}),
			],
			debug: CONFIG.DEV,
		});
	},
	setUser: (user: User) => {
		setUser(user);
	},

	captureException: (error: any) => {
		captureException(error);
	},
};
