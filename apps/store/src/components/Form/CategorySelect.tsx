/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import classnames from "classnames";
import { CheckIcon } from "@radix-ui/react-icons";
import { useController, useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

import { Select as BaseSelect } from "../Select/Select";
import { TCategory } from "src/domains/Category";
import { flattenTree } from "src/widgets/Category/CategoryTree/utils";

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

	const _categories = flattenTree(categories);

	const selectedCategories = control.field.value as TCategory[];

	return (
		<BaseSelect
			displayValue={displayValue}
			multiple
			label={label}
			onChange={(newValue: TCategory[]) => {
				function removeDuplicatesById(arr: any) {
					const seen = new Set();
					return arr.filter((item: any) => {
						if (seen.has(item.id)) {
							return false;
						}
						seen.add(item.id);
						return true;
					});
				}

				function findAllParents(category?: TCategory, prev: TCategory[] = []) {
					const parent = _categories.find((c) => c.id === category?.parentId);

					if (!parent) return prev;
					return findAllParents(parent, prev.concat([parent]));
				}
				function findAllChildren(category?: TCategory, prev: TCategory[] = []): TCategory[] {
					if (!category?.children.length) return prev;
					return category.children
						.map((c) => findAllChildren(c, prev.concat(category.children)))
						.flat();
				}

				const removedCategories = selectedCategories.filter(
					(newCategory) => !newValue.find((s) => s.id === newCategory.id)
				);

				const newCategories = newValue.filter(
					(newCategory) => !selectedCategories.find((s) => s.id === newCategory.id)
				);

				const allParents = removeDuplicatesById(
					newCategories.map((c) => findAllParents(c, [])).flat()
				);

				console.log("allParents", allParents);

				const childToRemove = removeDuplicatesById(
					removedCategories.map((c) => findAllChildren(c, [])).flat()
				);

				const result = newValue.concat(allParents).filter((c) =>
					childToRemove.length
						? !childToRemove.find((cat: TCategory) => {
								if (cat.id === c.id) {
									return true;
								}
								return false;
						  })
						: true
				);

				return form.setValue(name, removeDuplicatesById(result) as any);
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
