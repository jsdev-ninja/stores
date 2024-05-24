const { mauve, violet, blackA } = require("@radix-ui/colors");

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				...mauve,
				...violet,
				...blackA,
				primary: {
					light: "#7986cb",
					main: "#3f51b5",
					dark: "#303f9f",
					contrastText: "#fff",
				},
				secondary: {
					light: "#ff4081",
					main: "#f50057",
					dark: "#c51162",
					contrastText: "#fff",
				},
				error: {
					light: "#e57373",
					main: "#f44336",
					dark: "#d32f2f",
					contrastText: "#fff",
				},
				warning: {
					light: "#ffb74d",
					main: "#ff9800",
					dark: "#f57c00",
					contrastText: "#fff",
				},
				info: {
					light: "#64b5f6",
					main: "#2196f3",
					dark: "#1976d2",
					contrastText: "#fff",
				},
				success: {
					light: "#81c784",
					main: "#4caf50",
					dark: "#388e3c",
					contrastText: "#fff",
				},
				text: {
					primary: "#212121",
					secondary: "#757575",
					disabled: "#bdbdbd",
				},
				background: {
					default: "#fafafa",
					paper: "#f4f6fa",
				},
				divider: "#e0e0e0",
			},
			spacing: {
				0: "0px",
				1: "4px",
				2: "8px",
				3: "12px",
				4: "16px",
				5: "20px",
				6: "24px",
				7: "28px",
				8: "32px",
				9: "36px",
				10: "40px",
			},
			fontFamily: {
				// sans: ['"Roboto"', ...fontFamily.sans],
			},
			fontSize: {
				xs: ["0.75rem", { lineHeight: "1rem" }],
				sm: ["0.875rem", { lineHeight: "1.25rem" }],
				base: ["1rem", { lineHeight: "1.5rem" }],
				lg: ["1.125rem", { lineHeight: "1.75rem" }],
				xl: ["1.25rem", { lineHeight: "1.75rem" }],
				"2xl": ["1.5rem", { lineHeight: "2rem" }],
				"3xl": ["1.875rem", { lineHeight: "2.25rem" }],
				"4xl": ["2.25rem", { lineHeight: "2.5rem" }],
				"5xl": ["3rem", { lineHeight: "1" }],
				"6xl": ["3.75rem", { lineHeight: "1" }],
				"7xl": ["4.5rem", { lineHeight: "1" }],
				"8xl": ["6rem", { lineHeight: "1" }],
				"9xl": ["8rem", { lineHeight: "1" }],
			},
			screens: {
				xs: "0px",
				sm: "600px",
				md: "960px",
				lg: "1280px",
				xl: "1920px",
			},
		},
	},
	plugins: [],
};
