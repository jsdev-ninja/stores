import type { TStore } from "@jsdev_ninja/core";

export type ThemeLoader = () => Promise<unknown>;

/**
 * Per-store CSS theme registry.
 *
 * A store listed here loads its CSS file lazily (Vite dynamic import).
 * Stores NOT listed fall back to the default theme in `src/themes/default.css`.
 *
 * Independent of `RENDER_CONFIG` in ProductRender — a store can map a
 * custom productCard without mapping a theme, or vice versa.
 *
 * A store's CSS file MUST scope its overrides under the
 * `[data-store-theme="<id>"]` selector, NOT `:root`. The attribute is
 * set on `<html>` by `StoreLayout` (only while a storefront route is
 * mounted), so theme variables cascade to every element including React
 * portals (HeroUI toasts, modals) but never leak into admin routes.
 */
export const THEME_CONFIG: Partial<Record<TStore["id"], ThemeLoader>> = {
	// Example (don't add real entries in infra-only PR):
	//   balasistore_store: () => import("../../../websites/balasistore/theme.css"),
};
