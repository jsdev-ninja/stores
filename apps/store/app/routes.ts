import { type RouteConfig, route } from "@react-router/dev/routes";

// Strategy B: promoted public routes come BEFORE the catch-all so React Router
// owns them for prerendering and SEO.  The catch-all ("$") handles every other
// path (cart, checkout, admin, pay/:token, etc.) by mounting the full <App/> —
// identical to today's SPA behaviour.
//
// Order matters: more-specific routes are listed first.
export default [
  // -------------------------------------------------------------------------
  // Public prerendered routes (§6.2 PRERENDERED list)
  // Each has a loader (build-time Firestore fetch) + meta + JSON-LD.
  // -------------------------------------------------------------------------
  route("/", "routes/home.tsx"),
  route("/terms", "routes/terms.tsx"),
  route("/discounts", "routes/discounts.tsx"),
  route(
    "/catalog/:category1?/:category2?/:category3?/:category4?/:category5?",
    "routes/catalog.tsx"
  ),
  route("/products/:id", "routes/product.tsx"),

  // -------------------------------------------------------------------------
  // SEO/GEO resource routes — prerendered at build time into static files.
  // React Router treats files with no default export as resource routes
  // (loader-only), so these emit robots.txt and sitemap.xml into build/client.
  // -------------------------------------------------------------------------
  route("/robots.txt", "routes/robots[.]txt.ts"),
  route("/sitemap.xml", "routes/sitemap[.]xml.ts"),

  // -------------------------------------------------------------------------
  // Catch-all — mounts the entire existing <App/> and its hand-rolled router.
  // Serves cart, checkout, orders, profile, favorites, all admin routes,
  // superAdmin, and pay/:token as a SPA (behaviour unchanged from today).
  // -------------------------------------------------------------------------
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
