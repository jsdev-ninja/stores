import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
	plugins: [react()],

	build: {
		lib: {
			entry: resolve(__dirname, "lib/index.ts"),
			name: "core",
			formats: ["es", "cjs", "umd"],
			fileName: (format) => {
				if (format === "cjs") return "core.cjs";
				return `core.${format}.js`;
			},
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
