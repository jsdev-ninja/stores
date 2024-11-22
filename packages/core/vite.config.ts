import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
	plugins: [react()],

	build: {
		lib: {
			entry: resolve(__dirname, "lib/index.tsx"),
			name: "core",
			formats: ["es", "cjs", "umd"],
			fileName: (format) => `core.${format}.js`,
		},
		rollupOptions: {
			external: ["react", "react-dom"], // Exclude dependencies from the bundle
			output: {
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
				},
			},
		},
		sourcemap: true,
		minify: "esbuild",
	},
});
