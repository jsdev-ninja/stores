/**
 * tenantData.server.ts — build-time data layer for prerender
 *
 * Standalone Node module. Must NOT import anything that touches browser globals
 * (window, document, navigator, etc.) or React hooks.
 *
 * Uses the CLIENT Firebase SDK in Node — unauthenticated reads of
 * products/categories work because there is no firestore.rules file in the repo.
 * If rules are added later, switch to Admin SDK with a CI service-account secret.
 *
 * Tenant isolation: HARD RULE — every Firestore path is built via
 * FirebaseAPI.firestore.getPath(). No hand-built paths. No root collections.
 * One build = one tenant = one {companyId, storeId}.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  type QueryConstraint,
} from "firebase/firestore";
import { FirebaseAPI, type TCategory, type TProduct } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Canonical origin per VITE_STORE_TARGET. Used to resolve tenant from Firestore. */
const STORE_TARGET_ORIGINS: Record<string, string> = {
  tester: "https://jsdev-stores-prod.web.app",
  balasistore: "https://balasistore.com",
  pecanis: "https://pecanis.online",
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAXtA4pdBs7GLX45lK3jYZRiUwo7M06-_s",
  authDomain: "jsdev-stores-prod.firebaseapp.com",
  projectId: "jsdev-stores-prod",
  storageBucket: "jsdev-stores-prod.appspot.com",
  messagingSenderId: "333321054844",
  appId: "1:333321054844:web:7d3c15617daa54107537f9",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantContext {
  companyId: string;
  storeId: string;
  tenantId: string;
  /** Canonical origin, e.g. "https://balasistore.com" */
  origin: string;
}

// ---------------------------------------------------------------------------
// Firebase singleton (Node-safe — no browser APIs)
// ---------------------------------------------------------------------------

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(FIREBASE_CONFIG);
}

// ---------------------------------------------------------------------------
// Tenant resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the active tenant from VITE_STORE_TARGET.
 *
 * Queries Firestore `STORES` collection (system-level, same query as init.ts)
 * to find the store whose `urls` contains the target's canonical origin, then
 * `COMPANIES` to find the matching company. Returns {companyId, storeId, tenantId, origin}.
 *
 * Throws if VITE_STORE_TARGET is missing or unrecognised — this is a build
 * misconfiguration and should fail the build explicitly.
 */
export async function resolveTenant(target?: string): Promise<TenantContext> {
  const storeTarget = target ?? process.env["VITE_STORE_TARGET"];
  if (!storeTarget) {
    throw new Error(
      "[prerender] VITE_STORE_TARGET is not set. " +
        "Run: VITE_STORE_TARGET=tester react-router build"
    );
  }

  const origin = STORE_TARGET_ORIGINS[storeTarget];
  if (!origin) {
    throw new Error(
      `[prerender] Unknown VITE_STORE_TARGET "${storeTarget}". ` +
        `Valid values: ${Object.keys(STORE_TARGET_ORIGINS).join(", ")}`
    );
  }

  const app = getFirebaseApp();
  const db = getFirestore(app);

  // Query STORES collection (system-level, NOT tenant-scoped).
  // Mirror of the query in src/app/init.ts.
  const storesCollection = FirebaseAPI.firestore.systemCollections.stores; // "STORES"
  const storeQ = query(
    collection(db, storesCollection),
    where("urls", "array-contains", origin),
    limit(1)
  );
  const storeSnap = await getDocs(storeQ);
  if (storeSnap.empty) {
    throw new Error(
      `[prerender] No store found for origin "${origin}" (target: "${storeTarget}"). ` +
        "Check that the store's urls array in Firestore contains this origin."
    );
  }
  const storeDoc = storeSnap.docs[0]!;
  const storeData = storeDoc.data();
  const storeId = storeDoc.id;
  const companyId: string = storeData["companyId"];
  const tenantId: string = storeData["tenantId"];

  if (!companyId || !tenantId) {
    throw new Error(
      `[prerender] Store "${storeId}" is missing companyId or tenantId in Firestore.`
    );
  }

  return { companyId, storeId, tenantId, origin };
}

// ---------------------------------------------------------------------------
// Path enumeration helpers
// ---------------------------------------------------------------------------

/**
 * Collect all slug paths from a category tree (depth-first).
 *
 * A category path is formed by joining `id` values from root to the node,
 * separated by "/". E.g. for hierarchy root→wine→red the path is:
 *   /catalog/wine/red
 *
 * The slug is derived from each category's id (which is already URL-friendly
 * in Firestore data). Locale names are NOT used as URL slugs to keep paths
 * stable across locale changes.
 */
/**
 * A URL path segment is safe to prerender only if it has no whitespace,
 * slashes, or control characters. Dirty Firestore ids (e.g. a barcode imported
 * with a leading tab) otherwise produce a path React Router cannot match, and
 * `ssr:false` prerendering fails the ENTIRE build on that single 404. Such ids
 * are skipped here — the page still works for users via the SPA fallback.
 */
function isUrlSafeSegment(id: string): boolean {
  return !!id && !/[\s/\\#?%]/.test(id);
}

function collectCategoryPaths(categories: TCategory[], ancestors: string[] = []): string[] {
  const paths: string[] = [];
  for (const cat of categories) {
    if (!isUrlSafeSegment(cat.id)) {
      console.warn(`[prerender] Skipping category with URL-unsafe id: ${JSON.stringify(cat.id)}`);
      continue;
    }
    const crumbs = [...ancestors, cat.id];
    paths.push(`/catalog/${crumbs.join("/")}`);
    if (cat.children && cat.children.length > 0) {
      paths.push(...collectCategoryPaths(cat.children, crumbs));
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Main export: getTenantStaticPaths
// ---------------------------------------------------------------------------

/**
 * Enumerate all prerender paths for the active tenant.
 *
 * Returns:
 *   - Static public paths: "/", "/terms", "/discounts"
 *   - Category paths: "/catalog/{id}" for each category (tree-walked)
 *   - Product paths: "/products/{id}" for each product in the collection
 *     (capped by PRERENDER_PRODUCT_LIMIT env var; unlimited if unset or 0)
 *
 * RESILIENT: any Firestore failure degrades gracefully with a console.warn —
 * never throws. The build continues with only static paths.
 *
 * IMPORTANT: React Router v7 with ssr:false requires that every route that
 * exports a `loader` must be present in the prerendered paths set. The dynamic
 * routes (catalog, product) always export a `loader`, so we must include at
 * least one path per dynamic route even in degraded mode. The loaders are
 * written to be resilient — they return empty fallback data when tenant
 * resolution fails, so prerendering these stubs never fails the build.
 */
export async function getTenantStaticPaths(target?: string): Promise<string[]> {
  const staticPaths = ["/", "/terms", "/discounts"];

  // Stub paths ensure the `catalog` and `product` route modules (which export
  // `loader`) are always included in the prerendered set, satisfying React
  // Router's ssr:false validation even when Firestore data is unavailable.
  // The loaders for these stubs return graceful empty data on tenant failure.
  const dynamicStubPaths = ["/catalog/_prerender", "/products/_prerender"];

  let ctx: TenantContext;
  try {
    ctx = await resolveTenant(target);
  } catch (err) {
    console.warn(
      "[prerender] Failed to resolve tenant — degrading to static paths + stubs only.\n",
      err
    );
    return [...staticPaths, ...dynamicStubPaths];
  }

  const productLimit = (() => {
    const raw = process.env["PRERENDER_PRODUCT_LIMIT"];
    if (!raw) return undefined; // unlimited
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();

  const [categoryPaths, productPaths] = await Promise.all([
    fetchCategoryPaths(ctx).catch((err) => {
      console.warn("[prerender] Failed to fetch category paths — skipping catalog paths.\n", err);
      return [] as string[];
    }),
    fetchProductPaths(ctx, productLimit).catch((err) => {
      console.warn("[prerender] Failed to fetch product paths — skipping product paths.\n", err);
      return [] as string[];
    }),
  ]);

  // Always include the dynamic stub paths so that route modules which export
  // `loader` are always in the prerendered set (React Router v7 ssr:false
  // constraint).  Use a Set to de-duplicate when real paths already exist.
  const allPaths = new Set([
    ...staticPaths,
    ...dynamicStubPaths,
    ...categoryPaths,
    ...productPaths,
  ]);
  return Array.from(allPaths);
}

// ---------------------------------------------------------------------------
// Internal Firestore fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch the single categories document and return all /catalog/... paths.
 * Path: {companyId}/{storeId}/categories/categories
 */
async function fetchCategoryPaths(ctx: TenantContext): Promise<string[]> {
  const app = getFirebaseApp();
  const db = getFirestore(app);

  const collectionPath = FirebaseAPI.firestore.getPath({
    companyId: ctx.companyId,
    storeId: ctx.storeId,
    collectionName: "categories",
  });

  const docRef = doc(db, collectionPath, "categories");
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    console.warn("[prerender] categories/categories doc not found — no catalog paths.");
    return [];
  }

  const data = snap.data();
  const categories: TCategory[] = Array.isArray(data?.["categories"]) ? data["categories"] : [];
  return collectCategoryPaths(categories);
}

/**
 * Enumerate all published product ids from the products collection and return
 * /products/{id} paths.
 * Collection path: {companyId}/{storeId}/products
 */
async function fetchProductPaths(
  ctx: TenantContext,
  productLimit?: number
): Promise<string[]> {
  const app = getFirebaseApp();
  const db = getFirestore(app);

  const collectionPath = FirebaseAPI.firestore.getPath({
    companyId: ctx.companyId,
    storeId: ctx.storeId,
    collectionName: "products",
  });

  const constraints: QueryConstraint[] = [where("isPublished", "==", true)];
  if (productLimit !== undefined) {
    constraints.push(limit(productLimit));
  }

  const q = query(collection(db, collectionPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.id)
    .filter((id) => {
      if (isUrlSafeSegment(id)) return true;
      console.warn(`[prerender] Skipping product with URL-unsafe id: ${JSON.stringify(id)}`);
      return false;
    })
    .map((id) => `/products/${id}`);
}

// ---------------------------------------------------------------------------
// Per-route data helpers (used by route loaders)
// ---------------------------------------------------------------------------

/**
 * Fetch a single product for prerendering.
 * Returns null if not found.
 */
export async function getProductForPrerender(
  ctx: TenantContext,
  id: string
): Promise<TProduct | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);

  const collectionPath = FirebaseAPI.firestore.getPath({
    companyId: ctx.companyId,
    storeId: ctx.storeId,
    collectionName: "products",
  });

  const docRef = doc(db, collectionPath, id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TProduct;
}

/**
 * Fetch products belonging to a category for prerendering a catalog page.
 *
 * @param path — the full catalog path, e.g. "/catalog/wine/red". The leaf
 *   category id (last segment) is used to filter products via
 *   `categoryIds array-contains`.
 *
 * Uses Firestore `array-contains` on `categoryIds`.
 */
export async function getCategoryProductsForPrerender(
  ctx: TenantContext,
  path: string,
  fetchLimit = 100
): Promise<TProduct[]> {
  // Extract the leaf category id from the path: "/catalog/wine/red" → "red"
  const segments = path.replace(/^\/catalog\//, "").split("/");
  const categoryId = segments[segments.length - 1];
  if (!categoryId) {
    console.warn(`[prerender] getCategoryProductsForPrerender: cannot parse categoryId from path "${path}"`);
    return [];
  }

  const app = getFirebaseApp();
  const db = getFirestore(app);

  const collectionPath = FirebaseAPI.firestore.getPath({
    companyId: ctx.companyId,
    storeId: ctx.storeId,
    collectionName: "products",
  });

  const q = query(
    collection(db, collectionPath),
    where("isPublished", "==", true),
    where("categoryIds", "array-contains", categoryId),
    limit(fetchLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TProduct));
}
