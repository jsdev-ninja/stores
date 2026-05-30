import { THEME_CONFIG } from "src/components/renders/ThemeRender/themeConfig";

const THEME_LOAD_TIMEOUT_MS = 2_000;

/**
 * Load the per-store CSS theme, if one is registered for this store.
 * Falls back silently to defaults on:
 *  - unregistered store id
 *  - import failure
 *  - timeout (avoids hanging app boot if a CSS chunk stalls; the import
 *    keeps running fire-and-forget, with its own .catch so any late
 *    rejection is logged and swallowed — never unhandled).
 */
export async function loadStoreTheme(storeId: string): Promise<void> {
	const load = THEME_CONFIG[storeId];
	if (!load) return;

	// Attach .catch directly to the import promise so a rejection AFTER the
	// race resolves (via timeout) doesn't become an unhandled rejection.
	const loadPromise: Promise<void> = load()
		.then(() => {})
		.catch((err) => {
			console.error("[theme] late failure (post-timeout)", storeId, err);
		});

	const timeout = new Promise<void>((resolve) =>
		setTimeout(resolve, THEME_LOAD_TIMEOUT_MS)
	);

	await Promise.race([loadPromise, timeout]);
}
