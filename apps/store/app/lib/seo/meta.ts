/**
 * meta.ts — helpers to build React Router v7 `meta` descriptor arrays.
 *
 * React Router's route module `meta` export must return an array of MetaDescriptor
 * objects. This module provides typed builder helpers for the shapes used across
 * the prerendered public routes (home, product, catalog, terms, discounts).
 *
 * Note: meta is REPLACED (not merged) across the route hierarchy — the last
 * matching route's array wins. Each route must include everything it needs.
 *
 * See: https://reactrouter.com/start/framework/route-module#meta
 */

// ---------------------------------------------------------------------------
// MetaDescriptor type (mirrors React Router's internal type without importing
// framework internals at runtime — keeps this file Node/edge-safe).
// ---------------------------------------------------------------------------

export type MetaDescriptor =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string; [key: string]: string }
  | { charSet: string }
  | { [name: string]: unknown };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Build a <title> descriptor. */
export function titleMeta(title: string): MetaDescriptor {
  return { title };
}

/** Build a <meta name="description"> descriptor. */
export function descriptionMeta(content: string): MetaDescriptor {
  return { name: "description", content };
}

/** Build a <link rel="canonical"> descriptor. */
export function canonicalMeta(href: string): MetaDescriptor {
  return { tagName: "link", rel: "canonical", href };
}

/** Build an Open Graph <meta property="..."> descriptor. */
function ogMeta(property: string, content: string): MetaDescriptor {
  return { property: `og:${property}`, content };
}

// ---------------------------------------------------------------------------
// Per-route builders
// ---------------------------------------------------------------------------

interface BaseRouteMetaOptions {
  /** Canonical origin, e.g. "https://balasistore.com" */
  canonicalOrigin: string;
  /** The canonical path for this route, e.g. "/products/abc123" */
  canonicalPath: string;
  /** Store display name appended to titles, e.g. "Balasi Store" */
  storeName: string;
}

/**
 * Build the meta array for the home page.
 */
export function buildHomeMeta(opts: BaseRouteMetaOptions): MetaDescriptor[] {
  const { canonicalOrigin, canonicalPath, storeName } = opts;
  const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
  return [
    titleMeta(storeName),
    descriptionMeta(`${storeName} — חנות אונליין`),
    canonicalMeta(canonicalUrl),
    ogMeta("title", storeName),
    ogMeta("type", "website"),
    ogMeta("url", canonicalUrl),
  ];
}

interface ProductMetaOptions extends BaseRouteMetaOptions {
  productName: string;
  productDescription: string;
  /** Absolute URL of the product image (optional). */
  imageUrl?: string;
}

/**
 * Build the meta array for a product page.
 */
export function buildProductMeta(opts: ProductMetaOptions): MetaDescriptor[] {
  const { canonicalOrigin, canonicalPath, storeName, productName, productDescription, imageUrl } =
    opts;
  const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
  const fullTitle = `${productName} | ${storeName}`;
  const descriptors: MetaDescriptor[] = [
    titleMeta(fullTitle),
    descriptionMeta(productDescription || productName),
    canonicalMeta(canonicalUrl),
    ogMeta("title", fullTitle),
    ogMeta("type", "product"),
    ogMeta("url", canonicalUrl),
  ];
  if (imageUrl) {
    descriptors.push(ogMeta("image", imageUrl));
  }
  return descriptors;
}

interface CatalogMetaOptions extends BaseRouteMetaOptions {
  categoryName: string;
}

/**
 * Build the meta array for a catalog (category) page.
 */
export function buildCatalogMeta(opts: CatalogMetaOptions): MetaDescriptor[] {
  const { canonicalOrigin, canonicalPath, storeName, categoryName } = opts;
  const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
  const fullTitle = `${categoryName} | ${storeName}`;
  return [
    titleMeta(fullTitle),
    descriptionMeta(`${categoryName} — ${storeName}`),
    canonicalMeta(canonicalUrl),
    ogMeta("title", fullTitle),
    ogMeta("type", "website"),
    ogMeta("url", canonicalUrl),
  ];
}

/**
 * Build the meta array for the terms page.
 */
export function buildTermsMeta(opts: BaseRouteMetaOptions): MetaDescriptor[] {
  const { canonicalOrigin, canonicalPath, storeName } = opts;
  const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
  const title = `תנאי שימוש | ${storeName}`;
  return [
    titleMeta(title),
    descriptionMeta(`תנאי שימוש של ${storeName}`),
    canonicalMeta(canonicalUrl),
    ogMeta("title", title),
    ogMeta("type", "website"),
    ogMeta("url", canonicalUrl),
  ];
}

/**
 * Build the meta array for the discounts page.
 */
export function buildDiscountsMeta(opts: BaseRouteMetaOptions): MetaDescriptor[] {
  const { canonicalOrigin, canonicalPath, storeName } = opts;
  const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
  const title = `מבצעים | ${storeName}`;
  return [
    titleMeta(title),
    descriptionMeta(`מבצעים ועסקאות מיוחדות ב${storeName}`),
    canonicalMeta(canonicalUrl),
    ogMeta("title", title),
    ogMeta("type", "website"),
    ogMeta("url", canonicalUrl),
  ];
}
