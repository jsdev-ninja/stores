/**
 * Recently-viewed products — lightweight, client-only.
 *
 * Stores a small snapshot of the products a visitor opened, in localStorage,
 * scoped per store so it never leaks across tenants. Purely additive: reading
 * or writing never throws (localStorage may be unavailable / full), and an
 * empty/parse-failed list just resolves to [].
 *
 * The full product object is stored (capped to MAX_ITEMS) so the home rail can
 * render with the existing Product widget without an extra fetch. Cards link to
 * the live product page, so any price/stock drift in the snapshot is cosmetic.
 */

import type { TProduct } from "@jsdev_ninja/core";

const MAX_ITEMS = 10;
const keyFor = (storeId: string) => `recentlyViewed:${storeId}`;

export function recordRecentlyViewed(storeId: string, product: TProduct): void {
	if (!storeId || !product?.id) return;
	try {
		const current = getRecentlyViewed(storeId).filter((p) => p.id !== product.id);
		const next = [product, ...current].slice(0, MAX_ITEMS);
		localStorage.setItem(keyFor(storeId), JSON.stringify(next));
	} catch {
		// localStorage unavailable / quota exceeded — recently-viewed is best-effort.
	}
}

export function clearRecentlyViewed(storeId: string): void {
	if (!storeId) return;
	try {
		localStorage.removeItem(keyFor(storeId));
	} catch {
		// best-effort
	}
}

export function getRecentlyViewed(storeId: string): TProduct[] {
	if (!storeId) return [];
	try {
		const raw = localStorage.getItem(keyFor(storeId));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as TProduct[]).filter((p) => p?.id) : [];
	} catch {
		return [];
	}
}
