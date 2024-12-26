import { TCategory } from "@jsdev_ninja/core";

export function CategoryCard({
	category,
	onClick,
}: {
	category: TCategory;
	onClick?: (category: TCategory) => void;
}) {
	return (
		<div
			onClick={() => onClick?.(category)}
			className="border w-64 h-32 rounded-lg p-4 bg-green-400 text-white text-2xl cursor-pointer"
		>
			{category.locales[0].value}
		</div>
	);
}
