/**
 * discounts.tsx — React Router v7 route module for "/discounts".
 *
 * Static route (no dynamic params). loader bakes discounts page meta into
 * prerendered HTML. No clientLoader needed.
 */

import type { Route } from "./+types/discounts";
import { resolveTenant } from "app/lib/prerender/tenantData.server";
import { buildDiscountsMeta } from "app/lib/seo/meta";
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
    console.warn("[discounts loader] Failed to resolve tenant — returning empty stub data:", err);
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
  if (!data) return [{ title: "מבצעים" }];

  return buildDiscountsMeta({
    canonicalOrigin: data.canonicalOrigin,
    canonicalPath: "/discounts",
    storeName: data.storeName,
  });
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

type Props = Route.ComponentProps;

export default function DiscountsRoute(_props: Props) {
  return <App />;
}
