//Import Mixpanel SDK
import { User } from "firebase/auth";
import mixpanel from "mixpanel-browser";
import { CONFIG } from "src/config";
import { TStore } from "src/domains/Store";
import { TProfile } from "src/types";

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
	init: ({ debug }: { debug: boolean }) => {
		// Near entry of your product, init Mixpanel
		mixpanel.init("7bbee5e370000e2b2c4eff3f8b5e6460", {
			debug: debug,
			track_pageview: false,
			persistence: "localStorage",
		});
	},
	identify: (user: User, { store, profile }: { store: TStore; profile: TProfile | null }) => {
		console.log("store.id", store.id);

		mixpanel.identify(user.uid);
		mixpanel.people.set({
			$name: user.displayName ?? user.email,
			$email: user.email,
			isAnonymous: user.isAnonymous,
			tenantId: user.tenantId,
			storeId: store.id,
			companyId: store.companyId,
			clientType: profile?.clientType,
		});
	},
	pageView: (data: any) => {
		mixpanel.track_pageview(data);
	},
	track: (event: events, data: object) => {
		mixpanel.track(event, {
			...data,
			MODE: CONFIG.MODE,
		});
	},
};