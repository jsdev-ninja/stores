export const formatter = {
	price(value: number = 0) {
		return new Intl.NumberFormat("he-IL", {
			style: "currency",
			currency: "ILS",
		}).format(value);
	},
};
