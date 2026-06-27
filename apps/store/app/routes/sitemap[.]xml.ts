/**
 * sitemap[.]xml.ts — resource route for /sitemap.xml
 *
 * React Router v7 resource route: exports only a `loader` that returns a
 * plain Response. No default component export — the framework treats this as
 * a data/file endpoint, not a page.
 *
 * Prerendered at build time (included in getStaticPaths() via routes.ts).
 * The resulting sitemap.xml is emitted into build/client/sitemap.xml.
 *
 * Uses getTenantStaticPaths() — the same enumeration used by the prerender
 * config — so the sitemap always lists exactly the paths that were prerendered.
 * Tenant canonical origin comes from resolveTenant(VITE_STORE_TARGET).
 *
 * Resilient: any Firestore failure degrades to static paths only ("/",
 * "/terms", "/discounts") with a console.warn; the build never crashes.
 */

import {
  getTenantStaticPaths,
  resolveTenant,
} from "app/lib/prerender/tenantData.server";

// ---------------------------------------------------------------------------
// Resource route loader — returns sitemap.xml as application/xml
// ---------------------------------------------------------------------------

export async function loader() {
  const target = process.env["VITE_STORE_TARGET"];

  // Resolve tenant origin and enumerate paths in parallel. Both are resilient.
  let origin = "";
  let paths: string[] = ["/", "/terms", "/discounts"];

  try {
    const [ctx, tenantPaths] = await Promise.all([
      resolveTenant(target),
      getTenantStaticPaths(target),
    ]);
    origin = ctx.origin;
    // Filter out the stub paths (_prerender) that exist only to satisfy
    // React Router's ssr:false constraint — they must not appear in sitemap.
    paths = tenantPaths.filter(
      (p) => !p.includes("_prerender")
    );
  } catch (err) {
    console.warn(
      "[sitemap.xml loader] Failed to resolve tenant or enumerate paths — " +
        "falling back to static paths only:",
      err
    );
  }

  const xml = buildSitemapXml(origin, paths);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Short TTL: crawlers should revalidate frequently after rebuilds.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}

// ---------------------------------------------------------------------------
// Content builder
// ---------------------------------------------------------------------------

/**
 * Build the sitemap.xml string from the given origin and path list.
 *
 * Follows the Sitemap Protocol 0.9 (http://www.sitemaps.org/schemas/sitemap/0.9).
 * Each path is combined with the canonical origin to form absolute URLs.
 * No <lastmod> or <priority> are included — keeping the sitemap minimal
 * and focused on URL discovery for crawlers and AI bots.
 *
 * Stub paths (`_prerender`) are excluded by the loader above.
 */
function buildSitemapXml(origin: string, paths: string[]): string {
  const urlEntries = paths
    .map((p) => {
      // Normalise: ensure exactly one slash between origin and path.
      const loc = origin ? `${origin}${p.startsWith("/") ? p : `/${p}`}` : p;
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
    })
    .join("\n");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urlEntries +
    "\n</urlset>\n"
  );
}

/**
 * Escape characters that are not safe inside XML text content.
 * The canonical origin and paths are developer-controlled, but we escape
 * defensively to ensure well-formed XML.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
