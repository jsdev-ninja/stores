import { useAppApi } from "src/appApi";
import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";

import * as Accordion from "@radix-ui/react-accordion";
import { Button } from "src/components/button";
import { TCategory } from "@jsdev_ninja/core";
import { useEffect, useState } from "react";

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
	const appApi = useAppApi();

	const categories = useAppSelector(CategorySlice.selectors.selectCategories);

	console.log("categories", categories);

	function onChange(name: string, depth: number) {
		console.log(name, depth);
		onValueChange?.({
			...value,
			[depth]: name,
		});
	}

	return (
		<div className="">
			<Accordion.Root
				onValueChange={(value) => {
					onChange(value, 0);
				}}
				type="single"
			>
				{categories.map((category) => {
					return <Category onChange={onChange} category={category} />;
				})}
			</Accordion.Root>
		</div>
	);
}

function Category({ category, onChange }: { category: TCategory }) {
	return (
		<Accordion.Item key={category.tag} className="ps-4" value={category.locales[0].value}>
			<Accordion.Trigger>{category.locales[0].value}</Accordion.Trigger>
			<Accordion.Content>
				<div className="flex flex-col gap-2">
					<Accordion.Root
						onValueChange={(value) => {
							onChange(value, category.depth + 1);
						}}
						type="single"
					>
						{category.children.map((childCategory) => {
							return <Category category={childCategory} key={childCategory.id} />;
						})}
					</Accordion.Root>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	);
}
