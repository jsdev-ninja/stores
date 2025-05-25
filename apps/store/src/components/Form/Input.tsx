/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";
import { tv } from "tailwind-variants";
import { ErrorMessage } from "./ErrorMessage";

type Props<T extends object> = {
	name: NestedKeys<T>;
	placeholder?: string;
	label?: string;
	type?: string;
	disabled?: boolean;
	startAdornment?: ReactNode;
	endAdornment?: ReactNode;
};

const style = tv({
	base: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
	variants: {
		withStartAdornment: {
			true: "rounded-s-none",
		},
		withEndAdornment: {
			true: "rounded-e-none",
		},
	},
});

export function Input<T extends object>(props: Props<T>) {
	const { name, label, placeholder, type, disabled, startAdornment, endAdornment } = props;

	const methods = useFormContext();

	return (
		<div className="flex flex-col w-full gap-2">
			{!!label && (
				<label
					className="block text-sm text-start font-medium text-gray-900 dark:text-white"
					htmlFor={name}
				>
					{label}
				</label>
			)}
			<div className="flex items-center">
				{!!startAdornment && (
					<div className="z-10 inline-flex shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700">
						{startAdornment}
					</div>
				)}
				<input
					disabled={disabled}
					id={name}
					{...methods.register(name, {
						valueAsNumber: type === "number",
						setValueAs:
							type === "date" ? (value: string) => new Date(value).getTime() : undefined,
					})}
					step=".01"
					placeholder={placeholder}
					type={type}
					className={style({
						withStartAdornment: !!startAdornment,
						withEndAdornment: !!endAdornment,
					})}
				/>
				{!!endAdornment && (
					<div className="z-10 inline-flex shrink-0 items-center rounded-e-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700">
						{endAdornment}
					</div>
				)}
			</div>
			<ErrorMessage name={name} />
		</div>
	);
}
