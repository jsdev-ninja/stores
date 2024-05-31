import AllCategories from "../../../transformed_categories.json";

import { navigate } from "src/navigation";

export function Home() {
	const rootCategories = AllCategories.filter((category) => !category.parentId);

	return (
		<div className="p-4 overflow-auto">
			<div className="">
				<div className="flex flex-col gap-8">
					{rootCategories.map((category) => {
						const subCategories = AllCategories.filter(
							(categoryItem) => categoryItem.parentId === category.id
						);

						return (
							<div
								onClick={() => {
									navigate("store.catalog");
								}}
								key={category.id}
								className="flex flex-col gap-5"
							>
								<div className="text-lg font-semibold">{category.displayName}</div>
								<div className="flex gap-2 items-center flex-wrap">
									{subCategories.map((subCategory) => (
										<div
											key={subCategory.name}
											className="shadow p-4 bg-blue-100 rounded"
										>
											{subCategory.displayName}
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
