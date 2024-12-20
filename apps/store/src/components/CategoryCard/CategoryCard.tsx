import { TCategory } from "@jsdev_ninja/core";

export function CategoryCard({ category }: { category: TCategory }) {
	return <div className="border w-64 h-32 rounded-lg p-4">{category.locales[0].value}</div>;
}
