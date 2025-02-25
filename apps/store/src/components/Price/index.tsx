type Props = {
	price: number;
	currency?: string;
	locale?: string;
	className?: string;
};
export function Price(props: Props) {
	const { price, currency = "ILS", locale = "he-IL", className } = props;
	const priceView = new Intl.NumberFormat(locale, {
		style: "currency",
		currency: currency,
	}).format(price);
	return <p className={className}>{priceView}</p>;
}
