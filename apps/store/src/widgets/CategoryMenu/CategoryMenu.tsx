import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";

import * as Accordion from "@radix-ui/react-accordion";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { TCategory } from "@jsdev_ninja/core";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { navigate, useParams } from "src/navigation";
import { useMemo } from "react";

// Helper function to flatten categories
function flattenCategories(categories: TCategory[]): TCategory[] {
	const result: TCategory[] = [];
	categories.forEach((category) => {
		result.push(category);
		if (category.children && category.children.length > 0) {
			result.push(...flattenCategories(category.children));
		}
	});
	return result;
}

export function CategoryMenu({ isAdmin }: { isAdmin?: boolean }) {
	const { t } = useTranslation(["common"]);
	const categories = useAppSelector(CategorySlice.selectors.selectCategories);
	const params = useParams(isAdmin ? "admin.products" : "store.catalog");

	// Get current category name for the main title
	const currentCategoryName = useMemo(() => {
		if (!categories.length) return null;

		const flattenedCategories = flattenCategories(categories);
		
		// Find the deepest selected category
		for (let i = 5; i >= 1; i--) {
			const categoryId = params[`category${i}` as keyof typeof params] as string;
			if (categoryId) {
				const category = flattenedCategories.find((c) => c.id === categoryId);
				if (category) {
					return category.locales[0]?.value || categoryId;
				}
			}
		}
		return null;
	}, [categories, params]);

	// Build breadcrumb items from selected categories
	const breadcrumbItems = useMemo(() => {
		const items: Array<{ id: string; name: string; depth: number }> = [];

		// Add "Catalog" as first item (always visible)
		items.push({
			id: "",
			name: t("common:products"),
			depth: 0,
		});

		// Add selected categories in order if categories are available
		if (categories.length) {
			const flattenedCategories = flattenCategories(categories);

			for (let i = 1; i <= 5; i++) {
				const categoryId = params[`category${i}` as keyof typeof params] as string;
				if (categoryId) {
					const category = flattenedCategories.find((c) => c.id === categoryId);
					if (category) {
						items.push({
							id: categoryId,
							name: category.locales[0]?.value || categoryId,
							depth: i,
						});
					}
				}
			}
		}

		return items;
	}, [categories, params, t]);

	const handleBreadcrumbClick = (item: { id: string; depth: number }) => {
		if (!item.id) {
			// Navigate to catalog root
			navigate({
				to: isAdmin ? "admin.products" : "store.catalog",
				params: {
					category1: "",
					category2: "",
					category3: "",
					category4: "",
					category5: "",
				},
			});
		} else {
			// Navigate to the selected category level
			const newParams: any = {};
			for (let i = 1; i <= item.depth; i++) {
				newParams[`category${i}`] = params[`category${i}` as keyof typeof params] || "";
			}
			// Clear deeper levels
			for (let i = item.depth + 1; i <= 5; i++) {
				newParams[`category${i}`] = "";
			}
			// Set the clicked category
			newParams[`category${item.depth}`] = item.id;

			navigate({
				to: isAdmin ? "admin.products" : "store.catalog",
				params: newParams,
			});
		}
	};

	function onChange(name: string, depth: number) {
		const isSelected = params[`category${(depth + 1) as 1 | 2 | 3 | 4 | 5}`] === name;

		// clean children
		const newParams: any = {};
		for (let i = depth + 2; i <= 5; i++) {
			newParams[`category${i}`] = "";
		}

		navigate({
			to: isAdmin ? "admin.products" : "store.catalog",
			params: {
				...params,
				[`category${depth + 1}`]: isSelected ? "" : name,
				...newParams,
			},
		});
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Breadcrumbs */}
			<div className="w-full">
				<Breadcrumbs>
					{breadcrumbItems.map((item, index) => (
						<BreadcrumbItem
							key={item.id || "home"}
							onPress={() => handleBreadcrumbClick(item)}
							className={index === breadcrumbItems.length - 1 ? "font-semibold" : ""}
						>
							{item.name}
						</BreadcrumbItem>
					))}
				</Breadcrumbs>
			</div>

			{/* Current Category Title */}
			{currentCategoryName && (
				<h1 className="text-4xl font-bold text-gray-900 w-full text-right">
					{currentCategoryName}
				</h1>
			)}

			{/* Category Accordion Menu */}
			<Accordion.Root
				onValueChange={(value) => {
					onChange(value, 0);
				}}
				type="single"
				className="flex flex-col gap-2"
				collapsible
				value={params.category1}
			>
				{categories.map((category) => {
					return (
						<Category
							isAdmin={isAdmin}
							key={category.id}
							onChange={onChange}
							category={category}
						/>
					);
				})}
			</Accordion.Root>
		</div>
	);
}

function Category({
	category,
	onChange,
	isAdmin,
}: {
	isAdmin?: boolean;
	category: TCategory;

	onChange: (name: string, depth: number) => void;
}) {
	const params = useParams(isAdmin ? "admin.products" : "store.catalog");
	const key: keyof typeof params = `category${(category.depth + 1) as 1 | 2 | 3 | 4 | 5}`; //todo
	const value = params[key];
	const isSelected = value === category.id;

	return (
		<Accordion.Item key={category.id} value={category.id}>
			<Accordion.Trigger
				className={classNames("px-4 py-1 hover:text-gray-500 text-right", {
					"bg-gray-100 rounded-md": isSelected,
				})}
			>
				{category.locales[0].value}
			</Accordion.Trigger>
			{!!category.children.length && (
				<Accordion.Content className="mt-4">
					<div className="flex flex-col gap-2">
						<Accordion.Root
							value={value}
							onValueChange={(id) => {
								onChange(id, category.depth + 1);
							}}
							type="single"
							collapsible
							className="flex flex-col gap-2 ps-4"
						>
							{category.children.map((childCategory) => {
								return (
									<Category
										isAdmin={isAdmin}
										onChange={onChange}
										category={childCategory}
										key={childCategory.id}
									/>
								);
							})}
						</Accordion.Root>
					</div>
				</Accordion.Content>
			)}
		</Accordion.Item>
	);
}
