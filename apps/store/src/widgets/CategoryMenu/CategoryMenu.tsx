import { useAppApi } from "src/appApi";
import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";

import { Accordion, AccordionItem } from "@nextui-org/react";
import { Button } from "src/components/button";

export default function App() {
	const defaultContent =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

	return (
		<Accordion variant="splitted">
			<AccordionItem key="1" aria-label="Accordion 1" title="Accordion 1">
				{defaultContent}
			</AccordionItem>
			<AccordionItem key="2" aria-label="Accordion 2" title="Accordion 2">
				{defaultContent}
			</AccordionItem>
			<AccordionItem key="3" aria-label="Accordion 3" title="Accordion 3">
				{defaultContent}
			</AccordionItem>
		</Accordion>
	);
}

export function CategoryMenu({
	onSelect,
	selected,
}: {
	onSelect?: (category: string) => void;
	selected?: string;
}) {
	const appApi = useAppApi();

	const categories = useAppSelector(CategorySlice.selectors.selectCategories);

	console.log("categories", categories);

	return (
		<Accordion showDivider={false} isCompact variant="splitted">
			{categories.map((category) => {
				return (
					<AccordionItem
						// className="shadow-none"
						hideIndicator={!category.children.length}
						title={category.locales[0].value}
					>
						<div className="flex flex-col gap-2">
							{category.children.map((childCategory) => {
								return (
									<Button
										onPress={() => {
											onSelect?.(
												selected === childCategory.locales[0].value
													? ""
													: childCategory.locales[0].value
											);
										}}
										color="secondary"
										variant={
											selected === childCategory.locales[0].value ? "solid" : "light"
										}
									>
										{childCategory.locales[0].value}
									</Button>
								);
							})}
						</div>
					</AccordionItem>
				);
			})}
		</Accordion>
	);
}
