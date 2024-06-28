import { List } from "src/components/List";
import { Link, Route, routes } from "src/navigation";
import { AddProductPage } from "../AddProductPage";
import { AdminProductsPage } from "../AdminProductsPage";
import { AdminCategoriesPages } from "../AdminCategoriesPages";
import { AddCategoryPage } from "../AddCategoryPage";
import { RouteKeys } from "src/lib/router/types";
import { EditProductPage } from "../EditProductPage/EditProductPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const items: Array<{ name: string; path: RouteKeys<typeof routes>; params?: any }> = [
	{
		name: "products",
		path: "admin.products",
	},
	{ name: "category", path: "admin.categories" },
];

export function AdminPage() {
	return (
		<div className="flex h-screen">
			<div className="border w-1/4">
				<div className="">
					<List>
						{items.map((item) => {
							return (
								<List.Item key={item.name}>
									<Link params={item.params} to={item.path}>
										{item.name}
									</Link>
								</List.Item>
							);
						})}
					</List>
				</div>
			</div>
			<div className="w-full">
				<Route name="admin.addProduct">
					<AddProductPage />
				</Route>
				<Route name="admin.editProduct">
					<EditProductPage />
				</Route>
				<Route name="admin.products">
					<AdminProductsPage />
				</Route>
				<Route name="admin.categories">
					<AdminCategoriesPages />
				</Route>
				<Route name="admin.addCategory">
					<AddCategoryPage />
				</Route>
			</div>
		</div>
	);
}
