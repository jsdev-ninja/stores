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
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: ["tsconfig.json", "tsconfig.dev.json"],
		sourceType: "module",
	},
	ignorePatterns: [
		"/lib/**/*", // Ignore built files.
	],
	rules: {
		quotes: "off",
		"import/no-unresolved": 0,
		"no-tabs": "off",
		"object-curly-spacing": 0,
		indent: ["error", "tab"],
		"quote-props": ["error", "as-needed"],
		"require-jsdoc": "off",
		"spaced-comment": "off",
		"operator-linebreak": "off",
		"@typescript-eslint/no-explicit-any": "off",
		camelcase: "off",
	},
};
