# Per-store theme (CSS) loading

**Status:** Draft for review
**Owner:** architect
**Date:** 2026-05-29
**Scope:** `apps/store` only

---

## 1. Summary

Let each store ship its own CSS theme that overrides the design tokens declared in `apps/store/src/index.css` (Tailwind v4 `@theme {}` block) and add store-specific rules (fonts, custom selectors, RTL). Theme loading mirrors the per-store component pattern in [`ProductRender.tsx`](../../apps/store/src/components/renders/ProductRender/ProductRender.tsx): a `THEME_CONFIG` registry keyed by `store.id`, resolved through `useStore()`, lazy-loaded via Vite dynamic `import()`. Stores without a registered theme render with the default tokens — zero extra bytes. The hook point already exists: `apps/store/src/app/init.ts:66` has a `// apply store theme` placeholder, and theme load is gated by `appReady` so the user never sees the default tokens flash on a branded store.

---

## 2. Current state

| Concern | Where it lives today | Notes |
|---|---|---|
| Per-store component override | [`apps/store/src/components/renders/ProductRender/ProductRender.tsx`](../../apps/store/src/components/renders/ProductRender/ProductRender.tsx) | `Record<TStore["id"], { productCard?: LazyExoticComponent<…> }>` + `useStore()` + `lazy()` + `<Suspense>`. Fallback = `DefaultProductCard`. |
| Single global CSS entry | [`apps/store/src/main.tsx:10`](../../apps/store/src/main.tsx) | `import "./index.css";` runs once at boot. No other top-level CSS imports. |
| Tailwind v4 entry & default tokens | [`apps/store/src/index.css`](../../apps/store/src/index.css) | `@import "tailwindcss"` + `@theme { --color-hero, --color-hero-foreground, --color-section-alt, --shadow-card, --shadow-card-hover, --shadow-hero-image, --shadow-header }`, plus `--brand-primary` on `html body, #root`. |
| Store resolution | [`apps/store/src/domains/Store/selectors.ts:4`](../../apps/store/src/domains/Store/selectors.ts) → `useStore()` → reads `state.store.data: TStore | null`. Setter is `StoreSlice.setStore`, dispatched once from [`apps/store/src/app/init.ts:70`](../../apps/store/src/app/init.ts) after the store doc is fetched from Firestore by URL. |
| App-ready gate | [`apps/store/src/app/App.tsx:173-194`](../../apps/store/src/app/App.tsx) | While `!appReady`, the app renders a fullscreen spinner — nothing branded is painted. This is the FOUC mitigation we will reuse. |
| Existing per-store folders | `apps/store/src/websites/balasistore/`, `…/default/`, `…/tester/` | Component-only today. No CSS files. `config.ts` is **empty** (0 bytes — confirmed). |
| Existing theme stub | [`apps/store/src/infra/theme/index.tsx`](../../apps/store/src/infra/theme/index.tsx) | 19-line stub: `useTheme()` returns a `TTheme` of empty strings. **Unused** (grep confirms no consumers). Safe to delete or repurpose. |
| Vite CSS handling | [`apps/store/vite.config.ts`](../../apps/store/vite.config.ts) | No `manualChunks`, no special CSS options. Dynamic `import("./foo.css")` produces a hashed chunk and Vite injects a `<link>` automatically. HMR works on `.css` files by default. |
| RTL today | [`apps/store/src/app/App.tsx:37,70`](../../apps/store/src/app/App.tsx) | `dir` is read from `i18n.dir()` and written to `document.body.dir` in a `useEffect`. Locale-driven, not store-driven. Balasi happens to need `rtl` because it ships Hebrew. |
| `init.ts` hook point | [`apps/store/src/app/init.ts:66`](../../apps/store/src/app/init.ts) | Already has comment `// apply store theme` between `document.title = company.name;` and `setAppReady(true)`. **This is the hook point.** |

---

## 3. Proposed design

### 3.1 Registry shape — `THEME_CONFIG`

Mirror the `RENDER_CONFIG` shape exactly. Place it next to `ProductRender.tsx` as `ThemeRender.tsx` to keep the per-store override convention in one place; expose a small loader from `src/infra/theme/`.

```ts
// apps/store/src/components/renders/ThemeRender/themeConfig.ts
import type { TStore } from "@jsdev_ninja/core";

/**
 * A theme entry. Each store may either:
 *  - point at a single CSS file (default), or
 *  - point at an `index.ts` that side-imports multiple `.css` files
 *    (e.g. tokens + fonts + components).
 *
 * The loader function is a Vite dynamic import so that the chunk
 * (and the CSS asset Vite emits for the side-effect import) is split
 * out and only fetched when the matching store is resolved.
 */
export type ThemeLoader = () => Promise<unknown>;

export type ThemeEntry = {
	/** Lazy CSS-only entry. CSS is applied via Vite's side-effect import. */
	load: ThemeLoader;
};

export const THEME_CONFIG: Record<TStore["id"], ThemeEntry> = {
	balasistore_store: {
		load: () => import("src/websites/balasistore/theme/index.css"),
	},
	// `tester_store` is a separate store and is NOT mapped here — it falls
	// back to the compile-time defaults in src/index.css. (Note: this is
	// independent of ProductRender's tester_store → balasistore mapping;
	// component overrides and theme overrides are deliberately decoupled.)
	// Stores not listed → fall back to the compile-time defaults.
} as const;
```

### 3.2 Loader / `<ThemeProvider>`

A thin React component that:

1. reads `store.id` from `useStore()`,
2. looks up `THEME_CONFIG[store.id]`,
3. calls the dynamic `import()` (Vite handles `<link>` injection + dedup automatically),
4. sets `data-store="<id>"` on `<html>` so theme CSS can scope its overrides,
5. tracks the current applied id and runs cleanup if the store id changes (rare in prod — relevant for admin preview and Storybook),
6. exposes `themeReady: boolean` so the loader / `App` can withhold first paint on a branded store.

```ts
// apps/store/src/infra/theme/ThemeProvider.tsx
import { useEffect, useRef, useState } from "react";
import { useStore } from "src/domains/Store";
import { THEME_CONFIG } from "src/components/renders/ThemeRender/themeConfig";

type Props = { children: React.ReactNode };

export function ThemeProvider({ children }: Props) {
	const store = useStore();
	const storeId = store?.id ?? "";
	const [appliedId, setAppliedId] = useState<string | null>(null);
	const inflightId = useRef<string | null>(null);

	useEffect(() => {
		if (!storeId) return;

		// Already applied → noop.
		if (appliedId === storeId) return;

		const entry = THEME_CONFIG[storeId];
		document.documentElement.setAttribute("data-store", storeId);

		if (!entry) {
			// No store-specific theme → defaults already in place.
			setAppliedId(storeId);
			return;
		}

		inflightId.current = storeId;
		entry
			.load()
			.then(() => {
				// Guard against an interleaved store switch.
				if (inflightId.current !== storeId) return;
				setAppliedId(storeId);
			})
			.catch((err) => {
				// Failing to load a theme must not break the app — log and continue with defaults.
				console.error("[theme] failed to load", storeId, err);
				setAppliedId(storeId);
			});
	}, [storeId, appliedId]);

	return <>{children}</>;
}
```

> No `themeReady` prop is needed downstream — `init.ts` already gates first paint on `appReady`, and we trigger the load *from* `init.ts` (see §4). The `ThemeProvider` above is only needed for the **runtime switch path** (admin preview, Storybook, tests).

### 3.3 Boot-time load helper

To eliminate FOUC on initial load, kick off the theme load synchronously from `init.ts` **before** `setAppReady(true)` is dispatched. The compiled-in `index.css` is already on the page; the lazy theme is awaited so by the time the spinner clears, the overrides are in the DOM.

```ts
// apps/store/src/infra/theme/loadStoreTheme.ts
import { THEME_CONFIG } from "src/components/renders/ThemeRender/themeConfig";

export async function loadStoreTheme(storeId: string): Promise<void> {
	document.documentElement.setAttribute("data-store", storeId);
	const entry = THEME_CONFIG[storeId];
	if (!entry) return; // default tokens win
	try {
		await entry.load();
	} catch (err) {
		console.error("[theme] failed to load", storeId, err);
	}
}
```

Call site in `init.ts`:

```diff
   if (company && store) {
     // … favicon + title …
-    // apply store theme
+    await loadStoreTheme(store.id);
   }
```

---

## 4. Loading & lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│ 1. main.tsx runs                                               │
│    - imports "./index.css"  (compile-time @theme defaults)     │
│    - mounts <Provider><App/></Provider>                        │
│                                                                │
│ 2. App.tsx renders                                             │
│    - !appReady → fullscreen spinner (no branded UI painted)    │
│    - useAppInit() runs in effect                               │
│                                                                │
│ 3. init.ts                                                     │
│    a. Firestore: resolve company + store by URL                │
│    b. set favicon, title                                       │
│    c. await loadStoreTheme(store.id)                           │
│       └→ document.documentElement.dataset.store = storeId      │
│       └→ THEME_CONFIG[storeId]?.load()                         │
│          (Vite dynamic import → fetch hashed chunk →           │
│           Vite injects <link rel="stylesheet"> into <head>)    │
│       └→ overrides land on :root or [data-store="…"]           │
│    d. dispatch setStore(store)                                 │
│    e. dispatch setAppReady(true)                               │
│                                                                │
│ 4. App.tsx re-renders → appReady true →                        │
│    <ThemeProvider> mounts (idempotent, sees appliedId===id) →  │
│    branded UI paints with theme already applied → NO FOUC      │
│                                                                │
│ 5. Store change (admin preview, tests):                        │
│    a. setStore(otherStore)                                     │
│    b. ThemeProvider effect fires                               │
│    c. data-store attribute swapped                             │
│    d. New theme dynamic-imported (cached if visited before)    │
│    e. Old theme's <link> stays in DOM but its rules are        │
│       inert because data-store no longer matches               │
│       (see §5.3 for why this is safe with Tailwind v4)         │
└────────────────────────────────────────────────────────────────┘
```

**FOUC mitigation, two layers:**

1. `appReady` spinner already in `App.tsx` covers the boot window.
2. `init.ts` `await`s the dynamic import before dispatching `setAppReady(true)`, so the spinner stays up until the theme stylesheet is in the DOM. (Vite resolves the dynamic-import promise after the `<link>` it injects has loaded — verify in test plan §10.)

**HMR:** editing the theme CSS file in dev triggers Vite's CSS HMR — the existing `<link>` is replaced in place, no full reload. No special config needed.

---

## 5. Tailwind v4 interaction

### 5.1 What lives in `@theme {}`

`index.css` declares the **defaults** in `@theme {}`. At build time, Tailwind v4 emits these as CSS variables on `:root` and generates utilities that reference them (`shadow-card`, `bg-hero`, etc.).

### 5.2 What the runtime theme overrides

A store theme is a plain `.css` file. It does **not** use `@theme {}` (that block is a *source* directive consumed only at Tailwind compile time — declaring it in a dynamically loaded file does nothing). Instead the theme re-declares the same CSS variables in a runtime selector. Two scoping options:

| Selector | Pro | Con |
|---|---|---|
| `:root { --color-hero: …; }` | Simplest; lowest specificity needed to override `@theme`-generated `:root` declarations because both are equal specificity and source order wins (theme loads after `index.css`). | Two stores' themes loaded in the same session (admin preview) leak — last load wins. |
| `[data-store="balasistore_store"] { --color-hero: …; }` *(recommended)* | Scoped — no leakage across stores. Higher specificity guarantees override regardless of load order. | Trivially more verbose. |

**Decision:** `[data-store="<id>"]` on `<html>`. The `ThemeProvider` (and the boot loader) sets `document.documentElement.setAttribute("data-store", storeId)`. Scoping by attribute on `<html>` means every CSS variable cascades to every element, *and* admin preview can swap themes by changing only one attribute.

### 5.3 Sample store theme file

```css
/* apps/store/src/websites/balasistore/theme/index.css */
@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;1,300&family=Heebo:wght@300;400;500;700;800;900&display=swap');

[data-store="balasistore_store"] {
	/* Override compile-time @theme tokens from index.css */
	--color-hero: #f7f4ee;
	--color-hero-foreground: #0d0d0b;
	--color-hero-muted: #6b665e;
	--color-section-alt: #efeae0;
	--color-accent: #fdebe0;

	--shadow-card: 0 1px 1px rgba(13,13,11,.04), 0 4px 14px rgba(13,13,11,.06);
	--shadow-card-hover: 0 12px 36px rgba(13,13,11,.08);

	--brand-primary: 18 71% 60%; /* terracotta, HSL triplet to match index.css convention */
}

/* Store-specific custom rules can also go here. Selectors should sit
   under the [data-store] scope so they don't leak into other stores. */
[data-store="balasistore_store"] body {
	font-family: 'Heebo', -apple-system, system-ui, sans-serif;
}
```

### 5.4 Two-store loaded state

After loading store A's theme, then switching to store B:

```
<html data-store="balasistore_store">  ← attribute swapped to B
  <head>
    <link rel="stylesheet" href="/assets/index.<hash>.css">       ← compile-time defaults
    <link rel="stylesheet" href="/assets/balasi.<hash>.css">      ← A (inert: selector no longer matches)
    <link rel="stylesheet" href="/assets/storeB.<hash>.css">      ← B (active)
```

Because every theme's variables sit under `[data-store="<that-store-id>"]`, only the rules matching the current attribute apply. No cleanup of stylesheet `<link>` tags is required for correctness — they just become dead weight in the document. (In production a tenant only ever sees one store, so this is a non-issue. For long-lived preview sessions in admin we can add an explicit `<link>` removal later if it becomes a problem — flagged as future work, not blocking M1.)

---

## 6. File layout

```
apps/store/src/
├── index.css                                  (unchanged — default @theme tokens)
├── infra/
│   └── theme/
│       ├── index.tsx                          (DELETE: unused stub)
│       ├── ThemeProvider.tsx                  (NEW: runtime switching)
│       └── loadStoreTheme.ts                  (NEW: boot-time await)
├── components/renders/
│   ├── ProductRender/ProductRender.tsx        (unchanged — convention reference)
│   └── ThemeRender/
│       └── themeConfig.ts                     (NEW: THEME_CONFIG registry)
├── websites/
│   ├── default/                               (unchanged — no theme file, falls back to index.css)
│   ├── balasistore/
│   │   ├── HomePage.tsx                       (unchanged)
│   │   ├── index.tsx                          (unchanged)
│   │   └── theme/
│   │       └── index.css                      (NEW: per-store theme)
│   └── tester/
│       └── index.tsx                          (unchanged)
└── app/
    ├── App.tsx                                (small change: wrap with <ThemeProvider> for runtime switching)
    └── init.ts                                (small change: await loadStoreTheme before setAppReady)
```

Rationale for splitting registry from provider:
- `themeConfig.ts` lives under `components/renders/` to **mirror `ProductRender`'s location** (the brief's explicit requirement).
- `ThemeProvider.tsx` and `loadStoreTheme.ts` live in `src/infra/theme/` because they are runtime infrastructure (Redux-aware hook + DOM side effects), not render components. This also retires the unused `infra/theme/index.tsx` stub instead of orphaning it.

---

## 7. Migration plan

Six commits, smallest blast radius first. Each step is independently reversible.

| # | Commit | Risk | Reversible? |
|---|---|---|---|
| 1 | Add `themeConfig.ts` with an **empty** `THEME_CONFIG = {}` and the `ThemeEntry`/`ThemeLoader` types. | None — dead code. | `git revert` |
| 2 | Add `loadStoreTheme.ts` and `ThemeProvider.tsx`. Still not wired anywhere. | None — dead code. | `git revert` |
| 3 | Wire `loadStoreTheme(store.id)` into `init.ts` (replace the `// apply store theme` comment). Wrap `<App/>`'s children in `<ThemeProvider>`. Empty registry → noop in production. | Very low — empty registry, just sets a `data-store` attribute. | `git revert` |
| 4 | Create `src/websites/balasistore/theme/index.css` with token overrides only (no font import yet, to isolate change scope). Register it under `balasistore_store` in `THEME_CONFIG`. | Low — affects only `balasistore_store`. Revertible by deleting the registry entry. | `git revert` |
| 5 | Add Google Fonts `@import` (Heebo + Frank Ruhl Libre) + `--font-display` / `--font-serif` token overrides to the Balasi theme. No porting of legacy selectors. | Medium — fonts are network-bound; verify no CLS regression. | `git revert` (CSS-only) |
| 6 | Delete `apps/store/src/infra/theme/index.tsx` (the unused stub). | None — verified zero consumers. | `git revert` |

Suggested commit cadence: 1–3 together (infrastructure with no behavior change), 4 alone, 5 alone, 6 alone or bundled with 5.

---

## 8. Decisions made

| # | Decision | One-line justification |
|---|---|---|
| 1 | **Theme shape: folder, not single file.** `websites/{storeId}/theme/index.css` (entry) so we can add fonts, tokens, components as separate files later without touching the registry. | Matches how `balasistore/` already groups component files in a folder; trivial to extend. |
| 2 | **Loader: `lazy() / dynamic import("...css")` (option a).** | Vite emits hashed CSS chunks and injects `<link>` automatically; one mechanism mirrors `lazy()` of components in `ProductRender`; HMR works for free. |
| 3 | **Rejected (b) `<link>` injection.** | We'd hand-roll cache-busting and path resolution; loses Vite's content-hashed asset pipeline. |
| 4 | **Rejected (c) sync `import()` in `main.tsx`.** | `store.id` is not known at `main.tsx` time — it's resolved by Firestore lookup in `init.ts` after URL match. Must be async. |
| 5 | **Token override scope: `[data-store="<id>"]` on `<html>`.** | Scoped — no cross-store leakage in admin preview; higher specificity guarantees override regardless of stylesheet order. |
| 6 | **Default theme stays in `index.css`.** | No symmetry win to extract; extracting would force every page load to fetch a second CSS file even for default stores. |
| 7 | **Cache-busting: rely on Vite's content hash.** | Vite already emits `[name].[hash].css` filenames; manual `?v=YYYY-MM-DD` is redundant. |
| 8 | **`dir` stays out of theme config.** | `dir` is already driven by i18n in `App.tsx:37,70`; coupling it to theme would create two sources of truth. Stores that need RTL should ship Hebrew/Arabic locale, which already flips `dir`. |
| 9 | **Fonts: `@import url(...)` inside the lazy CSS file.** | Travels with the theme chunk; non-themed stores pay nothing. Acceptable trade-off vs. `<link rel="preconnect">` for v1; revisit if Lighthouse flags it. |
| 10 | **`THEME_CONFIG` location: alongside `ProductRender.tsx`** (in `components/renders/ThemeRender/themeConfig.ts`). | Brief explicitly asks to mirror the existing convention; one place to grep for per-store overrides. |
| 11 | **Scope: global (`<html>` attribute).** | Best for branded storefront experience. Future component-scope `<ThemeBoundary>` could nest a `[data-store]` div without changing the registry shape — additive, not breaking. |
| 12 | **Delete the unused `infra/theme/index.tsx` stub** in commit 6. | Zero consumers (grep confirms); leaving an unused `useTheme()` invites accidental adoption of a dead API. |
| 13 | **Failure mode: load error → log + render defaults.** | A theme load failure must never break commerce; we already have the compile-time defaults applied. |

---

## 9. Open questions for the user

_Resolved 2026-05-29:_

1. **Tester store mapping** → `tester_store` is a separate store and is NOT mapped to the Balasi theme; it falls back to defaults. Component override (`ProductRender`) and theme override are decoupled.
2. **Tailwind shape** → CSS-variable overrides of `@theme` tokens. No per-store `tailwind.config`. Theme files contain only token re-declarations + a few non-utility lines (font `@import`, body font).
3. **v1 port scope from legacy `balasi-all/styles.css`** → Tailwind tokens only (the ~10 vars in `@theme {}` and `--brand-primary`). Custom selectors and large legacy rules are NOT ported — they would collide with HeroUI + Tailwind utilities and the rewrite uses different DOM anyway.

---

## 10. Test plan

### Manual

| Step | Expected |
|---|---|
| Run `pnpm --filter store dev:test` (port 5175) on a `tester_store` URL. | Page renders with Balasi tokens applied; `<html data-store="tester_store">`; a `<link>` to the Balasi theme chunk appears in `<head>`; **no flash of default tokens** during boot. |
| Open DevTools → Network → reload with cache disabled. | Two CSS files: the compiled `index.<hash>.css` and the lazy `balasi.<hash>.css`. The second is fetched once. |
| Edit `apps/store/src/websites/balasistore/theme/index.css` (change `--color-hero`). | HMR updates color without full page reload. |
| Run `pnpm --filter store dev:test2` (port 5176) on a store NOT in `THEME_CONFIG`. | No second CSS file fetched; `<html data-store="<that-id>">`; page renders with defaults from `index.css`. |
| In running app, dispatch `StoreSlice.setStore(otherStore)` via Redux DevTools to a store with a theme. | `data-store` attribute swaps; new theme `<link>` injected; old theme's rules become inert (verify in Elements panel that previous `[data-store="…"]` selectors don't apply). |
| Throttle network to Slow 3G in DevTools, hard reload `tester_store`. | Spinner stays visible until theme `<link>` finishes loading; no flash of unstyled / mis-themed content before first paint. |

### Automated (recommended, not blocking)

- Unit test for `loadStoreTheme`: mock the registry, assert `data-store` is set, assert the loader is called, assert a missing entry returns without throwing, assert a rejected loader is logged and resolved.
- Unit test for `ThemeProvider`: render with a mocked `useStore`, assert `data-store` updates on store change, assert no second load when the same id re-renders.
- No need for component-level tests on themed visuals — those are covered by Storybook + visual review.

### Smoke for the `appReady` gate

In `App.tsx`, confirm the spinner branch still renders when `init.ts` is mid-await on `loadStoreTheme`. Add a `console.time/timeEnd` pair around the await during development to confirm wall-clock cost (target: <100 ms on cached load, <400 ms cold over fast 3G).

---

## Deferred (explicitly out of scope)

- Dark mode toggle per store. (`@custom-variant dark` already in `index.css`; future themes can declare both light and dark variable sets under `[data-store="…"]` and `[data-store="…"].dark` selectors — no registry change needed.)
- Admin UI to upload / select themes. Themes are committed to the repo.
- SSR theme injection. App is SPA (confirmed: `main.tsx` uses `createRoot(...).render`, no SSR entry).
- Removing stale theme `<link>` tags on store switch (only relevant in long-lived admin preview sessions).
- Preconnect / preload hints for store-specific fonts.
