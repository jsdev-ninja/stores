import { initializeApp } from "firebase/app";

const firebaseConfig = {
	apiKey: "AIzaSyAXtA4pdBs7GLX45lK3jYZRiUwo7M06-_s",
	authDomain: "jsdev-stores-prod.firebaseapp.com",
	projectId: "jsdev-stores-prod",
	storageBucket: "jsdev-stores-prod.appspot.com",
	messagingSenderId: "333321054844",
	appId: "1:333321054844:web:7d3c15617daa54107537f9",
	measurementId: "G-CJ44QNETK8",
};

export const app = initializeApp(firebaseConfig);

// Analytics must be initialized lazily — only in browser, after hydration
if (typeof window !== "undefined") {
	import("firebase/analytics").then(({ getAnalytics }) => {
		getAnalytics(app);
	});
}
