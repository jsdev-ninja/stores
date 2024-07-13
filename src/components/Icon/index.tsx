import { tv, type VariantProps } from "tailwind-variants";

const icons = {
	search: (
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
		/>
	),
	close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />,
	userCircle: (
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
		/>
	),
};

const style = tv({
	base: "cursor-pointer",
	variants: {
		size: {
			sm: "size-4",
			md: "size-6",
			lg: "size-8",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

type StyleVariants = VariantProps<typeof style>;

type IconProps = StyleVariants & {
	name: keyof typeof icons;
	onClick?: () => void;
};

export function Icon(props: IconProps) {
	const { name, onClick } = props;

	const path = icons[name];

	return (
		<svg
			onClick={onClick}
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className={style(props)}
		>
			{path}
		</svg>
	);
}
