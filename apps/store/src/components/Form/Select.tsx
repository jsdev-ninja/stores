/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode, useMemo } from "react";
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

	// Build a value -> label map from the rendered <Select.Item> children so the
	// combobox input can display the human-readable label of the saved value.
	// Without this, the underlying Combobox shows the raw enum code (or nothing),
	// which makes a saved selection (e.g. a "kg" price type) look unset.
	const labelByValue = useMemo(() => {
		const map = new Map<unknown, ReactNode>();
		React.Children.forEach(children, (child) => {
			if (React.isValidElement(child) && (child.props as any)?.value !== undefined) {
				map.set((child.props as any).value, (child.props as any).children);
			}
		});
		return map;
	}, [children]);

	const resolvedDisplayValue =
		displayValue ??
		((value: any): string => {
			if (Array.isArray(value)) {
				return value.map((v) => labelByValue.get(v) ?? v).join(", ");
			}
			if (value === undefined || value === null || value === "") return "";
			const itemLabel = labelByValue.get(value);
			return (itemLabel as string) ?? String(value);
		});

	return (
		<BaseSelect
			displayValue={resolvedDisplayValue}
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

Select.Item = BaseSelect.Item;
