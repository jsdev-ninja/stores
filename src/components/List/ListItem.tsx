import classNames from "classnames";
import { ReactNode } from "react";
import { ListBoxItem } from "react-aria-components";

type Props<T> = {
	children: ReactNode;
	value?: T;
	onClick?: (value: T | undefined) => void;
};

export function ListItem<T>({ children, value, onClick }: Props<T>) {
	return (
		<ListBoxItem
			onAction={() => {
				onClick?.(value);
			}}
			className={(state) => {
				return classNames([
					"cursor-pointer py-2 px-4 font-bold",
					{
						"bg-gray-100": state.isHovered,
						"bg-secondary-main text-secondary-contrastText": state.isSelected,
					},
				]);
			}}
		>
			{children}
		</ListBoxItem>
	);
}
