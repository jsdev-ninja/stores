import React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useController, useFormContext } from "react-hook-form";
import classNames from "classnames";

export const Select = ({ children, name, placeholder }) => {
	const form = useFormContext();

	const selectStyle = classNames([
		"w-full h-12, p-2",
		"shadow rounded",
		"text-gray-500",
		"bg-gray-100",
		"flex items-center justify-between",
	]);

	const control = useController({ name });

	return (
		<RadixSelect.Root onValueChange={control.field.onChange}>
			<RadixSelect.Trigger className={selectStyle} aria-label={name}>
				<RadixSelect.Value placeholder={placeholder} />
				<RadixSelect.Icon className="text-primary-main">
					<ChevronDownIcon />
				</RadixSelect.Icon>
			</RadixSelect.Trigger>
			<RadixSelect.Portal>
				<RadixSelect.Content className="overflow-hidden bg-white rounded-md">
					<RadixSelect.Viewport className="">{children}</RadixSelect.Viewport>
				</RadixSelect.Content>
			</RadixSelect.Portal>
		</RadixSelect.Root>
	);
};

const SelectItem = React.forwardRef(({ children, ...props }, forwardedRef) => {
	return (
		<RadixSelect.Item
			className={classnames(
				"flex items-center select-none justify-between h-12  bg-white hover:bg-secondary-main p-2 "
			)}
			{...props}
			ref={forwardedRef}
		>
			<RadixSelect.ItemText>{children}</RadixSelect.ItemText>
			<RadixSelect.ItemIndicator className="inline-flex items-center justify-center">
				<CheckIcon />
			</RadixSelect.ItemIndicator>
		</RadixSelect.Item>
	);
});

Select.Item = SelectItem;
