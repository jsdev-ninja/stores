import {
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";
import clsx from "classnames";

export function Select({
	query = "",
	value,
	onChange,
	onInputChange,
	children = [],
	placeholder = "",
	displayValue,
	multiple = false,
}: any) {
	const inputStyle = classNames([
		"w-full   p-2",
		"shadow rounded",
		"text-gray-500",
		"bg-gray-100",
	]);

	console.log(query);

	return (
		<div className="w-full h-12 p-2">
			<Combobox
				multiple={multiple ?? undefined}
				value={value}
				onChange={onChange}
				onClose={() => onInputChange?.("")}
				immediate
			>
				<div className="relative">
					<ComboboxInput
						placeholder={placeholder}
						className={inputStyle}
						displayValue={displayValue ?? undefined}
						onChange={(event) => onInputChange?.(event.target.value)}
					/>
					<ComboboxButton className="group absolute inset-y-0 left-0 px-2.5">
						<ChevronDownIcon className="size-4" />
					</ComboboxButton>
				</div>

				<ComboboxOptions
					anchor="bottom"
					transition
					className={clsx(
						" bg-gray-700 shadow w-[var(--input-width)] rounded border border-white/5  p-1 [--anchor-gap:var(--spacing-1)] empty:invisible ",

						"transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
					)}
				>
					{children}
				</ComboboxOptions>
			</Combobox>
		</div>
	);
}

Select.Item = function SelectItem({ children, value }: any) {
	return (
		<ComboboxOption
			value={value}
			className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
		>
			<CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
			<div className="text-sm/6 text-white">{children}</div>
		</ComboboxOption>
	);
};
