import { useEffect, useState } from "react";
import { Button } from "src/components/Button/Button";
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

	function addCategory() {
		setCategories([
			{
				children: [],
				companyId: "",
				id: crypto.randomUUID(),
				locales: [{ lang: "he", value: "new category" }],
				tag: "",
				storeId: "",
				parentId: "",
			},
			...categories,
		]);
	}

	// todo: fix ltr
	return (
		<div className="w-full border p-20 ltr flex flex-grow  gap-5">
			{!!categories.length && (
				<CategoryTree setCategories={setCategories} categories={categories} />
			)}
			<div className="border w-80 p-4 flex flex-col sticky top-20 h-[80vh] self-start">
				<div className="">
					<Button fullWidth onClick={addCategory}>
						Add Category
					</Button>
				</div>
				<div className="mt-auto">
					<Button>Save</Button>
				</div>
			</div>
		</div>
	);
}
