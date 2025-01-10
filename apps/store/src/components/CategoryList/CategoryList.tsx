import { TCategory } from "@jsdev_ninja/core";
import { CategoryCard } from "../CategoryCard/CategoryCard";

export const CategoryList = ({ categories }: { categories: TCategory[] }) => {
	return (
		<div className="flex flex-col gap-8 flex-grow">
			{categories.map((category) => {
				return (
					<div key={category.id} className="flex flex-col gap-4">
						<div className="">{category.locales[0].value}</div>
						<div className="flex gap-4 flex-wrap">
							{category.children.map((subCategory) => {
								return (
									<CategoryCard
										onClick={() => {
											// setSelectedCategory({
											// 	...selectedCategory,
											// 	"0": category.locales[0].value,
											// 	"1": subCategory.locales[0].value,
											// })
										}}
										category={subCategory}
										key={subCategory.id}
									/>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
};
