//Import Mixpanel SDK
import { User } from "firebase/auth";
import { CONFIG } from "src/config";
import { TProfile, TStore } from "@jsdev_ninja/core";

type events =
	| "USER_ADD_ITEM_TO_CART"
	| "USER_REMOVE_ITEM_FROM_CART"
	| "USER_PURCHASE"
	| "AUTH_USER_LOGOUT"
	| "AUTH_USER_LOGIN"
	| "ADMIN_ORDER_ACCEPT"
	| "ADMIN_ORDER_PAID"
	| "ADMIN_ORDER_DELIVERED";

export const mixPanelApi = {
	init: async ({ debug }: { debug: boolean }) => {
		// Near entry of your product, init Mixpanel
		const mixpanel = (await import("mixpanel-browser")).default;

		mixpanel.init("7bbee5e370000e2b2c4eff3f8b5e6460", {
			debug: debug,
			track_pageview: false,
			persistence: "localStorage",
		});
	},
	identify: async (
		user: User,
		{ store, profile }: { store: TStore; profile: TProfile | null }
	) => {
		const mixpanel = (await import("mixpanel-browser")).default;
		mixpanel.identify(user.uid);
		mixpanel.people.set({
			$name: user.displayName ?? user.email,
			$email: user.email,
			isAnonymous: user.isAnonymous,
			tenantId: user.tenantId,
			storeId: store.id,
			companyId: store.companyId,
			clientType: profile?.clientType,
			MODE: CONFIG.MODE,
		});
	},
	pageView: async (data: any) => {
		const mixpanel = (await import("mixpanel-browser")).default;
		mixpanel.track_pageview({ ...data, MODE: CONFIG.MODE }, { event_name: "custom_page_view" });
	},
	track: async (event: events, data: object) => {
		const mixpanel = (await import("mixpanel-browser")).default;

		mixpanel.track(event, {
			...data,
			MODE: CONFIG.MODE,
		});
	},
};
