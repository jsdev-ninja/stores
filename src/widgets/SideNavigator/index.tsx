import React, { useMemo } from "react";
import { Listbox, ListboxItem } from "@nextui-org/react";
import { Category } from "src/shared/types/Category";
import { useTranslation } from "react-i18next";
import { Accordion } from "src/shared";

export const SideNavigator = () => {
	const [selectedKeys, setSelectedKeys] = React.useState(new Set(["text"]));

	const { t } = useTranslation();

	const categories = useMemo<Array<Category>>(() => {
		return [
			{
				id: "frozenFruitsAndVegetables",
				name: t("categories.frozenFruitsAndVegetables"),
				parent: "",
			},
			{
				id: "delicatessen",
				name: t("categories.delicatessen"),
				parent: "",
			},
			{
				id: "pastramiAndSausages",
				name: t("categories.pastramiAndSausages"),
				parent: "delicatessen",
			},
		];
	}, [t]);

	const rootCategories = categories.filter((category) => category.parent === "");

	const selectedCategory = React.useMemo(
		() => Array.from(selectedKeys).join(", "),
		[selectedKeys]
	);

	return (
		<div id="SideNavigator" className="w-[300px]">
			<div className="flex flex-col gap-2">
				<Accordion>
					{rootCategories.map((category) => {
						const subCategories = categories.filter(
							(categoryItem) => categoryItem.parent === category.id
						);

						return (
							<Accordion.Item value={category.id}>
								<Accordion.Trigger>{category.name}</Accordion.Trigger>
								<Accordion.Content>
									<Accordion>
										{subCategories.map((subCategory) => {
											return (
												<Accordion.Item value={subCategory.id}>
													<Accordion.Trigger>{subCategory.name}</Accordion.Trigger>
												</Accordion.Item>
											);
										})}
									</Accordion>
								</Accordion.Content>
							</Accordion.Item>
						);
					})}
				</Accordion>
			</div>
		</div>
	);
};
