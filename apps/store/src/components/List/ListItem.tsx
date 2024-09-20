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
					"flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100 dark:bg-neutral-700 dark:text-white",
					{
						"bg-secondary-main text-secondary-contrastText cursor-pointer": state.isSelected,
					},
				]);
			}}
		>
			{children}
		</ListBoxItem>
	);
}
