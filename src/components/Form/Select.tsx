/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { useController, useFormContext } from "react-hook-form";
import classNames from "classnames";
import { NestedKeys } from "src/shared/types";

import { Select as BaseSelect } from "../Select/Select";

export const Select = <T,>({
	children,
	name,
	placeholder,
	multiple = false,
	displayValue,
}: {
	name: NestedKeys<T>;
	placeholder?: string;
	children: ReactNode;
	multiple?: boolean;
	displayValue: any;
}) => {
	const selectStyle = classNames([
		"w-full h-12, p-2",
		"shadow rounded",
		"text-gray-500",
		"bg-gray-100",
		"flex items-center justify-between",
	]);

	const control = useController({ name });

	const form = useFormContext();

	return (
		<BaseSelect
			displayValue={displayValue}
			multiple={multiple}
			onChange={(newValue) => {
				console.log("newValue", newValue);

				if (multiple && Array.isArray(newValue)) {
					return form.setValue(name, newValue.flat());
				}
				control.field.onChange(newValue);
			}}
			placeholder={placeholder}
			value={control.field.value}
		>
			{children}
		</BaseSelect>
	);

	return (
		<RadixSelect.Root value={control.field.value} onValueChange={control.field.onChange}>
			<RadixSelect.Trigger className={selectStyle} aria-label={name}>
				<RadixSelect.Value placeholder={placeholder} />
				<RadixSelect.Icon className="text-primary-main">
					<ChevronDownIcon />
				</RadixSelect.Icon>
			</RadixSelect.Trigger>
			<RadixSelect.Portal>
				<RadixSelect.Content
					position="item-aligned"
					className="overflow-hidden bg-white rounded-md "
				>
					<RadixSelect.Viewport className="">{children}</RadixSelect.Viewport>
				</RadixSelect.Content>
			</RadixSelect.Portal>
		</RadixSelect.Root>
	);
};

const SelectItem = React.forwardRef<any, any>(({ children, ...props }, forwardedRef) => {
	return (
		<RadixSelect.Item
			className={classnames(
				"flex items-center select-none justify-between h-12  bg-white hover:bg-primary-main p-2 "
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

Select.Item = BaseSelect.Item;
