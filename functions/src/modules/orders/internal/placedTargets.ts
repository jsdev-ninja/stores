import { TOrder } from "@jsdev_ninja/core";

/**
 * Statuses that count as a real order placement.
 *
 * HYP success transitions draft → pending. Admin manually accepting a draft goes
 * to processing. Excludes draft (not placed yet), cancelled/refunded (not placed
 * at all), and later-stage statuses (in_delivery/delivered/completed) which should
 * only be reachable via earlier transitions, not a direct create or draft jump.
 */
export const PLACED_TARGETS = ["pending", "processing"] as const;
export type PlacedTarget = (typeof PLACED_TARGETS)[number];

export function isPlacedStatus(
	status: TOrder["status"],
): status is PlacedTarget {
	return (PLACED_TARGETS as readonly string[]).includes(status);
}
