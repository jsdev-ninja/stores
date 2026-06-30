---
sidebar_position: 7
title: SEO/GEO Prerender Migration
description: Plan to make balasistore & pecanis visible to search engines (SEO) and AI answer engines (GEO) by migrating apps/store to React Router v7 framework mode with build-time prerender.
---

# SEO/GEO Migration Plan: SPA → Build-Time Prerender (React Router v7 Framework Mode)

> **Status:** Proposed (one-shot feature branch). **Audience:** Philip (developer) + David (store owner, see Executive Summary). **Scope:** `apps/store` only. **Goal:** make storefront pages visible to search engines and AI answer engines without changing business logic, by emitting real HTML at build time and keeping everything else a SPA.

---

## 1. Executive Summary (plain language, for the store owner)

**The problem.** When Google, Bing, or an AI assistant (ChatGPT, Perplexity, Claude, Google's AI) visits our store, they get an **empty page**. Our store is built as a "single-page app": the real content (products, prices, descriptions) is drawn by the browser *after* the page loads, using JavaScript. Search engines and especially AI engines often **do not run that JavaScript**, so they see a blank shell with no title, no description, and no product information. We checked this live on **balasistore.com** and confirmed it: the page they receive is essentially empty.

**Why it matters.** This makes the store **partially invisible to Google** (hurts SEO — Search Engine Optimization) and **almost entirely invisible to AI answer engines** (hurts GEO — Generative Engine Optimization, i.e. being cited by ChatGPT/Perplexity/etc.). When a shopper asks an AI "where can I buy X in Israel," our store cannot be recommended because the AI never saw our products.

**The fix.** We will pre-build a **real, fully-written HTML version of the public pages** (home page, category/catalog pages, product pages, terms, discounts) at build time. Each page will carry a proper title, description, and machine-readable product data (price, availability) that search engines and AI engines can read instantly — no JavaScript required. Everything private (cart, checkout, account, the entire admin panel) **stays exactly as it is today** and is untouched.

**What changes for shoppers.** Nothing visible breaks. Pages will actually load *faster* for first-time visitors, and the moment the page comes alive in the browser it **re-checks live price and stock**, so customers always see correct, current numbers even though the pre-built HTML is a snapshot.

**Expected outcome.**
- **SEO:** Google/Bing can index every product and category with correct titles, descriptions, and structured product data → better ranking, rich results (price/availability shown in search), real `robots.txt` and `sitemap.xml`.
- **GEO:** AI engines (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended) can finally read and cite our catalog → the store becomes eligible to appear in AI shopping answers.

**Rollout safety.** We build and prove the whole thing on a throwaway **tester** site first. We only flip each real store (balasistore, then pecanis) live as a **separate, explicitly-approved step**. If anything looks wrong, we roll back instantly to today's version.

> **Note for David:** this change touches how the site is *built and shipped*, which is a developer-level change. It needs Philip's approval before any store goes live. We've documented it so he can review.

---

## 2. Background & Evidence

### 2.1 Why an SPA is invisible to crawlers and AI

`apps/store` is a **client-rendered single-page app (SPA)**: React 19 + Vite, mounted into an empty `<div id="root">`. The HTML the server sends contains **no content** — content is produced only after the browser downloads and executes the JS bundle, resolves the tenant (store) from `window.location.origin`, queries Firestore, and renders.

A crawler or AI bot that does **not** execute JavaScript (or executes it unreliably, or budgets very little time for it) sees only the empty shell. Modern Googlebot *can* render JS, but does so on a deferred, rate-limited "second wave," and many other consumers — Bing's deeper crawl, social unfurlers, and **all AI crawlers** — typically do not render JS at all for indexing.

### 2.2 Live evidence from balasistore.com (verified)

| Signal | Observed | Should be |
|---|---|---|
| HTML payload size | ~2,613 bytes | Full document with content |
| `<html lang>` | `lang="en"` | `lang="he" dir="rtl"` |
| `<title>` | absent | per-page title |
| `<meta name="description">` | absent | per-page description |
| `<link rel="canonical">` | absent | per-page canonical |
| JSON-LD structured data | absent | Product/Offer, Organization, BreadcrumbList |
| Text inside `#root` | **0 characters** | full rendered page |
| `/robots.txt` | SPA fallback (not a real file) | real robots.txt |
| `/sitemap.xml` | SPA fallback (not a real file) | real sitemap |

A non-JS fetch of the homepage returns the empty shell. GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended all fall into the "no JS execution" bucket → they get **nothing**.

### 2.3 SEO vs GEO — the distinction

- **SEO (Search Engine Optimization):** being found and ranked by traditional search (Google, Bing). Partially salvageable today because Googlebot *can* render JS on a delay — but degraded, slow, and missing structured data / canonical / sitemap.
- **GEO (Generative Engine Optimization):** being read and **cited by AI answer engines** (ChatGPT, Perplexity, Claude, Google AI Overviews). These bots overwhelmingly **do not run JS**. Today our GEO surface is **near zero**. This is the larger strategic loss: AI-mediated shopping discovery is growing and we are absent from it.

Prerendered HTML fixes **both**, and is the *only* thing that fixes GEO.

---

## 3. React Router v7 Modes Explained

React Router v7 has **three additive modes**. Each builds on the previous, adding capability in exchange for ceding some architectural control.

| Mode | Entry API | Adds | Has prerender/SSG? |
|---|---|---|---|
| **Declarative** | `<BrowserRouter>` + `<Routes>/<Route>` | URL→component matching, `Link`, `useNavigate`, `useLocation`, `useParams`, active states | ❌ |
| **Data** | `createBrowserRouter()` + `<RouterProvider>` | `loader`/`action`, `useLoaderData`, `useNavigation` (pending UI), `useFetcher`, `Form`, `redirect` | ❌ |
| **Framework** | `@react-router/dev` Vite plugin + `routes.ts` + `root.tsx` + `entry.client.tsx` | **Route Module API** (file exports `loader`/`clientLoader`/`meta`/`links`/`default`/`HydrateFallback`/`ErrorBoundary`), type-safe params/`loaderData`, automatic per-route code-splitting, `<Meta>/<Links>/<Scripts>/<ScrollRestoration>`, and **the SSR / SPA / SSG rendering strategies** | ✅ **only here** |

### 3.1 Why we need Framework mode

The capability we require — **build-time prerendering (SSG)** — is configured via the `prerender` option in `react-router.config.ts`, which is supplied by the `@react-router/dev` Vite plugin. **That plugin and that config file exist only in Framework mode.** There is no way to set `prerender` in Declarative or Data mode.

We also want the Framework-mode **Route Module API** to attach per-route SEO (`meta`, `links`) and the **`clientLoader.hydrate` + `HydrateFallback`** mechanism for live price/stock (see §11). None of these exist outside Framework mode.

> ⚠️ Important nuance: `loader`/`action` originate in **Data** mode — they are *not* Framework-exclusive. What is Framework-exclusive is the **route-module packaging** of them (file exports + generated `./+types/`), type safety, code-splitting, file routing, and the rendering strategies (SSR/SPA/**SSG**).

**Decision (Philip):** adopt **Framework mode** with `ssr: false` (SPA mode) + a partial `prerender` list. This is already decided — this document builds around it.

---

## 4. How Prerender + SPA Mode Works (the core question)

### 4.1 `ssr: false` = SPA Mode, but the root still renders at build time

Setting `ssr: false` disables **runtime** server rendering. It does **not** mean zero server rendering: React Router still **server-renders the ROOT route once, at build time**, to generate the `index.html` shell. That `index.html` is the SPA entry point / fallback — it renders only the root route so it can hydrate at runtime for any path.

```ts
// apps/store/react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false, // SPA Mode: no runtime SSR; root prerendered to index.html at build
} satisfies Config;
```

**Consequence (SPA Mode rule):** a server `loader` is allowed **only** on the root route **or** on routes you pre-render. Every other route must use **`clientLoader`** / `clientAction` (browser-only). For us this is fine: our prerendered public routes may use server `loader`s (they run at build time); all SPA-fallback routes use `clientLoader`.

### 4.2 The `prerender` option — three forms

`prerender` lives in `react-router.config.ts` and accepts:

```ts
// (a) boolean — pre-render all STATIC paths discovered from routes.ts
prerender: true

// (b) explicit array — including dynamically computed paths
prerender: ["/", "/terms", "/discounts", ...productIds.map(id => `/products/${id}`)]

// (c) async function — receives getStaticPaths(); append dynamic paths from a data source
async prerender({ getStaticPaths }) {
  const dynamic = await fetchPathsFromFirestore();
  return [...getStaticPaths(), ...dynamic];
}

// (d) object form — control build concurrency
prerender: { paths: ["/", ...], concurrency: 4 }
```

> ⚠️ `prerender: true` **only** covers static (non-param) paths. Dynamic param routes like `/products/:id` and `/catalog/:category…` **must** be enumerated explicitly via form (b) or (c). We use form (c).

### 4.3 Prerendering DYNAMIC param routes from a data source

This is exactly our case (products + categories live in Firestore):

```ts
// apps/store/react-router.config.ts
import type { Config } from "@react-router/dev/config";
import { enumerateTenantPaths } from "./prerender/enumerateTenantPaths"; // standalone Node fetcher (§9)

export default {
  appDirectory: "src",
  ssr: false,
  async prerender({ getStaticPaths }) {
    const { catalogPaths, productPaths } = await enumerateTenantPaths();
    return [
      ...getStaticPaths(),   // all static paths declared in routes.ts ("/", "/terms", "/discounts")
      ...catalogPaths,       // e.g. "/catalog/wine", "/catalog/wine/red", …
      ...productPaths,       // e.g. "/products/abc123", …
    ];
  },
} satisfies Config;
```

At build time, for each path React Router synthesizes a `new Request()`, runs it through the app, and **executes the same route `loader`** used in SSR. The resulting data is baked into a `.data` file. **No prerender-only API is needed.**

### 4.4 Prerender SOME pages, everything else stays SPA

With `ssr: false` + a **partial** `prerender` list:

- **Prerendered paths** each emit **two** artifacts into `build/client`:
  - `[url].html` — served for the initial document / hard navigation (this is what crawlers and AI bots read), and
  - `[url].data` — served for client-side SPA navigations to that route.
- **Non-prerendered paths** are served by a generated **SPA fallback HTML** that hydrates client-side and runs `clientLoader`s in the browser.

**SPA-fallback filename depends on whether `/` is in the prerender list** (we **do** prerender `/`):

| `/` prerendered? | Fallback file |
|---|---|
| No | `build/client/index.html` |
| **Yes (our case)** | `build/client/__spa-fallback.html` |

So the host must serve `__spa-fallback.html` (HTTP 200) for any unmatched/non-prerendered path. (Firebase Hosting rewrite — see §15.5.)

Example build output:
```
Prerender: Generated build/client/index.html              (home "/")
Prerender: Generated build/client/products/abc123/index.html
Prerender: Generated build/client/products/abc123.data
Prerender: Generated build/client/catalog/wine/index.html
Prerender: Generated build/client/__spa-fallback.html      (cart, checkout, admin, …)
```

> ⚠️ Loaders run at **build time** for prerendered paths → any data source they hit must be reachable during the build, and the baked `.data` is a **point-in-time snapshot** (stale until the next build). Freshness is handled in §11.

---

## 5. The Prerender + SPA Pattern We're Using

In one line: **`ssr: false` + a *partial* `prerender` list.** The handful of public routes are pre-rendered to real static HTML at build time; every other path is served the `__spa-fallback.html` shell and renders client-side exactly as today. Concretely for us:

- **Prerendered → real HTML for crawlers & AI:** `/`, `/catalog/:category1..:category5`, `/products/:id`, `/terms`, `/discounts`.
- **SPA fallback → unchanged behavior:** cart, checkout, orders, profile, favorites, payment pages, the entire admin panel, superAdmin, and `pay/:token`.
- **No SSR server involved:** the build emits static files only; we deploy them to Firebase Hosting per tenant (§6).

---

## 6. Target Architecture for `@jsdev-store`

### 6.1 Multi-tenant via per-tenant builds

The platform is multi-tenant; today the tenant is resolved at **runtime** from `window.location.origin`. Prerender happens at **build time** with **no browser and no `window`**, so we cannot resolve the tenant at runtime during prerender. Solution (decided): **one build per tenant**, selected by an env var.

```
VITE_STORE_TARGET = tester | balasistore | pecanis
```

- A standalone Node **build-time fetcher** reads **only that tenant's** `{companyId, storeId}` data from Firestore (tenant isolation is a HARD RULE — §9).
- The build prerenders that tenant's public paths and deploys to **that tenant's Firebase Hosting target**.
- Three sequential builds/deploys, never cross-reading.

```
VITE_STORE_TARGET=tester      → enumerate tester tenant   → build → deploy hosting target "tester"
VITE_STORE_TARGET=balasistore → enumerate balasistore     → build → deploy hosting target "balasistore"
VITE_STORE_TARGET=pecanis     → enumerate pecanis         → build → deploy hosting target "pecanis"
```

### 6.2 What is prerendered vs what stays SPA (authoritative list)

Grounded in `src/navigation/index.tsx`:

**PRERENDERED (public, SEO/GEO-critical):**

| Path | Route (current) | Notes |
|---|---|---|
| `/` | `store` (index / home) | static |
| `/terms` | `store.terms` | static |
| `/discounts` | `store.discounts` | static |
| `/catalog/:category1…:category5` | `store.catalog` | dynamic — enumerated from `categories/categories` |
| `/products/:id` | `store.product` | dynamic — enumerated from `products` collection |

**STAYS SPA FALLBACK (private / session / no SEO value):**

`/cart`, `/checkout`, `/orders`, `/orders/:id`, `/orderSuccess`, `/orderError`, `/payment-pending`, `/profile`, `/favorites-products`, **all ~30 `/admin/*` routes**, `/superAdmin`, `/pay/:token`.

> Rationale: these require a user session or are pure transactional/admin surfaces. They render empty/placeholder for anonymous users anyway and must **not** be exposed to crawlers (they're `Disallow`ed in robots.txt — §10.4).

### 6.3 Build + request flow (described)

**Build time (per tenant):**
```
VITE_STORE_TARGET=balasistore
        │
        ▼
enumerateTenantPaths()  ──reads──►  Firestore: {companyId}/{storeId}/categories  (single doc "categories")
   (standalone Node)                Firestore: {companyId}/{storeId}/products     (collection)
        │
        ▼
prerender() returns [ "/", "/terms", "/discounts", ...catalogPaths, ...productPaths ]
        │
        ▼
React Router prerender: for each path → new Request() → route loader runs (build time) → HTML + .data
        │
        ▼
build/client/  =  per-path *.html (with <title>/meta/JSON-LD/lang=he) + *.data + __spa-fallback.html
                  + robots.txt + sitemap.xml
        │
        ▼
firebase deploy --only hosting:balasistore
```

**Runtime (a real visitor):**
```
GET /products/abc123
   │
   ├─ crawler / AI bot (no JS):  receives products/abc123/index.html  →  full content + JSON-LD  ✅
   │
   └─ human browser:  receives same HTML  →  hydrates  →  clientLoader.hydrate re-fetches LIVE price/stock
                                          →  HydrateFallback shown briefly  →  correct current data ✅

GET /checkout   (not prerendered)
   │
   └─ host serves __spa-fallback.html (200)  →  hydrates  →  clientLoader runs in browser  →  SPA as today
```

---

## 7. Custom-Router Reconciliation

### 7.1 The situation

This repo does **not** use react-router. It uses a **hand-rolled router** in `src/lib/router/`, instantiated in `src/navigation/index.tsx` via `createRouter(routes)`, exporting a small public surface:

```
Link, Route, navigate, useParams, Redirect, useLocation   // src/navigation/index.tsx
```

- `Route` is **declarative** (`<Route name="store" index … />`) and used in `StoreLayout` / `AdminLayout` / `App.tsx` to render layouts conditionally.
- `Link` / `navigate` / `useParams` / `useLocation` / `Redirect` are used at hundreds of call sites (Sidebar, page components, auth guards, analytics).

Framework mode requires its **own** router (`routes.ts`, `root.tsx`, `<HydratedRouter>`). We must reconcile the two. Two strategies:

### 7.2 Strategy A — Hybrid zones (simpler fallback)

Run two routers side by side. React Router owns the prerendered public "zone"; the legacy custom router owns the SPA "zone" (admin, cart, etc.). Each prerendered route is its own real route module; the rest is mounted under a catch-all that renders the existing `<App/>`.

- **Pro:** smallest blast radius; the custom router internals are barely touched.
- **Con:** **navigation-boundary problem** — moving *between* zones (e.g. a `Link` from a product page into `/admin`, or from the SPA back to a prerendered product) crosses router ownership. Cross-zone navigation degrades to a **full page reload** (the two routers don't share history/state cleanly). Active states, scroll restoration, and view transitions break at the seam. Acceptable but visibly worse UX at the boundary.

### 7.3 Strategy B — Re-back the custom surface on react-router (RECOMMENDED)

Adopt Framework mode, then **re-implement the custom router's small public surface on top of react-router**, so existing call sites keep working unchanged.

**Step B0 — safe no-op boot.** Add a catch-all `*?` route that renders the existing `<App/>` verbatim:

```ts
// src/routes.ts
import { type RouteConfig, route } from "@react-router/dev/routes";
export default [
  route("*?", "catchall.tsx"),
] satisfies RouteConfig;
```
```tsx
// src/catchall.tsx — mount the entire existing app, behavior identical
export { default } from "./app/App";
```
At this point behavior is **identical** to today (the legacy router still drives everything inside `<App/>`). This is the no-break boot.

**Step B1 — re-back the public surface.** Re-implement the six exports from `src/navigation/index.tsx` on react-router primitives, keeping the **same signatures** so no call site changes:

| Custom export | Re-backed on react-router |
|---|---|
| `Link` (typed `to` + params) | wrap react-router `Link`; resolve route-name → path via existing `getRouteData`/`replaceParamsInPath` |
| `navigate(name, params, state)` | wrap `useNavigate()` (or a module-level `router.navigate`) + path resolution |
| `useParams(name)` | wrap react-router `useParams()` |
| `useLocation()` | adapt react-router `useLocation()` to the existing `[location, setLocation]` tuple shape |
| `Redirect` (imperative, returns null) | wrap react-router `<Navigate>` / `redirect()` |
| `Route` (declarative `<Route name= />`) | **convert call sites** to `routes.ts` entries (see B2) |

**Step B2 — convert declarative `<Route name>` usage into `routes.ts`.** The handful of `<Route name="…">` usages in `StoreLayout` / `AdminLayout` / `App.tsx` become real route-config entries. This is the only part that touches call sites beyond the router internals.

**Why B is recommended:**
- **One history, one router** → no navigation-boundary full reloads; `Link`/`navigate` work seamlessly between prerendered and SPA routes.
- Existing call sites (Sidebar, pages, guards, analytics `useLocation`) keep compiling against the **same import surface** — churn is concentrated in `src/navigation/index.tsx` + the router internals, not sprayed across the app.
- Unlocks per-route `meta`/`links`, type-safe params, and `clientLoader.hydrate` uniformly.
- Removes the brittle hand-rolled pub/sub store (`src/lib/router/store.tsx`) that is the #1 render-safety offender (§8).

**Cost:** higher "changed" file count (router internals + `<Route name>` call sites) — reflected in §12.

> **Recommendation: Strategy B.** Strategy A is the documented fallback if B's reconciliation proves too large within the one-shot window.

---

## 8. Render-Safety Prerequisites (must land FIRST)

Under SPA mode the **root route renders at BUILD time** (no DOM, no `window`). Any browser global touched at **module load** or **during render** crashes the prerender. These must be guarded **before** introducing Framework mode. Exhaustive list from the codebase findings:

| # | File:line | Offense | Guard |
|---|---|---|---|
| 1 | `src/lib/router/store.tsx` :46–48 | `window.location.pathname` ×3 at **module load** in `createStore()` | Lazy-init: read pathname inside an effect / on first client tick; default to `"/"` when `typeof window === "undefined"`. (Eliminated entirely if Strategy B replaces this store.) |
| 2 | `src/lib/router/store.tsx` :71–79 | `window.addEventListener("popstate")` + `window.location.pathname` at **module load** | Move listener registration into a client-only effect / guard with `typeof window`. |
| 3 | `src/lib/router/store.tsx` :91–95 | `document.startViewTransition` check/call in module-level `update()` | Feature-detect `typeof document !== "undefined" && document.startViewTransition`. |
| 4 | `src/widgets/Category/CategoryTree/utils.ts` :5 | `export const iOS = /…/.test(navigator.platform)` at **module load** | Wrap in a function or guard: `typeof navigator !== "undefined" ? … : false`. |
| 5 | `src/widgets/Category/CategoryTree/CategoryTree.tsx` :28 | same `navigator.platform` at module load (duplicate) | Same guard; **de-duplicate** — import the single guarded helper. |
| 6 | `src/widgets/Category/CategoryTree/Item/Item.tsx` :11 | same `navigator.platform` at module load (triplicate) | Same guard; import the shared helper, delete local copy. |
| 7 | `src/app/init.ts` :17–18, :22 | `window.location.origin` during `useAppInit()` render init | Defer to effect; in build/prerender, tenant comes from `VITE_STORE_TARGET` (§9), not `window`. |
| 8 | `src/app/init.ts` :38 | `window.location.href` during render init | Guard / move to effect. |
| 9 | `src/app/init.ts` :59–69 | `document.querySelector/createElement/getElementsByTagName/title/documentElement` during render init (favicon, `data-store-theme`) | Move all DOM writes into a client-only effect; `lang/dir/title` come from the route `meta`/`links` exports at build time instead. |
| 10 | `src/pages/store/ProductPage/index.tsx` :21 | `history.state?.product` in a **useState initializer** (runs during render) | Initialize from `loaderData`; read `history.state` only inside an effect, guarded. |
| 11 | `src/pages/store/OrderErrorPage/OrderErrorPage.tsx` :27, :43 | `window.location.href` during render + in effect deps | Parse query in an effect; guard `typeof window`. (Route is SPA-only, but still must not crash the bundle.) |
| 12 | `src/pages/store/OrderSuccessPage/OrderSuccessPage.tsx` :34, :51 | `window.location.href` during render + in effect deps | Same as #11. |

> `src/main.tsx :15` `document.getElementById("root")` is **acceptable** — it is the entry point and is being replaced anyway (Framework mode hydrates `document`, not `#root`).

**General rule going forward:** no browser global at module top-level or in a render path. Reads happen in effects, `clientLoader`, or behind `typeof window !== "undefined"`.

---

## 9. Build-Time Data & Tenant Isolation

### 9.1 Standalone Node fetcher

A build-time-only module (e.g. `apps/store/prerender/fetchTenantData.ts` + `enumerateTenantPaths.ts`) runs in Node during the build. It:

1. Resolves the active tenant **from `VITE_STORE_TARGET`**, not from any browser global — mapping `tester|balasistore|pecanis` → `{companyId, storeId}`.
2. Reads **only that tenant's**:
   - `categories/categories` — single Firestore doc `{ categories: TCategory[] }` at `{companyId}/{storeId}/categories` (id `"categories"`).
   - `products` — collection at `{companyId}/{storeId}/products`.
3. Enumerates `catalogPaths` (from the category tree) and `productPaths` (from product ids) for `prerender()`.
4. Supplies the same data to route `loader`s at build time so each page bakes in correct content + JSON-LD.

### 9.2 Tenant isolation — HARD RULE

- **Every** Firestore path is built via `FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName })` from `@jsdev_ninja/core`. **Never** hand-build a path, **never** a root collection.
- The fetcher reads **exactly one** `{companyId, storeId}` per build — the one selected by `VITE_STORE_TARGET`. No cross-tenant reads, ever. A build for `balasistore` must be incapable of touching `pecanis` data.
- This isolates per-tenant builds and matches the runtime isolation rule. Unit tests assert the fetcher cannot be invoked without a tenant and cannot read outside its scope (§14.1).

### 9.3 Money & timestamps at the JSON-LD boundary

- Monetary amounts are stored as **integer agorot**. JSON-LD `Offer.price` expects **shekels**. Convert **only at the JSON-LD boundary**: `price = agorot / 100` formatted to 2 decimals, `priceCurrency: "ILS"`. Never store/round floats upstream.
- Timestamps are **epoch millis**; convert to ISO 8601 only where a schema field (e.g. `priceValidUntil`) requires a date string.

---

## 10. SEO/GEO Assets

### 10.1 Per-route meta

Each prerendered route exports `meta` (rendered into `<head>` by `<Meta/>` in `root.tsx`). Note: meta is **replaced, not merged** across the hierarchy — the last matching route's array wins, so each route's `meta` must include everything it needs.

```tsx
// src/routes/product.tsx (meta export)
export function meta({ data }: Route.MetaArgs) {
  const p = data.product;
  return [
    { title: `${p.name} | ${data.storeName}` },
    { name: "description", content: p.shortDescription },
    { tagName: "link", rel: "canonical", href: `${data.canonicalOrigin}/products/${p.id}` },
    { property: "og:title", content: p.name },
    { property: "og:type", content: "product" },
  ];
}
```

### 10.2 `lang="he"` + `dir="rtl"`

Set in `root.tsx`'s `Layout`:
```tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><Meta /><Links /></head>
      <body>{children}<ScrollRestoration /><Scripts /></body>
    </html>
  );
}
```
This replaces the current build-time `document.title`/favicon/`data-store-theme` writes from `init.ts` — those become route `meta`/`links` + a client-only effect for theme.

### 10.3 JSON-LD shapes

Emitted in each route module (React 19 hoists `<script>` in JSX, or inject via `meta`). Examples:

**Product + Offer (product page):**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{product.name}",
  "image": ["{product.imageUrl}"],
  "description": "{product.description}",
  "sku": "{product.id}",
  "brand": { "@type": "Brand", "name": "{product.brand}" },
  "offers": {
    "@type": "Offer",
    "url": "{canonicalOrigin}/products/{product.id}",
    "priceCurrency": "ILS",
    "price": "{agorot / 100}",
    "availability": "https://schema.org/{InStock | OutOfStock}"
  }
}
```

**Organization (home page):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{storeName}",
  "url": "{canonicalOrigin}",
  "logo": "{logoUrl}"
}
```

**BreadcrumbList (catalog + product):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "בית", "item": "{canonicalOrigin}/" },
    { "@type": "ListItem", "position": 2, "name": "{category}", "item": "{canonicalOrigin}/catalog/{category}" }
  ]
}
```

### 10.4 `robots.txt` (real file, with AI-bot allow-list)

Generated per tenant into `build/client/robots.txt`:
```
User-agent: Googlebot
Allow: /
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /superAdmin
Disallow: /cart
Disallow: /checkout
Disallow: /profile

Sitemap: {canonicalOrigin}/sitemap.xml
```

### 10.5 `sitemap.xml`

Generated from the **same enumerated paths** used by `prerender()`, prefixed with the tenant's canonical origin:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{origin}/</loc></url>
  <url><loc>{origin}/terms</loc></url>
  <url><loc>{origin}/discounts</loc></url>
  <url><loc>{origin}/catalog/{category}</loc></url>
  <url><loc>{origin}/products/{id}</loc></url>
</urlset>
```

---

## 11. Freshness & Staleness Strategy

Prerendered HTML carries a **build-time snapshot**; price/stock can drift between builds. Two complementary mechanisms:

### 11.1 Live re-fetch on hydration (per visitor)

On prerendered routes, add a `clientLoader` opted into initial-load hydration, plus a `HydrateFallback`:

```tsx
// src/routes/product.tsx
export async function loader({ params }: Route.LoaderArgs) {
  // runs at BUILD time → bakes SEO snapshot (name, description, build-time price/stock) into HTML + JSON-LD
  return getProductSnapshot(params.id);
}

export async function clientLoader({ params, serverLoader }: Route.ClientLoaderArgs) {
  const snapshot = await serverLoader();          // baked data (instant)
  const live = await fetchLivePriceStock(params.id); // current price/stock from Firestore
  return { ...snapshot, ...live };
}
clientLoader.hydrate = true as const;             // run on INITIAL load, not just later navigations

export function HydrateFallback() {
  return <ProductSkeleton />;                      // shown while clientLoader resolves on first load
}
```

- **Crawler / AI bot:** reads the static HTML (build-time snapshot) — correct content, structured data. ✅
- **Human:** sees the prerendered HTML instantly, `clientLoader.hydrate` re-fetches live price/stock, `HydrateFallback` covers the brief gap → **always current** numbers. ✅

> The JSON-LD `Offer.price` is the build-time value; for highest accuracy this is refreshed by the rebuild triggers below. The human-visible price is always live via `clientLoader`.

### 11.2 Rebuild triggers (refresh the crawler HTML)

- **Scheduled daily rebuild** per tenant → re-prerenders with fresh catalog data (keeps JSON-LD prices reasonably current).
- **Catalog-change-driven rebuild** → a Firestore trigger on `products` / `categories` change kicks a rebuild for that tenant (debounced) so significant catalog changes propagate to static HTML quickly.

Rebuild→prod promotion policy is an **Open Question** (§16) — prod deploys are a hard gate.

---

## 12. Complete File Manifest

> Counts reflect **Strategy B**. Strategy A would reduce the "changed" count (custom-router internals + `<Route name>` call sites mostly untouched) but introduce the navigation-boundary penalty (§7.2).

### 12.1 ADDED (~16)

| File | Reason |
|---|---|
| `apps/store/react-router.config.ts` | Framework-mode config: `appDirectory:'src'`, `ssr:false`, `prerender()` |
| `apps/store/src/root.tsx` | Root route: `<html lang=he dir=rtl>`, `<Meta>/<Links>/<Scripts>/<ScrollRestoration>` |
| `apps/store/src/entry.client.tsx` | Client hydration entry (`hydrateRoot(document, <HydratedRouter/>)`) |
| `apps/store/src/routes.ts` | Route config (catch-all `*?` first; promoted public routes added incrementally) |
| `apps/store/src/catchall.tsx` | Splat route mounting existing `<App/>` (no-op boot) |
| `apps/store/src/routes/home.tsx` | Home route module: loader + meta + JSON-LD (Organization) |
| `apps/store/src/routes/catalog.tsx` | Catalog route module: loader + meta + BreadcrumbList |
| `apps/store/src/routes/product.tsx` | Product route module: loader + clientLoader.hydrate + HydrateFallback + Product/Offer JSON-LD |
| `apps/store/src/routes/terms.tsx` | Terms route module (static) |
| `apps/store/src/routes/discounts.tsx` | Discounts route module |
| `apps/store/prerender/fetchTenantData.ts` | Standalone Node fetcher (single-tenant, getPath-scoped) |
| `apps/store/prerender/enumerateTenantPaths.ts` | Builds catalog + product path lists for `prerender()` |
| `apps/store/prerender/storeTargets.ts` | `VITE_STORE_TARGET` → `{companyId, storeId, canonicalOrigin}` map |
| `apps/store/prerender/generateRobots.ts` | Emits `robots.txt` (AI allow-list) |
| `apps/store/prerender/generateSitemap.ts` | Emits `sitemap.xml` from enumerated paths |
| `apps/store/src/lib/seo/jsonLd.ts` | JSON-LD builders (Product/Offer w/ agorot→shekels, Organization, BreadcrumbList) |

### 12.2 CHANGED (~24, Strategy B)

| File | Reason |
|---|---|
| `apps/store/vite.config.ts` | Replace `@vitejs/plugin-react-swc` with `reactRouter()`; verify legacy/sentry/tsconfig-paths ordering |
| `apps/store/firebase.json` | Rewrite unmatched → `__spa-fallback.html`; serve prerendered `*.html`; cache headers (§16) |
| `apps/store/package.json` | Add RR deps; per-tenant build scripts (`build:tester/balasistore/pecanis`) |
| `apps/store/tsconfig.json` | Include generated `./+types/`; keep `src` + `@jsdev_ninja/core` paths |
| `apps/store/src/navigation/index.tsx` | Re-back `Link/navigate/useParams/useLocation/Redirect` on react-router; move `Route` usage to `routes.ts` |
| `apps/store/src/lib/router/store.tsx` | Render-safety (#1–3) **or** removed if fully re-backed |
| `apps/store/src/lib/router/router.tsx` | Re-back `Route`/matching on react-router primitives |
| `apps/store/src/lib/router/components/Link.tsx` | Re-back `Link`/`navigate` on react-router |
| `apps/store/src/app/App.tsx` | Convert top-level `<Route name>` layout wiring; keep guards/subscriptions |
| `apps/store/src/app/init.ts` | Render-safety (#7–9); tenant from `VITE_STORE_TARGET` at build; DOM writes → effects |
| `apps/store/src/pages/store/StoreLayout.tsx` | `<Route name="store.*">` → route-config children |
| `apps/store/src/pages/admin/AdminLayout/AdminLayout.tsx` | `<Route name="admin.*">` → route-config children |
| `apps/store/src/pages/admin/AdminLayout/Sidebar.tsx` | `Link`/`useLocation` call sites against re-backed surface |
| `apps/store/src/features/auth/ProtectedRoute/ProtectedRoute.tsx` | `Redirect` against re-backed surface |
| `apps/store/src/widgets/Category/CategoryTree/utils.ts` | Render-safety #4 (guard `navigator.platform`) |
| `apps/store/src/widgets/Category/CategoryTree/CategoryTree.tsx` | Render-safety #5 (de-dup + guard) |
| `apps/store/src/widgets/Category/CategoryTree/Item/Item.tsx` | Render-safety #6 (de-dup + guard) |
| `apps/store/src/pages/store/ProductPage/index.tsx` | Render-safety #10; consume `loaderData` |
| `apps/store/src/pages/store/OrderErrorPage/OrderErrorPage.tsx` | Render-safety #11 |
| `apps/store/src/pages/store/OrderSuccessPage/OrderSuccessPage.tsx` | Render-safety #12 |
| `apps/store/src/pages/store/HomePage/HomePage.tsx` | Render via route module / `loaderData` (registry preserved) |
| `apps/store/src/pages/store/CatalogPage.tsx` | Render via route module / `loaderData` (registry preserved) |
| `apps/docs/docs/architecture/migration-plan.md` | This document |
| `apps/docs/sidebars.ts` | No change needed (autogenerated) — *listed for completeness; likely no edit* |

### 12.3 REMOVED (2)

| File | Reason |
|---|---|
| `apps/store/index.html` | Replaced by build-time root render (`index.html` generated by RR) |
| `apps/store/src/main.tsx` | Replaced by `entry.client.tsx`; Mixpanel/Sentry init move into root/effect |

### 12.4 Dependencies

**Add:** `react-router` (v7), `@react-router/dev`, `@react-router/node` (build). `@react-router/serve` is **not** required (static hosting — no runtime server). **Vite plugin swap:** drop `@vitejs/plugin-react-swc` in favor of `reactRouter()` (keep `@vitejs/plugin-legacy`, `@sentry/vite-plugin`, `vite-tsconfig-paths` — verify compatibility, §15.3).

### 12.5 Build commands

```jsonc
// apps/store/package.json scripts (new)
"build:tester":      "VITE_STORE_TARGET=tester      react-router build",
"build:balasistore": "VITE_STORE_TARGET=balasistore react-router build",
"build:pecanis":     "VITE_STORE_TARGET=pecanis     react-router build",
"deploy:tester":      "npm run build:tester      && firebase deploy --only hosting:tester",
"deploy:balasistore": "npm run build:balasistore && firebase deploy --only hosting:balasistore",
"deploy:pecanis":     "npm run build:pecanis     && firebase deploy --only hosting:pecanis"
```
(Keep `tsc` type-check as a separate gate per project workflow rules.)

**Totals:** ~16 added · ~24 changed (Strategy B; ~18 under Strategy A) · 2 removed.

---

## 13. Step-by-Step Implementation Plan (one-shot branch)

All work on a single feature branch. Validate end-to-end on **tester**; production cutover per store is a **separate explicit gate**.

| Step | Do | Files | Verify on tester | No-break / rollback |
|---|---|---|---|---|
| **0. Branch** | Cut feature branch off `main`; `npm ci`; baseline `tsc && vite build` green | — | build passes | branch isolated; main untouched |
| **1. Render-safety** | Guard all 12 globals (§8); de-dup `iOS` helpers | router/store, CategoryTree ×3, init.ts, ProductPage, `Order{Error,Success}Page` | `tsc` + existing `vite build` still green; app runs in `dev:test` (5175) | Pure guards; behavior identical; revert per-file |
| **2. Framework no-op boot (B0)** | Add `react-router.config.ts` (`ssr:false`), `root.tsx`, `entry.client.tsx`, `routes.ts` with only `*?`, `catchall.tsx` re-exporting `App`; swap Vite plugin; remove `index.html` + `main.tsx` | config, root, entry.client, routes, catchall, vite.config, package.json | `react-router build` produces `__spa-fallback.html`; tester loads, every page behaves as today | App mounts unchanged under catch-all; revert = restore `main.tsx`/`index.html` + plugin |
| **3. Re-back custom surface (B1/B2)** | Re-implement `Link/navigate/useParams/useLocation/Redirect` on RR; move `<Route name>` → `routes.ts` | navigation/index, router/*, App, StoreLayout, AdminLayout, Sidebar, ProtectedRoute | Navigate admin↔store, deep links, back/forward, analytics `useLocation` fire; no full reloads at boundaries | Same import surface → call sites unchanged; revert router internals |
| **4. Tenant fetcher** | Standalone Node fetcher + path enumerator + `storeTargets` map; getPath-scoped to one tenant | prerender/* | `VITE_STORE_TARGET=tester` enumerates only tester catalog/products; unit test: no cross-tenant read | Build-only; zero runtime impact |
| **5. Promote HOME** | `routes/home.tsx` (loader+meta+Organization JSON-LD); add `/` to prerender; remove home from catch-all | routes.ts, routes/home, react-router.config | `curl` tester `/` → HTML has content + `<title>` + JSON-LD + `lang="he"` | If home route misbehaves, drop it from routes.ts → falls back to catch-all |
| **6. Promote CATALOG** | `routes/catalog.tsx` (loader+meta+BreadcrumbList); enumerate `/catalog/...` paths | routes.ts, routes/catalog, enumerateTenantPaths | `curl` a tester catalog URL → real product list HTML + JSON-LD | Same per-route fallback guarantee |
| **7. Promote PRODUCT** | `routes/product.tsx` (loader + `clientLoader.hydrate` + `HydrateFallback` + Product/Offer JSON-LD); enumerate `/products/:id` | routes.ts, routes/product, jsonLd | `curl` product HTML has build-time price; browser shows live price after hydration; `Offer.price` = agorot/100 | Same per-route fallback guarantee |
| **8. robots + sitemap** | Generate real `robots.txt` (AI allow-list) + `sitemap.xml` into `build/client` | generateRobots, generateSitemap | `curl /robots.txt` & `/sitemap.xml` return real files, AI bots allowed, admin disallowed | Static assets only |
| **9. Per-tenant build/deploy wiring** | `build:*`/`deploy:*` scripts; `firebase.json` rewrite → `__spa-fallback.html`; cache headers (pending §16) | package.json, firebase.json | `deploy:tester` succeeds; SPA routes (cart/checkout/admin) still served via fallback (200) | Tester target only |
| **10. Tester validation** | Full §14 verification on tester | — | All §14 checks pass | — |
| **11. PROD cutover — balasistore** | `deploy:balasistore` **(explicit approval gate)** | — | Post-deploy: view-source has content/JSON-LD; SPA routes work; canary | Re-deploy previous build to roll back |
| **12. PROD cutover — pecanis** | `deploy:pecanis` **(separate explicit approval gate)** | — | Same as step 11 | Same rollback |

**No-break guarantee:** until a public route is promoted in `routes.ts`, it is served by the catch-all (`<App/>`) — i.e. **today's behavior**. Promotion is per-route and reversible by deleting that route entry.

---

## 14. Verification Plan (tester target only)

### 14.1 Unit tests
- **Tenant isolation:** fetcher cannot run without a tenant; given `VITE_STORE_TARGET=tester` it only reads `{tester companyId}/{tester storeId}/...` via `getPath`; assert no path is hand-built and no other tenant id appears.
- **Path enumeration:** category tree → expected `/catalog/...` paths; products → `/products/:id`; no SPA/admin/private path is ever enumerated.
- **Money boundary:** `jsonLd` converts agorot→shekels exactly (e.g. `1999 → "19.99"`, currency `ILS`); never floats upstream.
- **Route de-dupe:** a path is either prerendered **or** SPA-fallback, never both; promoted routes removed from catch-all.

### 14.2 Build-output checks (curl / view-source against tester)
- `curl https://<tester>/` → body contains rendered text (not empty `#root`), `<title>`, `<meta name=description>`, `<link rel=canonical>`, `lang="he" dir="rtl"`, and Organization JSON-LD.
- `curl https://<tester>/products/<id>` → product name/description in HTML + Product/Offer JSON-LD with `price = agorot/100`, correct `availability`.
- `curl https://<tester>/catalog/<cat>` → product list HTML + BreadcrumbList JSON-LD.
- `curl https://<tester>/robots.txt` & `/sitemap.xml` → real files; GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot/Google-Extended/Googlebot allowed; `/admin`,`/superAdmin`,`/cart`,`/checkout`,`/profile` disallowed; sitemap lists all prerendered URLs.
- Confirm `build/client/__spa-fallback.html` exists (because `/` is prerendered).

### 14.3 Edge cases
- **Staleness:** load a product page; in the browser the displayed price/stock = **live** (via `clientLoader.hydrate`) even though static HTML shows the build-time snapshot; `HydrateFallback` renders during the gap.
- **SPA-fallback degradation:** `/checkout`, `/cart`, `/admin/...`, `/pay/:token` return the fallback (200), hydrate, and behave exactly as today; no crawler exposure (robots disallow).
- **Render-safety:** build completes with **zero** `window/document/navigator/history is not defined` errors; grep build logs.
- **Navigation (Strategy B):** admin↔store and SPA↔prerendered navigation works without full page reloads; back/forward, scroll restoration, active states intact; analytics `useLocation` events fire.

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **15.1 Custom-router replacement** (Strategy B re-backs a hand-rolled router with loose `as RouteKeys` casts, no 404 handling, manual pub/sub) | Broad call-site breakage | Keep the **exact same public import surface**; convert `<Route name>` incrementally; full nav regression on tester (§14.3); Strategy A as documented fallback |
| **15.2 Build scale for products** (loaders run at build for every prerendered product; many products = slow/heavy build, point-in-time `.data`) | Slow CI, memory pressure | `prerender` object form `concurrency`; **Open Question §16(3)**: prerender all vs top-N/in-stock/recently-updated with the long tail on SPA fallback |
| **15.3 Plugin compatibility** (`@vitejs/plugin-legacy` dual-bundle + polyfills, `@sentry/vite-plugin` sourcemaps, `vite-tsconfig-paths` `src`/core alias) under `reactRouter()` | Build break / hydration mismatch / silent deploy fail | Verify plugin order with `reactRouter()`; confirm legacy dual-bundle doesn't break hydration; ensure `SENTRY_AUTH_TOKEN` set or sourcemap upload disabled; keep tsconfig paths resolving `@jsdev_ninja/core` |
| **15.4 i18n / RTL at prerender** (build-time root must emit `lang=he dir=rtl`; theme/`data-store-theme` previously set via runtime DOM writes) | Wrong lang/dir in static HTML; FOUC | `lang/dir` hard-set in `root.tsx`; theme attribute applied in a client-only effect; per-tenant canonical origin baked at build |
| **15.5 Hosting cache headers** (today `/` and `/index.html` are `no-store`; prerendered HTML wants caching; host must rewrite unmatched → `__spa-fallback.html` at 200) | Crawlers get stale/no-cache; SPA routes 404 | Add Firebase rewrite to `__spa-fallback.html`; **Open Question §16(4)**: switch prerendered HTML from `no-store` to short-TTL |

---

## 16. Open Questions for Philip

1. **Build-time data SDK.** Use **Firebase Admin SDK** (CI secret, bypasses rules) or the **client SDK in Node** (bound by Firestore read rules)? Depends on whether rules permit unauthenticated product/category reads. *Context:* there is currently **no `firestore.rules` file** in the repo (reads are gated only client-side) — so client-SDK-in-Node may work today, but Admin SDK is more robust if rules are later added. **Recommendation:** Admin SDK with a CI service-account secret, scoped per tenant.
2. **Rebuild → prod promotion.** On catalog change / daily schedule, **auto-deploy** to prod, or **manual promotion**? Prod deploys are a hard gate. **Recommendation:** auto-rebuild artifact, **manual promote** to prod (at least initially).
3. **Product prerender scale.** Prerender **all** products, or **top-N / in-stock / recently-updated** with the long tail on SPA fallback? Affects build time and `.data` volume. **Recommendation:** start with in-stock + recently-updated; measure; expand.
4. **Cache headers.** Keep prerendered HTML on `no-store`, or switch to **short-TTL** (e.g. `max-age=300, s-maxage=3600`) so crawlers/CDN cache it? **Recommendation:** short-TTL for prerendered HTML; keep `__spa-fallback.html` no-store.

---

## 17. Rollback Plan

- **Per-route (in-branch):** delete the route entry from `routes.ts` → that path reverts to the catch-all `<App/>` (today's SPA behavior). Atomic and instant.
- **Per-tenant (post-deploy):** each production cutover is an independent `firebase deploy --only hosting:<target>`. Roll back by re-deploying the **previous build** to that target (Firebase Hosting keeps release history; `firebase hosting:rollback` for the target). Other tenants are unaffected.
- **Whole feature:** the work is one feature branch; `main` is untouched until merge. Abandon the branch to fully revert.
- **No data risk:** the migration **reads** Firestore at build time and **never writes** tenant data or changes `@jsdev_ninja/core` schemas — no migration, no destructive operation.

---

## 18. Appendix

### 18.1 React Router documentation references (URLs used)
- Modes overview — https://reactrouter.com/start/modes
- Rendering strategies — https://reactrouter.com/start/framework/rendering
- SPA Mode (`ssr:false`, build-time root render, `__spa-fallback`) — https://reactrouter.com/how-to/spa
- Pre-Rendering (SSG, `prerender` forms, `getStaticPaths`, `.html`/`.data`) — https://reactrouter.com/how-to/pre-rendering
- Route Module API (`loader`/`clientLoader`/`clientLoader.hydrate`/`HydrateFallback`/`meta`/`links`) — https://reactrouter.com/start/framework/route-module
- `react-router.config.ts` reference (`ssr`, `prerender`, `appDirectory`, `basename`) — https://reactrouter.com/api/framework-conventions/react-router.config.ts
- Framework installation + incremental adoption (catch-all `*?`, `root.tsx`, `entry.client.tsx`) — https://reactrouter.com/start/framework/installation and https://reactrouter.com/upgrading/component-routes

### 18.2 Glossary
- **SEO** — Search Engine Optimization: being indexed/ranked by traditional search engines (Google, Bing).
- **GEO** — Generative Engine Optimization: being read and **cited by AI answer engines** (ChatGPT, Perplexity, Claude, Google AI). These mostly do **not** run JavaScript, so they need real HTML.
- **SPA** — Single-Page App: the browser renders content with JS after loading an (often empty) HTML shell. Our current state.
- **SSR** — Server-Side Rendering: HTML rendered on a server **per request** at runtime. Not chosen (needs a running server).
- **SSG / Prerender** — Static Site Generation: HTML rendered **once at build time** into static files. Our chosen approach (`prerender` + `ssr:false`).
- **Hydration** — the browser "wakes up" pre-rendered/static HTML by attaching React's interactivity (and, here, re-fetching live price/stock via `clientLoader.hydrate`).
- **Route Module** — a React Router v7 Framework-mode file exporting `loader`/`clientLoader`/`meta`/`links`/`default`/`HydrateFallback`/`ErrorBoundary`; the unit that carries per-page SEO and data.
- **`__spa-fallback.html`** — the SPA shell served for any non-prerendered path; its filename is `__spa-fallback.html` (not `index.html`) precisely **because** we prerender `/`.
- **agorot** — 1 ILS = 100 agorot; money is stored as integer agorot and converted to shekels only at the JSON-LD `Offer.price` boundary.