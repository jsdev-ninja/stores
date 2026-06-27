// Import the functions you need from the SDKs you need
import { getApps, getApp, initializeApp } from "firebase/app";

const firebaseConfig = {
	apiKey: "AIzaSyAXtA4pdBs7GLX45lK3jYZRiUwo7M06-_s",
	authDomain: "jsdev-stores-prod.firebaseapp.com",
	projectId: "jsdev-stores-prod",
	storageBucket: "jsdev-stores-prod.appspot.com",
	messagingSenderId: "333321054844",
	appId: "1:333321054844:web:7d3c15617daa54107537f9",
	measurementId: "G-CJ44QNETK8",
};

// Guard against re-initialization: during build-time prerender the module may
// be evaluated more than once in the same Node process. getApps() returns the
// already-registered apps so we can reuse the existing [DEFAULT] instance
// instead of calling initializeApp() a second time (which throws app/duplicate-app).
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// analytics uses window — guard against Node/prerender environment.
// Lazily initialized on first call in the browser.
let _analytics: ReturnType<typeof import("firebase/analytics").getAnalytics> | null = null;
export const getFirebaseAnalytics = async () => {
	if (typeof window === "undefined") return null;
	if (_analytics) return _analytics;
	const { getAnalytics } = await import("firebase/analytics");
	_analytics = getAnalytics(app);
	return _analytics;
};

// TESTER
