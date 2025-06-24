import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";

import * as Accordion from "@radix-ui/react-accordion";
import { TCategory } from "@jsdev_ninja/core";
import classNames from "classnames";
import { navigate, useParams } from "src/navigation";

export function CategoryMenu({ isAdmin }: { isAdmin?: boolean }) {
	const categories = useAppSelector(CategorySlice.selectors.selectCategories);

	const params = useParams(isAdmin ? "admin.products" : "store.catalog");
	console.log("params", params);

	function onChange(name: string, depth: number) {
		console.log("on", name, depth);

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
	console.log("categories", categories);

	return (
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
				className={classNames("px-4 py-1 hover:text-gray-500", {
					"bg-gray-100  rounded-md": isSelected,
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
