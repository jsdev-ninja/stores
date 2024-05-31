import { useEffect, useState } from "react";
import { List } from "src/components/List";
import { TCategory } from "src/domains/Category";
import { FirebaseApi } from "src/lib/firebase";
import { Link } from "src/navigation";

export function AdminCategoriesPages() {
	const [categories, setCategories] = useState<Array<TCategory>>([]);
	useEffect(() => {
		FirebaseApi.firestore
			.list(FirebaseApi.firestore.collections.categories)
			.then((res) => setCategories(res.data ?? []));
	}, []);
	return (
		<div className="w-full border">
			<div className="w-full">
				<List>
					{categories.map((category) => {
						return <List.Item key={category.id}>{category.name}</List.Item>;
					})}
				</List>
			</div>
			<hr className="mt-16 w-full" />
			<Link to="admin.addCategory">add category</Link>
		</div>
	);
}
