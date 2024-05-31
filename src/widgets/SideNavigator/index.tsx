import AllCategories from "../../../transformed_categories.json";
import { List } from "src/components/List";

export const SideNavigator = () => {
	const rootCategories = AllCategories.filter((category) => !category.parentId);

	return (
		<div id="SideNavigator" className="flex-grow max-h-full">
			<div className="flex flex-col gap-2">
				<List>
					{rootCategories.map((category) => {
						return (
							<List.Item onClick={() => {}} value={category.id}>
								{category.displayName}
							</List.Item>
						);
					})}
				</List>
			</div>
		</div>
	);
};
