import { defineConfig } from "vitest/config";
import * as path from "path";

// Minimal vitest config for the functions package.
// The package targets Node 22 + CommonJS; vitest runs the TS sources directly.
// Path aliases mirror functions/tsconfig.json so `src/*` and `@jsdev_ninja/core`
// resolve the same way under test as they do under tsc.
export default defineConfig({
	test: {
		environment: "node",
		globals: false,
		include: ["src/**/*.test.ts"],
	},
	resolve: {
		alias: {
			"@jsdev_ninja/core": path.resolve(
				__dirname,
				"../packages/core/lib/index.ts",
			),
			src: path.resolve(__dirname, "./src"),
		},
	},
});
