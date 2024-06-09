import { List } from "src/components/List";
import { Link, Route, routes } from "src/navigation";
import { AddProductPage } from "../admin/AddProductPage";
import { AdminProductsPage } from "../admin/AdminProductsPage";
import { AdminCategoriesPages } from "../admin/AdminCategoriesPages";
import { AddCategoryPage } from "../admin/AddCategoryPage";
import { RouteKeys } from "src/lib/router/types";

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
					<AddProductPage />
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
