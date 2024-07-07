import { useAppSelector } from "src/infra";
import { List } from "src/components/List";
import { CategorySlice } from "src/domains/Category";

export const SideNavigator = () => {
	const rootCategories = useAppSelector(CategorySlice.selectors.selectCategories).filter(
		(c) => !c.parentId
	);

	return (
		<div id="SideNavigator" className="flex-grow max-h-full">
			<div className="flex flex-col gap-2">
				<List>
					{rootCategories.map((category) => {
						return (
							<List.Item onClick={() => {}} value={category.id}>
								{category.locales[0]?.value}
							</List.Item>
						);
					})}
				</List>
			</div>
		</div>
	);
};
