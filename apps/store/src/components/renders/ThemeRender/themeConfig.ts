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
 * set on `<html>` once at app init (`app/init.ts`) and stays for the whole
 * session, so the theme applies to the ENTIRE app for this store — both
 * storefront AND admin routes — and cascades to React portals (HeroUI
 * toasts, modals). Each domain resolves to exactly one store, so there is
 * no cross-store leakage: a given deployment only ever has one theme.
 */
export const THEME_CONFIG: Partial<Record<TStore["id"], ThemeLoader>> = {
  // Example (don't add real entries in infra-only PR):
  //   balasistore_store: () => import("../../../websites/balasistore/theme.css"),
  tester_store: () => import("../../../websites/tester/thme.css"),
};
