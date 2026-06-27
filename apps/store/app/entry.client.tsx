import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { mixPanelApi } from "src/lib/mixpanel";
import { SentryApi } from "src/lib/sentry";
import { CONFIG } from "src/config";

// Analytics & error monitoring — client-only, safe here (no prerender)
mixPanelApi.init({ debug: CONFIG.DEV });
SentryApi.init();

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});
