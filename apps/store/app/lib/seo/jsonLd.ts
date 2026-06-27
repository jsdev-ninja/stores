/**
 * jsonLd.ts — Schema.org JSON-LD builders for prerendered routes.
 *
 * Money convention: all monetary amounts in Firestore are stored as INTEGER
 * AGOROT (1 ILS = 100 agorot). JSON-LD Offer.price MUST be in SHEKELS.
 * Convert ONLY here at this boundary: price = agorot / 100.
 * Never store or pass floats upstream.
 *
 * These functions return plain objects (not serialised strings) so callers
 * can embed them however they like (script tag, meta array, etc.).
 */

import type { TProduct, TCategory } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// Money helper
// ---------------------------------------------------------------------------

/**
 * Convert integer agorot to a shekel string suitable for JSON-LD Offer.price.
 * e.g. 1999 → "19.99", 100 → "1.00"
 */
export function agorotToShekels(agorot: number): string {
  return (agorot / 100).toFixed(2);
}

// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

/**
 * Extract the Hebrew locale value from a locale array.
 * Falls back to the first item's value if no Hebrew entry exists.
 */
function localeValue(locales: Array<{ lang: string; value: string }>): string {
  return (
    locales.find((l) => l.lang === "he")?.value ??
    locales[0]?.value ??
    ""
  );
}

// ---------------------------------------------------------------------------
// JSON-LD shapes
// ---------------------------------------------------------------------------

export interface ProductJsonLd {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  image: string[];
  description: string;
  sku: string;
  brand: {
    "@type": "Brand";
    name: string;
  };
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: "ILS";
    /** Shekel string, 2 decimal places — converted from agorot at this boundary. */
    price: string;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
  };
}

export interface OrganizationJsonLd {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
}

export interface BreadcrumbListJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Build a Product + Offer JSON-LD object for a product page.
 *
 * @param product — TProduct from Firestore (price is integer agorot)
 * @param canonicalOrigin — e.g. "https://balasistore.com"
 */
export function buildProductJsonLd(product: TProduct, canonicalOrigin: string): ProductJsonLd {
  const name = localeValue(product.name);
  const description = localeValue(product.description);
  const imageUrl = product.images?.[0]?.url ?? "";

  // stock: undefined means no stock tracking → treat as InStock
  const inStock =
    product.stock === undefined || product.stock === null
      ? true
      : product.stock.quantity > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: imageUrl ? [imageUrl] : [],
    description,
    sku: product.sku ?? product.id,
    brand: {
      "@type": "Brand",
      name: product.brand ?? "",
    },
    offers: {
      "@type": "Offer",
      url: `${canonicalOrigin}/products/${product.id}`,
      priceCurrency: "ILS",
      // Convert agorot → shekels ONLY at this JSON-LD boundary.
      price: agorotToShekels(product.price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

/**
 * Build an Organization JSON-LD object for the home page.
 *
 * @param storeName — display name of the store/company
 * @param canonicalOrigin — e.g. "https://balasistore.com"
 * @param logoUrl — absolute URL to the store logo
 */
export function buildOrganizationJsonLd(
  storeName: string,
  canonicalOrigin: string,
  logoUrl: string
): OrganizationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: canonicalOrigin,
    logo: logoUrl,
  };
}

/**
 * Build a BreadcrumbList JSON-LD for catalog and product pages.
 *
 * @param items — ordered list of {name, url} pairs; position is auto-numbered from 1.
 */
export function buildBreadcrumbListJsonLd(
  items: Array<{ name: string; url: string }>
): BreadcrumbListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build BreadcrumbList for a catalog path.
 *
 * @param categoryChain — ordered list of categories from root to current (inclusive)
 * @param canonicalOrigin — e.g. "https://balasistore.com"
 */
export function buildCategoryBreadcrumbJsonLd(
  categoryChain: TCategory[],
  canonicalOrigin: string
): BreadcrumbListJsonLd {
  const items: Array<{ name: string; url: string }> = [
    { name: "בית", url: `${canonicalOrigin}/` },
  ];

  let pathAcc = "";
  for (const cat of categoryChain) {
    pathAcc += `/${cat.id}`;
    items.push({
      name: localeValue(cat.locales),
      url: `${canonicalOrigin}/catalog${pathAcc}`,
    });
  }

  return buildBreadcrumbListJsonLd(items);
}

/**
 * Serialise a JSON-LD object to a string for embedding in a <script> tag.
 */
export function serialiseJsonLd(jsonLd: object): string {
  return JSON.stringify(jsonLd);
}
