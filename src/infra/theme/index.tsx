type TTheme = {
	colors: {
		primary: string;
		onPrimary: string;
		secondary: string;
		onSecondary: string;
	};
};

export const useTheme = (): TTheme => {
	return {
		colors: {
			onPrimary: "",
			onSecondary: "",
			primary: "",
			secondary: "",
		},
	};
};
