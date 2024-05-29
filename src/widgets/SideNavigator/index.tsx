import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FirebaseApi } from "src/lib/firebase";

import AllCategories from "../../../transformed_categories.json";
import { TCategory } from "src/domains/Category";
import { List } from "src/components/List";
import { Link, navigate } from "src/navigation";

export const SideNavigator = () => {
	const [selectedKeys, setSelectedKeys] = React.useState(new Set(["text"]));

	const { t } = useTranslation();

	const [categories, setCategories] = useState<Array<TCategory>>([]);
	useEffect(() => {
		FirebaseApi.firestore
			.list(FirebaseApi.firestore.collections.categories)
			.then((res) => setCategories(res.data));
	}, []);

	const rootCategories = AllCategories.filter((category) => !category.parent);

	const selectedCategory = React.useMemo(
		() => Array.from(selectedKeys).join(", "),
		[selectedKeys]
	);

	console.log("categories side", categories);

	return (
		<div id="SideNavigator" className="flex-grow max-h-full">
			<div className="flex flex-col gap-2">
				<List>
					{rootCategories.map((category) => {
						const subCategories = AllCategories.filter(
							(categoryItem) => categoryItem.parentId === category.id
						);

						console.log("subCategories", subCategories);

						return (
							<List.Item
								onClick={() => {
									navigate("store.catalog");
								}}
								value={category.id}
							>
								{category.displayName}
							</List.Item>
						);
					})}
				</List>
			</div>
		</div>
	);
};
