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
	label = "",
	value,
	onChange,
	onInputChange,
	children = [],
	placeholder = "",
	displayValue,
	multiple = false,
}: any) {
	const inputStyle = classNames([
		"flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
	]);

	return (
		<div className="w-full flex flex-col gap-2">
			{!!label && (
				<label className="block text-sm font-medium text-gray-900 dark:text-white" htmlFor="">
					{label}
				</label>
			)}
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
						" bg-gray-700 z-50 shadow w-[var(--input-width)] rounded border border-white/5  p-1 [--anchor-gap:var(--spacing-1)] empty:invisible ",

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
