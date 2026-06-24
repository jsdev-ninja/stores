export const formatter = {
	price(value: number = 0) {
		return new Intl.NumberFormat("he-IL", {
			style: "currency",
			currency: "ILS",
		}).format(value);
	},
	date(value?: number | undefined) {
		if (!value) return "";
		return new Date(value).toLocaleDateString("he-IL", {});
	},
	// Clean display for item quantities/weights. Float arithmetic can leave a long
	// tail (e.g. 1.9249999999999998 instead of 1.925); round to 3 decimals and drop
	// trailing zeros so weights show as "1.925", "1.59", "5".
	qty(value: number = 0) {
		return new Intl.NumberFormat("he-IL", {
			maximumFractionDigits: 3,
		}).format(value);
	},
};
