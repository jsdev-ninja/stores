import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
	// https://vike.dev/head-tags
	title: "jsdev stores",
	description: "חנות אונליין",
	prerender: true,
	ssr: false,
	htmlAttributes: {
		lang: "he",
		dir: "rtl",
	},

	extends: [vikeReact],
} satisfies Config;
