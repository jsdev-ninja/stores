type Props = {
	date: number;
	className?: string;
};

const formatter = new Intl.DateTimeFormat("he-IL", {
	timeStyle: "short",
	dateStyle: "short",
});

export function DateView(props: Props) {
	const { date, className } = props;

	const _date = formatter.format(new Date(date));

	return <div className={className}>{_date}</div>;
}
