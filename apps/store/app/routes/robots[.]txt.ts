/**
 * robots[.]txt.ts — resource route for /robots.txt
 *
 * React Router v7 resource route: exports only a `loader` that returns a
 * plain Response. No default component export — the framework treats this as
 * a data/file endpoint, not a page.
 *
 * Prerendered at build time (included in getStaticPaths() via routes.ts).
 * The resulting robots.txt is emitted into build/client/robots.txt.
 *
 * Allow-list includes the major search-engine and AI crawlers (Googlebot,
 * Google-Extended, GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot) so they
 * can crawl all public paths. The wildcard User-agent block disallows private
 * SPA-only paths (admin, superAdmin, cart, checkout, profile) from generic
 * bots. The Sitemap directive points to the per-tenant canonical origin.
 *
 * Canonical origin is read from VITE_STORE_TARGET → STORE_TARGET_ORIGINS at
 * build time. Falls back to an empty string on failure so the build never
 * crashes (the prerendered robots.txt will still be syntactically valid).
 */

import { resolveTenant } from "app/lib/prerender/tenantData.server";

// ---------------------------------------------------------------------------
// Resource route loader — returns robots.txt content as text/plain
// ---------------------------------------------------------------------------

export async function loader() {
  const target = process.env["VITE_STORE_TARGET"];

  let origin = "";
  try {
    const ctx = await resolveTenant(target);
    origin = ctx.origin;
  } catch (err) {
    console.warn("[robots.txt loader] Failed to resolve tenant — Sitemap directive will be empty:", err);
  }

  const content = buildRobotsContent(origin);

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Short TTL: crawlers may cache this, but it should refresh daily.
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}

// ---------------------------------------------------------------------------
// Content builder
// ---------------------------------------------------------------------------

/**
 * Build the robots.txt content string.
 *
 * Structure (per §10.4 of the migration plan):
 * - Named allow-all blocks for search/AI crawlers (Googlebot, Google-Extended,
 *   GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot).
 * - A wildcard block allowing all with targeted Disallow for private paths.
 * - A Sitemap directive using the tenant's canonical origin.
 */
function buildRobotsContent(origin: string): string {
  const sitemapLine = origin ? `Sitemap: ${origin}/sitemap.xml` : "";

  const lines: string[] = [
    // --- Explicitly allowed crawlers (search + AI) ---
    "User-agent: Googlebot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    // --- Wildcard: allow all but disallow private SPA-only paths ---
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /superAdmin",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /profile",
  ];

  if (sitemapLine) {
    lines.push("");
    lines.push(sitemapLine);
  }

  return lines.join("\n") + "\n";
}
