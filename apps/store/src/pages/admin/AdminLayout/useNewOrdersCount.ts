import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppApi } from "src/appApi";
import { useAppSelector } from "src/infra";
import { TOrder } from "src/domains/Order";

// Where we remember (per store, in the browser only) the last time the admin
// looked at the orders screen. Anything newer counts as a "new" order.
const storageKeyFor = (storeId: string) => `admin:lastSeenOrdersAt:${storeId}`;

function readLastSeen(storeId: string): number {
	const key = storageKeyFor(storeId);
	const raw = localStorage.getItem(key);
	if (raw == null) {
		// First time on this device: treat everything existing as already seen so
		// we don't surface the entire order history as "new".
		const now = Date.now();
		localStorage.setItem(key, String(now));
		return now;
	}
	return Number(raw) || 0;
}

/**
 * Tracks how many orders arrived since the admin last viewed the orders screen.
 * Frontend-only: live order data comes from a tenant-scoped Firestore listener,
 * and the "last seen" marker lives in localStorage — no schema or backend change.
 */
export function useNewOrdersCount() {
	const appApi = useAppApi();
	const storeId = useAppSelector((state) => state.store.data?.id);

	const [orders, setOrders] = useState<TOrder[]>([]);
	const [lastSeen, setLastSeen] = useState<number>(() => Date.now());

	// Initialise / refresh the "last seen" marker once we know the store.
	useEffect(() => {
		if (!storeId) return;
		setLastSeen(readLastSeen(storeId));
	}, [storeId]);

	// Live subscription to this store's orders.
	useEffect(() => {
		if (!storeId) return;
		const unsubscribe = appApi.admin.subscribeToOrders((next) => setOrders(next));
		return () => unsubscribe?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [storeId]);

	const count = useMemo(
		() => orders.filter((order) => (order.date ?? 0) > lastSeen).length,
		[orders, lastSeen]
	);

	// Call when the admin views the orders screen — resets the badge.
	const markSeen = useCallback(() => {
		if (!storeId) return;
		const now = Date.now();
		localStorage.setItem(storageKeyFor(storeId), String(now));
		setLastSeen(now);
	}, [storeId]);

	return { count, markSeen };
}
