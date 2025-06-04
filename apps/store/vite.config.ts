import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		legacy({ polyfills: true }),
		react(),
		tsconfigPaths(),
		sentryVitePlugin({
			org: "jsdev-s7",
			project: "stores",
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
	server: {
		port: 5173,
	},
});
