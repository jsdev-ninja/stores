//Import Mixpanel SDK
import { User } from "firebase/auth";
import mixpanel from "mixpanel-browser";
import { CONFIG } from "src/config";

type events = "USER_ADD_ITEM_TO_CART" | "USER_REMOVE_ITEM_FROM_CART";

export const mixPanelApi = {
	init: ({ debug }: { debug: boolean }) => {
		// Near entry of your product, init Mixpanel
		mixpanel.init("7bbee5e370000e2b2c4eff3f8b5e6460", {
			debug: debug,
			track_pageview: false,
			persistence: "localStorage",
		});
	},
	identify: (user: User) => {
		mixpanel.identify(user.uid);
		mixpanel.people.set({
			$name: user.displayName ?? user.email,
			$email: user.email,
			isAnonymous: user.isAnonymous,
			tenantId: user.tenantId,
		});
	},
	track: (event: events, data: object) => {
		mixpanel.track(event, {
			...data,
			MODE: CONFIG.MODE,
		});
	},
};
