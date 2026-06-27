/**
 * terms.tsx — React Router v7 route module for "/terms".
 *
 * Static route (no dynamic params). loader bakes terms page meta into
 * prerendered HTML. No clientLoader needed.
 */

import type { Route } from "./+types/terms";
import { resolveTenant } from "app/lib/prerender/tenantData.server";
import { buildTermsMeta } from "app/lib/seo/meta";
import App from "src/app/App";

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loader(_args: Route.LoaderArgs) {
  const target = process.env["VITE_STORE_TARGET"];

  // resolveTenant may fail when the tenant cannot be found in Firestore (e.g.
  // during a degraded build). Return empty fallback data so the prerender
  // produces a valid (if content-free) HTML shell rather than crashing the build.
  try {
    const ctx = await resolveTenant(target);
    return {
      canonicalOrigin: ctx.origin,
      storeName: ctx.storeId,
    };
  } catch (err) {
    console.warn("[terms loader] Failed to resolve tenant — returning empty stub data:", err);
    return {
      canonicalOrigin: "",
      storeName: "",
    };
  }
}

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "תנאי שימוש" }];

  return buildTermsMeta({
    canonicalOrigin: data.canonicalOrigin,
    canonicalPath: "/terms",
    storeName: data.storeName,
  });
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

type Props = Route.ComponentProps;

export default function TermsRoute(_props: Props) {
  // Terms page content is static HTML in TermsPage.tsx — rendered by App's
  // custom router when the URL is "/terms".
  return <App />;
}
