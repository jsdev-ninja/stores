// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
	apiKey: "AIzaSyAXtA4pdBs7GLX45lK3jYZRiUwo7M06-_s",
	authDomain: "jsdev-stores-prod.firebaseapp.com",
	projectId: "jsdev-stores-prod",
	storageBucket: "jsdev-stores-prod.appspot.com",
	messagingSenderId: "333321054844",
	appId: "1:333321054844:web:7d3c15617daa54107537f9",
	measurementId: "G-CJ44QNETK8",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
