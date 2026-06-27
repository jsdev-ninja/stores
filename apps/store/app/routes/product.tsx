/**
 * product.tsx — React Router v7 route module for "/products/:id".
 *
 * Build-time: loader fetches the product from Firestore and bakes
 * Product+Offer JSON-LD + BreadcrumbList + per-route meta into the static
 * HTML for crawlers / AI bots.
 *
 * Runtime (human browser): clientLoader.hydrate = true re-fetches LIVE price
 * and stock from Firestore so the user always sees current data even though
 * the prerendered HTML is a build-time snapshot.
 *
 * Money convention: product.price is stored as INTEGER AGOROT.
 * JSON-LD Offer.price = agorot / 100.  Conversion is done by buildProductJsonLd.
 * Never convert upstream.
 */

import type { Route } from "./+types/product";
import {
  resolveTenant,
  getProductForPrerender,
} from "app/lib/prerender/tenantData.server";
import {
  buildProductJsonLd,
  buildBreadcrumbListJsonLd,
  serialiseJsonLd,
} from "app/lib/seo/jsonLd";
import { buildProductMeta } from "app/lib/seo/meta";
import App from "src/app/App";

// ---------------------------------------------------------------------------
// Loader — runs AT BUILD TIME only (ssr: false + prerender).
// Do NOT use browser globals here. Reads from Firestore via tenant server module.
// ---------------------------------------------------------------------------

export async function loader({ params }: Route.LoaderArgs) {
  const target = process.env["VITE_STORE_TARGET"];

  const productId = params.id;

  // resolveTenant may fail when prerendering stub paths (e.g. /products/_prerender)
  // during degraded builds where Firestore is unreachable. Return minimal fallback
  // data so the stub prerender succeeds without crashing the build.
  let ctx: Awaited<ReturnType<typeof resolveTenant>>;
  try {
    ctx = await resolveTenant(target);
  } catch (err) {
    console.warn("[product loader] Failed to resolve tenant — returning empty stub data:", err);
    return {
      canonicalOrigin: "",
      storeName: "",
      productId: productId ?? "_prerender",
      productName: "",
      productDescription: "",
      imageUrl: undefined as string | undefined,
      product: null,
    };
  }

  if (!productId || productId === "_prerender") {
    // Stub path injected during degraded builds — return empty data.
    return {
      canonicalOrigin: ctx.origin,
      storeName: ctx.storeId,
      productId: "_prerender",
      productName: "",
      productDescription: "",
      imageUrl: undefined as string | undefined,
      product: null,
    };
  }

  const product = await getProductForPrerender(ctx, productId);

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  // Derive display values from locale arrays.
  const name =
    product.name?.find((l) => l.lang === "he")?.value ??
    product.name?.[0]?.value ??
    productId;

  const description =
    product.description?.find((l) => l.lang === "he")?.value ??
    product.description?.[0]?.value ??
    "";

  const imageUrl: string | undefined = product.images?.[0]?.url ?? undefined;

  return {
    canonicalOrigin: ctx.origin,
    storeName: ctx.storeId,
    productId,
    productName: name,
    productDescription: description,
    imageUrl,
    // Pass the full product so JSON-LD builder has access to price / stock.
    product,
  };
}

// ---------------------------------------------------------------------------
// meta — replaces the entire route <head> meta (RR7: not merged).
// ---------------------------------------------------------------------------

export function meta({ data, params }: Route.MetaArgs) {
  if (!data) {
    return [{ title: params.id ?? "מוצר" }];
  }

  return buildProductMeta({
    canonicalOrigin: data.canonicalOrigin,
    canonicalPath: `/products/${data.productId}`,
    storeName: data.storeName,
    productName: data.productName,
    productDescription: data.productDescription,
    imageUrl: data.imageUrl,
  });
}

// ---------------------------------------------------------------------------
// clientLoader — runs in the BROWSER (not at build time).
// hydrate = true means it also runs on the INITIAL load so the human visitor
// always sees current price/stock, not the build-time snapshot.
// ---------------------------------------------------------------------------

export async function clientLoader({
  serverLoader,
}: Route.ClientLoaderArgs) {
  // serverLoader() fetches this product's prerendered ".data". That file only
  // exists for PRERENDERED product paths. For any non-prerendered product the
  // static host serves the SPA-fallback HTML instead, which cannot be decoded
  // as a turbo-stream and throws ("Unable to decode turbo-stream response").
  // The product UI + live price/stock come from the Redux store / appApi
  // (ProductPage useEffect → getProductById), so on failure we return empty
  // SEO data and let <App/> render the page client-side.
  try {
    return await serverLoader();
  } catch {
    return {
      canonicalOrigin: "",
      storeName: "",
      productId: "",
      productName: "",
      productDescription: "",
      imageUrl: undefined as string | undefined,
      product: null,
    };
  }
}

clientLoader.hydrate = true as const;

// ---------------------------------------------------------------------------
// HydrateFallback — shown while clientLoader resolves on initial load.
// Matches the global spinner used throughout the app.
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

export default function ProductRoute({ loaderData }: Props) {
  // product is null for stub prerender paths (_prerender) or when tenant
  // resolution degraded. Skip JSON-LD emission for stubs — the stubs are never
  // served to real users or crawlers.
  const productJsonLd = loaderData.product
    ? buildProductJsonLd(loaderData.product, loaderData.canonicalOrigin)
    : null;

  const breadcrumbJsonLd =
    loaderData.canonicalOrigin && loaderData.productName
      ? buildBreadcrumbListJsonLd([
          { name: "בית", url: `${loaderData.canonicalOrigin}/` },
          {
            name: loaderData.productName,
            url: `${loaderData.canonicalOrigin}/products/${loaderData.productId}`,
          },
        ])
      : null;

  return (
    <>
      {/* Product + Offer JSON-LD. React 19 hoists <script> to <head>. */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serialiseJsonLd(productJsonLd) }}
        />
      )}
      {/* BreadcrumbList JSON-LD */}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serialiseJsonLd(breadcrumbJsonLd) }}
        />
      )}
      {/*
       * Full App — custom router reads current URL (Strategy B) and renders
       * the ProductPage for this path.
       */}
      <App />
    </>
  );
}
