import { TCompany } from "src/domains/Company";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import DefaultLogoSrc from "../assets/default_logo.png";
import { FirebaseAPI, TStore } from "@jsdev_ninja/core";
import { loadStoreTheme } from "src/infra/theme/loadStoreTheme";

// ---------------------------------------------------------------------------
// Build-time tenant injection
// ---------------------------------------------------------------------------

/**
 * When the build-time prerender injects a tenant context (companyId + storeId)
 * into `window.__PRERENDER_TENANT__`, useAppInit() uses it directly instead of
 * querying Firestore by origin. This avoids any dependency on window.location
 * during hydration of prerendered pages.
 *
 * The SPA path (non-prerendered or dev mode) is completely unchanged: the
 * property is absent so the runtime falls through to the existing origin query.
 */
interface PrerenderTenantConfig {
	companyId: string;
	storeId: string;
	tenantId: string;
}

declare global {
	interface Window {
		__PRERENDER_TENANT__?: PrerenderTenantConfig;
	}
}

export async function useAppInit() {
	const actions = useStoreActions();
	const appReady = useAppSelector((state) => state.ui.appReady);

	if (appReady) return;

	// Guard: window is undefined during build-time prerender (no browser).
	// This function is called from a React effect in App.tsx, so in practice
	// it only runs in the browser — but the guard keeps the module render-safe.
	if (typeof window === "undefined") return;

	let company: TCompany | undefined;
	let store: TStore | undefined;

	// --- Path A: injected build-time tenant config (prerendered hydration) ---
	const injected = window.__PRERENDER_TENANT__;
	if (injected?.companyId && injected?.storeId) {
		// Resolve company and store by their IDs rather than by origin lookup.
		const [companyResponse, storeResponse] = await Promise.all([
			FirebaseApi.firestore.getV2<TCompany>({
				collection: FirebaseAPI.firestore.systemCollections.companies,
				id: injected.companyId,
			}),
			FirebaseApi.firestore.getV2<TStore>({
				collection: FirebaseAPI.firestore.systemCollections.stores,
				id: injected.storeId,
			}),
		]);

		company = companyResponse?.data ?? undefined;
		store = storeResponse?.data ?? undefined;
	} else {
		// --- Path B: runtime SPA path — resolve by origin (existing behaviour) ---
		const origin = window.location.origin;

		const [companyResponse, storeResponse] = await Promise.all([
			FirebaseApi.firestore.listV2<TCompany>({
				collection: FirebaseAPI.firestore.systemCollections.companies,
				where: [{ name: "websiteDomains", operator: "array-contains", value: origin }],
			}),
			FirebaseApi.firestore.listV2<TStore>({
				collection: FirebaseAPI.firestore.systemCollections.stores,
				where: [{ name: "urls", operator: "array-contains", value: origin }],
			}),
		]);

		company = companyResponse?.data?.[0];
		store = storeResponse?.data?.[0];
	}

	// Client-side tenant verification — confirm the correct company/store
	// resolves for this domain (open the browser console on each store).
	console.log("[tenant]", {
		origin: window.location.origin,
		source: injected?.companyId ? "prerender-injected" : "origin-query",
		companyId: company?.id,
		storeId: store?.id,
		tenantId: store?.tenantId,
	});

	FirebaseApi.api.uiLogs({
		message: "App init",
		severity: "INFO",
		company,
		store,
		companyId: company?.id,
		storeId: store?.id,
		tenantId: store?.tenantId,
		url: window.location.href,
	});

	if (!company || !store) {
		actions.dispatch(actions.ui.setAppReady(true));

		FirebaseApi.api.uiLogs({
			message: "App init error",
			severity: "ERROR",
			company,
			store,
			companyId: company?.id,
			storeId: store?.id,
			tenantId: store?.tenantId,
			url: window.location.href,
		});
		return;
	}

	if (company && store) {
		// DOM writes — safe here because this code runs in the browser (effect).
		const link: any =
			document.querySelector("link[rel*='icon']") || document.createElement("link");
		link.type = "image/x-icon";
		link.rel = "shortcut icon";
		link.href = store.logoUrl ?? DefaultLogoSrc;
		document.getElementsByTagName("head")[0].appendChild(link);
		document.title = company.name;

		// Apply the store's theme to the WHOLE app (admin + storefront).
		// Each domain resolves to exactly one store, so this attribute stays
		// on <html> for the entire session — every route inherits the theme.
		document.documentElement.setAttribute("data-store-theme", store.id);

		await loadStoreTheme(store.id);
	}

	!!store && FirebaseApi.auth.setTenantId(store.tenantId);
	!!company && actions.dispatch(actions.company.setCompany(company));
	!!store && actions.dispatch(actions.store.setStore(store));
	actions.dispatch(actions.ui.setAppReady(true));
}
