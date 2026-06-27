import type { Config } from "@react-router/dev/config";
import { getTenantStaticPaths } from "./app/lib/prerender/tenantData.server";

export default {
  appDirectory: "app",
  ssr: false,

  /**
   * Prerender: async function form (§4.2 form c) so we can append dynamic
   * paths (products + categories) from Firestore to the static paths that
   * getStaticPaths() discovers from routes.ts.
   *
   * Resilient by design: getTenantStaticPaths wraps Firestore reads in
   * try/catch and, on any failure, degrades to ["/", "/terms", "/discounts"]
   * only — the build never fails due to data-fetch errors.
   *
   * Tenant is determined by VITE_STORE_TARGET at build time.
   * Each store gets its own build (see package.json build:tester / balasistore / pecanis).
   */
  async prerender({ getStaticPaths }) {
    const target = process.env["VITE_STORE_TARGET"];

    // getTenantStaticPaths resolves static + catalog + product paths for the
    // active tenant.  Static paths ("/", "/terms", "/discounts") are always
    // returned by this function, so we DON'T need to call getStaticPaths()
    // separately — they overlap.  We use getStaticPaths() to catch any
    // additional static routes that may be declared in routes.ts in the future.
    const [staticPaths, tenantPaths] = await Promise.all([
      Promise.resolve(getStaticPaths()),
      getTenantStaticPaths(target),
    ]);

    // Merge and de-duplicate: static paths from routes.ts + tenant-scoped
    // catalog/product paths.  Use a Set to avoid duplicating "/", "/terms",
    // "/discounts" which appear in both lists.
    const merged = Array.from(new Set([...staticPaths, ...tenantPaths]));
    return merged;
  },
} satisfies Config;
