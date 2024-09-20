/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { CheckIcon } from "@radix-ui/react-icons";
import { useController, useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

import { Select as BaseSelect } from "../Select/Select";

export const Select = <T,>({
	children,
	name,
	placeholder,
	multiple = false,
	displayValue,
	label,
}: {
	name: NestedKeys<T>;
	placeholder?: string;
	label?: string;
	children: ReactNode;
	multiple?: boolean;
	displayValue?: any;
}) => {
	const control = useController({ name });

	const form = useFormContext();

	return (
		<BaseSelect
			displayValue={displayValue}
			multiple={multiple}
			onChange={(newValue: any) => {
				if (multiple && Array.isArray(newValue)) {
					return form.setValue(name, newValue.flat() as any);
				}
				control.field.onChange(newValue);
			}}
			placeholder={placeholder}
			label={label}
			value={control.field.value}
		>
			{children}
		</BaseSelect>
	);
};

export const SelectItem = React.forwardRef<any, any>(({ children, ...props }, forwardedRef) => {
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
