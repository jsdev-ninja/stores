import { List } from "src/components/List";
import { Link, Route } from "src/navigation";
import { AddProductPage } from "../admin/AddProductPage";
import { AdminProductsPage } from "../admin/AdminProductsPage";
import { AdminCategoriesPages } from "../admin/AdminCategoriesPages";

const items = [
	{
		name: "products",
		path: "admin.products",
	},
	{ name: "category", path: "admin.categories" },
];

export function AdminPage() {
	console.log('RENDER');
	
	return (
		<div className="flex h-screen">
			<div className="border w-1/4">
				<div className="">
					<List>
						{items.map((item) => {
							return (
								<List.Item key={item.name}>
									<Link to={item.path}>{item.name}</Link>
								</List.Item>
							);
						})}
					</List>
				</div>
			</div>
			<div className="">
				<Route name="admin.addProduct">
					<AddProductPage />
				</Route>
				<Route name="admin.products">
					<AdminProductsPage />
				</Route>
				<Route name="admin.categories">
					<AdminCategoriesPages />
				</Route>
				<Route name="admin.categories.add">add</Route>
			</div>
		</div>
	);
}
