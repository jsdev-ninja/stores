module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"google",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	plugins: ["boundaries"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: ["tsconfig.json", "tsconfig.dev.json"],
		sourceType: "module",
	},
	ignorePatterns: [
		"/lib/**/*", // Ignore built files.
		"/src/services/documents/dev-preview/**/*",
		"/src/services/documents/dist/**/*",
		"**/dev-preview/**/*",
		"**/dev-preview/**",
		"**/dist/dev-preview*",
	],
	settings: {
		"boundaries/elements": [
			{ type: "platform",    pattern: "src/platform/*",    mode: "folder" },
			{ type: "module",      pattern: "src/modules/*",     mode: "folder" },
			{ type: "integration", pattern: "src/integration/*", mode: "folder" },
			{ type: "legacy", pattern: [
				"src/api/**",
				"src/appApi/**",
				"src/services/**",
				"src/events/**",
				"src/emails/**",
				"src/emails-preview/**",
				"src/schema/**",
				"src/core/**",
				"src/index.tsx",
			]},
		],
		"boundaries/ignore": [
			"src/**/example.ts",  // dead-code reference files — exempt from boundary rules
		],
	},
	rules: {
		quotes: "off",
		"import/no-unresolved": 0,
		"no-tabs": "off",
		"object-curly-spacing": 0,
		indent: ["warn", "tab"],
		"quote-props": ["error", "as-needed"],
		"require-jsdoc": "off",
		"valid-jsdoc": "off",
		"spaced-comment": "off",
		"operator-linebreak": "off",
		"@typescript-eslint/no-explicit-any": "off",
		camelcase: "off",
		"boundaries/element-types": ["error", {
			default: "disallow",
			rules: [
				// Platform is the base — can import other platform only (e.g. audit uses eventBus)
				{ from: ["platform"], allow: ["platform"] },

				// Modules can import platform + other modules (via their public index)
				{ from: ["module"], allow: ["platform", "module"] },

				// Integration can import platform + modules
				{ from: ["integration"], allow: ["platform", "module"] },

				// Legacy can import anything — warn-only via overrides
				{ from: ["legacy"], allow: ["platform", "module", "integration", "legacy"] },
			],
		}],
		"boundaries/entry-point": ["error", {
			default: "disallow",
			rules: [
				{ target: ["module"],      allow: "index.ts" },
				{ target: ["platform"],    allow: "index.ts" },
				{ target: ["integration"], allow: "index.ts" },
				{ target: ["legacy"],      allow: "*" },
			],
		}],
	},
	overrides: [
		{
			files: [
				"src/api/**",
				"src/appApi/**",
				"src/services/**",
				"src/events/**",
				"src/emails/**",
				"src/emails-preview/**",
				"src/schema/**",
				"src/core/**",
				"src/index.tsx",
			],
			rules: {
				"boundaries/element-types": "warn",
				"boundaries/entry-point": "warn",
			},
		},
		// Subscribers that bridge module → legacy email/service during migration
		// are exempt from boundary errors. They are transient wrappers that will
		// be removed once the legacy inline call is deleted.
		{
			files: ["src/modules/**/subscribers/**"],
			rules: {
				"boundaries/element-types": "warn",
				"boundaries/entry-point": "warn",
			},
		},
		// Module internals that still reach into legacy during migration are
		// exempt from boundary errors. Remove once legacy services are migrated.
		{
			files: ["src/modules/**/internal/**"],
			rules: {
				"boundaries/element-types": "warn",
				"boundaries/entry-point": "warn",
			},
		},
	],
};
