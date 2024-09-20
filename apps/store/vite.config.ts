import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		sentryVitePlugin({
			org: "jsdev-s7",
			project: "javascript-react",
		}),
	],

	resolve: {
		alias: {
			src: "/src",
		},
	},

	build: {
		sourcemap: true,
	},
});
