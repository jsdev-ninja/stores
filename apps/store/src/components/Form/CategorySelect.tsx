/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { CheckIcon } from "@radix-ui/react-icons";
import { useController, useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

import { Select as BaseSelect } from "../Select/Select";
import { TCategory } from "src/domains/Category";

export const CategorySelect = <T,>({
	children,
	name,
	placeholder,
	label,
	displayValue,
	categories,
}: {
	name: NestedKeys<T>;
	placeholder?: string;
	label?: string;
	children: ReactNode;
	multiple?: boolean;
	displayValue?: any;
	categories: TCategory[];
}) => {
	const control = useController({ name });

	const form = useFormContext();

	const selectedCategories = control.field.value as TCategory[];

	return (
		<BaseSelect
			displayValue={displayValue}
			multiple
			label={label}
			onChange={(newValue: TCategory[]) => {
				const newCategories = newValue.filter(
					(newCategory) => !selectedCategories.find((s) => s.id === newCategory.id)
				);

				const removedCategories = selectedCategories.filter(
					(newCategory) => !newValue.find((s) => s.id === newCategory.id)
				);

				const childToRemove = selectedCategories.filter((c) =>
					removedCategories.find((cat) => cat.id === c.parentId)
				);

				const parents = categories.filter((cat) => {
					return (
						newCategories.find((c) => c.parentId === cat.id) &&
						!selectedCategories.find((c) => c.id === cat.id)
					);
				});

				const result = newValue.concat(parents).filter((c) =>
					childToRemove.length
						? !childToRemove.find((cat) => {
								if (cat.id === c.id) {
									return true;
								}
								return false;
						  })
						: true
				);

				return form.setValue(name, result as any);
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
