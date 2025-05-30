/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { CheckIcon } from "@radix-ui/react-icons";
import { FieldPath, FieldValues, useController, useFormContext } from "react-hook-form";
import { Select as BaseSelect } from "../Select/Select";
import { TCategory } from "@jsdev_ninja/core";

export const CategorySelect = <T extends FieldValues>({
	children,
	name,
	placeholder,
	label,
	displayValue,
}: {
	name: FieldPath<T>;
	placeholder?: string;
	label?: string;
	children: ReactNode;
	multiple?: boolean;
	displayValue?: any;
	categories: TCategory[];
}) => {
	const control = useController({ name });

	const form = useFormContext();

	return (
		<BaseSelect
			displayValue={displayValue}
			multiple
			label={label}
			onChange={(newValue: TCategory[]) => {
				console.log("newValue", newValue);
				return form.setValue(name, newValue as any);
			}}
			placeholder={placeholder}
			value={control.field.value}
		>
			{children}
		</BaseSelect>
	);
};

export const SelectItem = React.forwardRef<any, any>(({ children, ...props }, forwardedRef) => {
	return (
		<RadixSelect.Item
			value={props.value}
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

CategorySelect.Item = BaseSelect.Item;
