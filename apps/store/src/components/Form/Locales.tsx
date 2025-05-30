/* eslint-disable @typescript-eslint/no-explicit-any */
import classNames from "classnames";
import { useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

// Recursive type to extract nested keys including array indices

// Extract keys as type

// `${K}` | `${K}[${number}]` | K[number] extends object
// 						? `${K}[${number}].${NestedKeys<U>}`
// 						: never

type Props<T extends object> = {
	name: NestedKeys<T>;
	placeholder?: string;
	label?: string;
	type?: string;
};

export function Locales<T extends object>(props: Props<T>) {
	const { name, label, placeholder, type } = props;

	const methods = useFormContext();

	const inputStyle = classNames([
		"w-full h-12, p-2",
		"shadow rounded",
		"text-gray-500",
		"bg-gray-100",
	]);

	const form = useFormContext();

	const state = form.getFieldState(name);

	return (
		<div className="flex flex-col  gap-2">
			<label htmlFor={name}>{label}</label>
			<input
				id={name}
				{...methods.register("locales[0].value")}
				step=".01"
				placeholder={placeholder}
				type={type}
				className={inputStyle}
			/>
			<div className="text-error-main text-sm">{state.error?.message?.toString() ?? ""}</div>
		</div>
	);
}
