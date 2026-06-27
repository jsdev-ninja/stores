/**
 * catalog.tsx — React Router v7 route module for "/catalog/:category1/:category2...".
 *
 * Up to 5 optional category segments (all optional after the first).
 * Path: /catalog/:category1?/:category2?/:category3?/:category4?/:category5?
 *
 * Build-time: loader fetches the category tree, resolves the category chain for
 * the current path, and bakes BreadcrumbList JSON-LD + meta into static HTML.
 *
 * Runtime: clientLoader.hydrate = true re-fetches the current category from
 * the Redux store (populated by App's useAppInit) so the UI is always fresh.
 * HydrateFallback covers the brief loading gap.
 */

import type { Route } from "./+types/catalog";
import { resolveTenant } from "app/lib/prerender/tenantData.server";
import {
  buildCategoryBreadcrumbJsonLd,
  serialiseJsonLd,
} from "app/lib/seo/jsonLd";
import { buildCatalogMeta } from "app/lib/seo/meta";
import type { TCategory } from "@jsdev_ninja/core";
import App from "src/app/App";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the category chain from the Firestore category tree.
 * Given [cat1id, cat2id, ...] walk the tree and collect the matching nodes.
 */
function resolveCategoryChain(
  categories: TCategory[],
  ids: string[]
): TCategory[] {
  const chain: TCategory[] = [];
  let current: TCategory[] = categories;

  for (const id of ids) {
    const found = current.find((c) => c.id === id);
    if (!found) break;
    chain.push(found);
    current = found.children ?? [];
  }

  return chain;
}

/** Extract the Hebrew locale value from a locale array. */
function localeValue(locales: Array<{ lang: string; value: string }>): string {
  return (
    locales.find((l) => l.lang === "he")?.value ?? locales[0]?.value ?? ""
  );
}

// ---------------------------------------------------------------------------
// Loader — runs AT BUILD TIME (prerender) and never at runtime (ssr: false).
// ---------------------------------------------------------------------------

export async function loader({ params }: Route.LoaderArgs) {
  const target = process.env["VITE_STORE_TARGET"];

  // Collect non-empty category id segments from the URL params.
  // Filter out the "_prerender" stub segment injected during degraded builds.
  const categoryIds = [
    params.category1,
    params.category2,
    params.category3,
    params.category4,
    params.category5,
  ].filter((s): s is string => !!s && s !== "_prerender");

  const canonicalPath = `/catalog/${categoryIds.join("/")}`;

  // resolveTenant may fail when prerendering stub paths (e.g. /catalog/_prerender)
  // during degraded builds where Firestore is unreachable. Return minimal fallback
  // data so the stub prerender succeeds without crashing the build.
  let ctx: Awaited<ReturnType<typeof resolveTenant>>;
  try {
    ctx = await resolveTenant(target);
  } catch (err) {
    console.warn("[catalog loader] Failed to resolve tenant — returning empty stub data:", err);
    return {
      canonicalOrigin: "",
      storeName: "",
      categoryName: categoryIds[categoryIds.length - 1] ?? "",
      categoryChain: [] as TCategory[],
      canonicalPath,
    };
  }

  // Fetch the category tree from Firestore (server module, tenant-scoped).
  let categories: TCategory[] = [];
  try {
    const { getFirestore, collection, doc, getDoc } = await import(
      "firebase/firestore"
    );
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { FirebaseAPI } = await import("@jsdev_ninja/core");

    const firebaseConfig = {
      apiKey: "AIzaSyAXtA4pdBs7GLX45lK3jYZRiUwo7M06-_s",
      authDomain: "jsdev-stores-prod.firebaseapp.com",
      projectId: "jsdev-stores-prod",
    };
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const collPath = FirebaseAPI.firestore.getPath({
      companyId: ctx.companyId,
      storeId: ctx.storeId,
      collectionName: "categories",
    });
    const snap = await getDoc(doc(collection(db, collPath), "categories"));
    if (snap.exists()) {
      const data = snap.data();
      categories = Array.isArray(data?.["categories"]) ? data["categories"] : [];
    }
  } catch (err) {
    console.warn("[catalog loader] Failed to fetch category tree:", err);
  }

  const chain = resolveCategoryChain(categories, categoryIds);
  const leafCategory = chain[chain.length - 1];
  const categoryName = leafCategory
    ? localeValue(leafCategory.locales)
    : categoryIds[categoryIds.length - 1] ?? "";

  return {
    canonicalOrigin: ctx.origin,
    storeName: ctx.storeId,
    categoryName,
    categoryChain: chain,
    canonicalPath,
  };
}

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

export function meta({ data, params }: Route.MetaArgs) {
  if (!data) {
    const segments = [
      params.category1,
      params.category2,
      params.category3,
      params.category4,
      params.category5,
    ].filter(Boolean);
    return [{ title: segments.join(" / ") || "קטלוג" }];
  }

  return buildCatalogMeta({
    canonicalOrigin: data.canonicalOrigin,
    canonicalPath: data.canonicalPath,
    storeName: data.storeName,
    categoryName: data.categoryName,
  });
}

// ---------------------------------------------------------------------------
// clientLoader — runs in the BROWSER (not at build time).
// hydrate = true means it runs on the INITIAL load (hydration), not just SPA nav.
// Delegates to the serverLoader for the baked snapshot, then merges.
// The Redux store (App useAppInit) refreshes the actual category products UI.
// ---------------------------------------------------------------------------

export async function clientLoader({
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  // serverLoader() fetches this path's prerendered ".data". That file only
  // exists for PRERENDERED catalog paths. For any non-prerendered path the
  // static host serves the SPA-fallback HTML instead, which cannot be decoded
  // as a turbo-stream and throws ("Unable to decode turbo-stream response").
  // The catalog UI is driven by the Redux store (App useAppInit); the loader
  // data here is purely SEO JSON-LD, which is irrelevant for a client-side
  // navigation (crawlers never client-navigate). So on failure we return empty
  // SEO data and let <App/> render the page client-side.
  try {
    return await serverLoader();
  } catch {
    const categoryIds = [
      params.category1,
      params.category2,
      params.category3,
      params.category4,
      params.category5,
    ].filter((s): s is string => !!s && s !== "_prerender");
    return {
      canonicalOrigin: "",
      storeName: "",
      categoryName: categoryIds[categoryIds.length - 1] ?? "",
      categoryChain: [] as TCategory[],
      canonicalPath: `/catalog/${categoryIds.join("/")}`,
    };
  }
}

clientLoader.hydrate = true as const;

// ---------------------------------------------------------------------------
// HydrateFallback — shown while clientLoader resolves on initial load
// ---------------------------------------------------------------------------

export function HydrateFallback() {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <svg
        aria-hidden="true"
        className="w-20 h-20 text-gray-200 animate-spin dark:text-gray-600 fill-red-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

type Props = Route.ComponentProps;

export default function CatalogRoute({ loaderData }: Props) {
  const breadcrumbJsonLd = buildCategoryBreadcrumbJsonLd(
    loaderData.categoryChain,
    loaderData.canonicalOrigin
  );

  return (
    <>
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serialiseJsonLd(breadcrumbJsonLd) }}
      />
      {/*
       * Full App — custom router reads current URL (Strategy B) and renders
       * the CatalogPage for this path.
       */}
      <App />
    </>
  );
}
