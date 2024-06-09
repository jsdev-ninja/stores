import classNames from "classnames";
import { ReactNode } from "react";

import { tv } from "tailwind-variants";
type Props = {
	children: ReactNode;
	fullWidth?: boolean;
	onClick?: () => void;
	size?: "sm" | "md";
	className?: string;
};

export function Button(props: Props) {
	const { children, fullWidth, size = "md", onClick } = props;

	const style = tv({
		base: classNames([
			"block box-border transition-all",
			"shadow  rounded-lg bg-primary-main text-white px-4 py-2 text-lg text-center",
			"hover:bg-primary-dark",
			"active:bg-primary-light active:shadow-none active:scale-95",
			{
				"w-full": fullWidth,
			},
		]),
		variants: {
			size: {
				sm: "h-9",
				md: "h-12",
			},
		},
	});

	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onClick?.();
			}}
			className={style({ size })}
		>
			{children}
		</button>
	);
}

export function IconButton(props: Props) {
	const { children, className, size = "md", onClick } = props;

	const style = tv({
		base: classNames([
			"block box-border transition-all  flex-shrink-0",
			"shadow  rounded-lg bg-primary-main text-white text-lg text-center",
			"hover:bg-primary-dark",
			"active:bg-primary-light active:shadow-none active:scale-95",
			{},
			className,
		]),
		variants: {
			size: {
				sm: "h-9 w-9",
				md: "h-12 w-12",
			},
		},
	});

	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onClick?.();
			}}
			className={style({ size })}
		>
			{children}
		</button>
	);
}

export function InputButton(props: {
	value: number;
	onChange: (value: number, type: "increase" | "decrease") => void;
	size?: "sm" | "md";
}) {
	const { onChange, value, size = "md" } = props;

	return (
		<div className="flex w-full items-center">
			<IconButton
				className="rounded-none rounded-s-lg"
				onClick={() => onChange(value - 1, "decrease")}
				size={size}
			>
				-
			</IconButton>
			<div
				className={classNames([
					"flex-grow text-white flex items-center justify-center bg-primary-main",
					{ "h-9 w-9": size == "sm" },
					{ "h-12 w-12": size == "md" },
				])}
				onClick={(e) => e.stopPropagation()}
			>
				{value}
			</div>
			<IconButton
				className=" rounded-none rounded-e-lg"
				onClick={() => onChange(value + 1, "increase")}
				size={size}
			>
				+
			</IconButton>
		</div>
	);
}
