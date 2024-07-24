import { useEffect, useState } from "react";
// import { List } from "src/components/List";
import { TCategory } from "src/domains/Category";
import { FirebaseApi } from "src/lib/firebase";
// import { Link } from "src/navigation";
import { CategoryTree } from "src/widgets/Category/CategoryTree/CategoryTree";

// import { CategoryItem } from "./AdminCategoriesPage/CategoryItem";
// import { CategoriesTree } from "./AdminCategoriesPage/CategoriesTree";

export function AdminCategoriesPages() {
	const [categories, setCategories] = useState<Array<TCategory>>([]);
	useEffect(() => {
		FirebaseApi.firestore
			.get<{ categories: TCategory[]; id: string }>(
				"dhXXgvpn1wyTfqxoQfr0",
				FirebaseApi.firestore.collections.categories
			)
			.then((res) => {
				console.log("res", res);
				setCategories(res.data?.categories ?? []);
			});
	}, []);
	console.log("categories", categories);

	return (
		<div className="w-full border p-20 ltr">
			<div className=""></div>
			{!!categories.length && <CategoryTree categories={categories} removable />}
			{/* <div className="w-full">
				<List>
					{categories.map((category) => {
						return <List.Item key={category.id}>{category.locales[0].value}</List.Item>;
					})}
				</List>
			</div>
			<hr className="mt-16 w-full" />
			<Link to="admin.addCategory">add category</Link> */}
		</div>
	);
}
