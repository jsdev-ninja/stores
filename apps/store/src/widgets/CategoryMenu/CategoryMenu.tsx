import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";

import * as Accordion from "@radix-ui/react-accordion";
import { TCategory } from "@jsdev_ninja/core";
import classNames from "classnames";

export function CategoryMenu({
	value,
	onValueChange,
}: {
	value: {
		0: string;
		1: string;
		2: string;
		3: string;
		4: string;
	};
	onValueChange:
		| ((value: { 0: string; 1: string; 2: string; 3: string; 4: string }) => void)
		| undefined;
}) {
	const categories = useAppSelector(CategorySlice.selectors.selectCategories);

	function onChange(name: string, depth: number) {
		const isSelected = (value as any)[depth] === name;

		let newValue = { ...value };

		for (let i = depth + 1; i < 4; i++) {
			newValue[i as keyof typeof value] = "";
		}

		onValueChange?.({
			...newValue,
			[depth]: isSelected ? "" : name,
		});
	}

	return (
		<Accordion.Root
			onValueChange={(value) => {
				onChange(value, 0);
			}}
			type="single"
			className="flex flex-col gap-2"
			collapsible
			value={value[0]}
		>
			{categories.map((category) => {
				return (
					<Category key={category.id} value={value} onChange={onChange} category={category} />
				);
			})}
		</Accordion.Root>
	);
}

function Category({
	category,
	value,
	onChange,
}: {
	category: TCategory;
	value: {
		0: string;
		1: string;
		2: string;
		3: string;
		4: string;
	};
	onChange: (name: string, depth: number) => void;
}) {
	const selected = value[category.depth as keyof typeof value] as string;
	const isSelected = selected === category.locales[0].value;

	return (
		<Accordion.Item key={category.tag} value={category.locales[0].value}>
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
							value={value[category.depth as keyof typeof value]}
							onValueChange={(value) => {
								onChange(value, category.depth + 1);
							}}
							type="single"
							collapsible
							className="flex flex-col gap-2 ps-4"
						>
							{category.children.map((childCategory) => {
								return (
									<Category
										value={value}
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
