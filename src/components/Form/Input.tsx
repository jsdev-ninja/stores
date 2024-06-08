/* eslint-disable @typescript-eslint/no-explicit-any */
import classNames from "classnames";
import { useFormContext } from "react-hook-form";

type Props = {
	name: string;
	placeholder?: string;
	label?: string;
	type?: string;
};

export function Input(props: Props) {
	const { name, label, placeholder, type } = props;

	const methods = useFormContext();

	const inputStyle = classNames([
		"w-full h-12, p-2",
		"shadow rounded",
		"text-gray-500",
		"bg-gray-100",
	]);

	return (
		<div className="flex flex-col gap-2">
			<label htmlFor={name}>{label}</label>
			<input
				id={name}
				{...methods.register(name, {
					valueAsNumber: type === "number",
				})}
				placeholder={placeholder}
				type={type}
				className={inputStyle}
			/>
		</div>
	);
}
