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
};
