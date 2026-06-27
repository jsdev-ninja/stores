/**
 * home.tsx — React Router v7 route module for "/" (home page).
 *
 * Build-time: loader fetches tenant context from Firestore and bakes
 * Organization JSON-LD + per-route meta into the static HTML for
 * crawlers / AI bots.
 *
 * Runtime (human browser): hydrates as a normal SPA. The full <App/>
 * component mounts and initialises Firebase/Redux/i18n, then renders
 * the interactive storefront through the custom router.
 *
 * No clientLoader.hydrate needed — the home page content is driven by
 * the Redux store populated by App's useAppInit on mount.
 */

import type { Route } from "./+types/home";
import { resolveTenant } from "app/lib/prerender/tenantData.server";
import { buildOrganizationJsonLd, serialiseJsonLd } from "app/lib/seo/jsonLd";
import { buildHomeMeta } from "app/lib/seo/meta";
import App from "src/app/App";

// ---------------------------------------------------------------------------
// Loader — runs AT BUILD TIME only (ssr: false + prerender).
// Do NOT use browser globals here. Reads from Firestore via tenant server module.
// ---------------------------------------------------------------------------

export async function loader(_args: Route.LoaderArgs) {
  const target = process.env["VITE_STORE_TARGET"];

  // resolveTenant may fail when the tenant cannot be found in Firestore (e.g.
  // the "tester" store URL is not registered). Return minimal fallback data so
  // the prerender produces a valid (if content-free) HTML shell rather than
  // crashing the build. Real stores (balasistore, pecanis) must be registered
  // in Firestore — misconfiguration will surface as a warning, not a hard failure.
  try {
    const ctx = await resolveTenant(target);
    return {
      canonicalOrigin: ctx.origin,
      storeName: ctx.storeId,
      logoUrl: `${ctx.origin}/logo.png`,
    };
  } catch (err) {
    console.warn("[home loader] Failed to resolve tenant — returning empty stub data:", err);
    return {
      canonicalOrigin: "",
      storeName: "",
      logoUrl: "",
    };
  }
}

// ---------------------------------------------------------------------------
// meta — replaces the entire route <head> meta (RR7: not merged).
// Each route must include everything it needs.
// ---------------------------------------------------------------------------

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "חנות" }];

  return buildHomeMeta({
    canonicalOrigin: data.canonicalOrigin,
    canonicalPath: "/",
    storeName: data.storeName,
  });
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

type Props = Route.ComponentProps;

export default function HomeRoute({ loaderData }: Props) {
  const jsonLd = buildOrganizationJsonLd(
    loaderData.storeName,
    loaderData.canonicalOrigin,
    loaderData.logoUrl
  );

  return (
    <>
      {/* Organization JSON-LD. React 19 hoists <script> to <head>. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }}
      />
      {/*
       * Full App — handles all interactive routing after hydration.
       * The custom router inside App reads from react-router (Strategy B),
       * so it renders the correct page (HomePage) for this URL.
       */}
      <App />
    </>
  );
}
